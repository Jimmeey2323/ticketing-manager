import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, User, Clock, X, Search, ChevronDown, MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ClassSession {
  id: number;
  name: string;
  type?: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  durationInMinutes: number;
  capacity: number;
  bookingCount?: number;
  teacher?: {
    id: number;
    firstName: string;
    lastName: string;
    pictureUrl?: string;
  };
  isRecurring?: boolean;
  isCancelled?: boolean;
  isInPerson?: boolean;
  isDraft?: boolean;
  inPersonLocation?: {
    id: number;
    name: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    badgeColor?: string;
  }>;
  // Formatted display string
  displayLabel?: string;
}

interface ClassSelectorProps {
  onClassSelect: (session: ClassSession | null) => void;
  selectedClass: ClassSession | null;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  onMultipleSelect?: (sessions: ClassSession[]) => void;
  selectedClasses?: ClassSession[];
}

// Format class for dropdown display: Class Name | Date | Time | Teacher Name
const formatClassLabel = (session: ClassSession): string => {
  const date = format(new Date(session.startsAt), "MMM d, yyyy");
  const time = format(new Date(session.startsAt), "h:mm a");
  const teacherName = session.teacher 
    ? `${session.teacher.firstName} ${session.teacher.lastName}`.trim() 
    : "No Teacher";
  
  return `${session.name} | ${date} | ${time} | ${teacherName}`;
};

export function ClassSelector({ 
  onClassSelect, 
  selectedClass,
  label = "Select Class",
  placeholder = "Search and select a class...",
  multiple = false,
  onMultipleSelect,
  selectedClasses = []
}: ClassSelectorProps) {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { toast } = useToast();

  const loadSessions = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("momence-api", {
        body: { action: "getSessions", pageSize: 200 },
      });

      if (error) throw error;
      
      // Filter out cancelled/draft and format sessions
      const validSessions = (data?.payload || [])
        .filter((s: ClassSession) => !s.isCancelled && !s.isDraft)
        .map((s: ClassSession) => ({
          ...s,
          displayLabel: formatClassLabel(s)
        }));
      
      setSessions(validSessions);
      setFilteredSessions(validSessions);
      setHasLoadedOnce(true);
      console.log("ClassSelector: Loaded", validSessions.length, "sessions");
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast({
        title: "Failed to Load Classes",
        description: "Could not load class sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isLoading]);

  // Auto-load sessions on first open
  useEffect(() => {
    if (isOpen && !hasLoadedOnce) {
      loadSessions();
    }
  }, [isOpen, hasLoadedOnce, loadSessions]);

  // Filter sessions by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSessions(
        sessions.filter((s) =>
          s.name?.toLowerCase().includes(query) ||
          s.teacher?.firstName?.toLowerCase().includes(query) ||
          s.teacher?.lastName?.toLowerCase().includes(query) ||
          s.inPersonLocation?.name?.toLowerCase().includes(query) ||
          s.displayLabel?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, sessions]);

  const handleSelectSession = (session: ClassSession) => {
    if (multiple && onMultipleSelect) {
      const isAlreadySelected = selectedClasses.some(s => s.id === session.id);
      if (isAlreadySelected) {
        onMultipleSelect(selectedClasses.filter(s => s.id !== session.id));
      } else {
        onMultipleSelect([...selectedClasses, session]);
      }
    } else {
      onClassSelect(session);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const handleClearSession = () => {
    onClassSelect(null);
  };

  const isSessionSelected = (sessionId: number) => {
    if (multiple) {
      return selectedClasses.some(s => s.id === sessionId);
    }
    return selectedClass?.id === sessionId;
  };

  const removeFromMultiple = (sessionId: number) => {
    if (onMultipleSelect) {
      onMultipleSelect(selectedClasses.filter(s => s.id !== sessionId));
    }
  };

  // Multiple selection display
  if (multiple && selectedClasses.length > 0) {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{label} ({selectedClasses.length} selected)</Label>
        <div className="space-y-2">
          {selectedClasses.map((session) => (
            <Card key={session.id} className="border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.startsAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.startsAt), "h:mm a")}
                      </span>
                      {session.teacher && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {session.teacher.firstName} {session.teacher.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFromMultiple(session.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add More Classes
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[450px] p-0 bg-popover border border-border shadow-lg z-50" align="start">
            <SessionSearchContent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isLoading={isLoading}
              filteredSessions={filteredSessions}
              handleSelectSession={handleSelectSession}
              isSessionSelected={isSessionSelected}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Single selection with selected class display
  if (!multiple && selectedClass) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <p className="font-medium">{selectedClass.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedClass.startsAt), "MMM d, yyyy h:mm a")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedClass.durationInMinutes} mins
                  </span>
                </div>
                {selectedClass.teacher && (
                  <p className="text-sm flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selectedClass.teacher.firstName} {selectedClass.teacher.lastName}
                  </p>
                )}
                {selectedClass.inPersonLocation && (
                  <p className="text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedClass.inPersonLocation.name}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearSession}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedClass.tags && selectedClass.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedClass.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    style={{ backgroundColor: tag.badgeColor || undefined }}
                    className="text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Dropdown trigger
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {placeholder}
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] p-0 bg-popover border border-border shadow-lg z-50" align="start">
          <SessionSearchContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoading={isLoading}
            filteredSessions={filteredSessions}
            handleSelectSession={handleSelectSession}
            isSessionSelected={isSessionSelected}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Extracted search content for reuse
function SessionSearchContent({
  searchQuery,
  setSearchQuery,
  isLoading,
  filteredSessions,
  handleSelectSession,
  isSessionSelected
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  filteredSessions: ClassSession[];
  handleSelectSession: (s: ClassSession) => void;
  isSessionSelected: (id: number) => boolean;
}) {
  return (
    <>
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by class name, teacher, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Format: Class Name | Date | Time | Teacher Name
        </p>
      </div>

      <ScrollArea className="h-[350px]">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="p-2 space-y-1">
            {filteredSessions.map((session) => {
              const selected = isSessionSelected(session.id);
              return (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    selected 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'hover:bg-accent border-transparent hover:border-border'
                  }`}
                  onClick={() => handleSelectSession(session)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Formatted display label */}
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.displayLabel}
                      </p>
                      {/* Additional details */}
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{session.durationInMinutes} mins</span>
                        {session.inPersonLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.inPersonLocation.name}
                          </span>
                        )}
                        {session.bookingCount !== undefined && (
                          <span>{session.bookingCount}/{session.capacity} booked</span>
                        )}
                      </div>
                    </div>
                    {selected && (
                      <Badge variant="default" className="shrink-0">Selected</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No classes match your search." : "No upcoming classes available."}
          </div>
        )}
      </ScrollArea>
    </>
  );
}

export default ClassSelector;
