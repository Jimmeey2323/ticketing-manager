import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Plus, Search, Building2, MapPin, Phone, Mail, MoreVertical, Edit2, Trash2, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { glassStyles } from "@/lib/glassmorphic-design";
import { useToast } from "@/hooks/use-toast";

interface Studio {
  id: string;
  name: string;
  code: string;
  address: any;
  phone: string | null;
  email: string | null;
  managerUserId: string | null;
  timeZone: string;
  operatingHours: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StudioStats {
  totalTickets: number;
  activeTickets: number;
  resolvedTickets: number;
}

export default function Studios() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch studios from Supabase
  const { data: studios, isLoading, error } = useQuery<Studio[]>({
    queryKey: ["studios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studios")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch studio statistics
  const { data: studioStats } = useQuery<Record<string, StudioStats>>({
    queryKey: ["studio-stats"],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("studioId, status");

      if (error) throw error;

      const stats: Record<string, StudioStats> = {};
      tickets?.forEach((ticket) => {
        if (!ticket.studioId) return;
        if (!stats[ticket.studioId]) {
          stats[ticket.studioId] = {
            totalTickets: 0,
            activeTickets: 0,
            resolvedTickets: 0,
          };
        }
        stats[ticket.studioId].totalTickets++;
        if (["new", "assigned", "in_progress", "pending_customer"].includes(ticket.status || "")) {
          stats[ticket.studioId].activeTickets++;
        }
        if (ticket.status === "resolved" || ticket.status === "closed") {
          stats[ticket.studioId].resolvedTickets++;
        }
      });

      return stats;
    },
  });

  const filteredStudios = studios?.filter(
    (studio) =>
      (studio.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (studio.code ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof studio.address === 'string' ? studio.address : JSON.stringify(studio.address)).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStudio = () => {
    setEditingStudio(null);
    setIsDialogOpen(true);
  };

  const handleEditStudio = (studio: Studio) => {
    setEditingStudio(studio);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <StudiosSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-sm text-destructive">Error loading studios</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Studios</h1>
          <p className="text-xs text-muted-foreground">
            Manage studio locations and contacts
          </p>
        </div>
        <Button
          onClick={handleAddStudio}
          className={glassStyles.buttons.primary}
          data-testid="button-add-studio"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Studio
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search studios..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`pl-9 ${glassStyles.inputs.default}`}
          data-testid="input-search-studios"
        />
      </div>

      {filteredStudios && filteredStudios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudios.map((studio) => (
            <StudioCard
              key={studio.id}
              studio={studio}
              stats={studioStats?.[studio.id]}
              onEdit={handleEditStudio}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No studios found"
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Create your first studio to get started"
          }
          action={
            !searchQuery
              ? { label: "Add Studio", onClick: handleAddStudio }
              : undefined
          }
        />
      )}

      <StudioDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        studio={editingStudio}
      />
    </div>
  );
}

function StudioCard({
  studio,
  stats,
  onEdit,
}: {
  studio: Studio;
  stats?: StudioStats;
  onEdit: (studio: Studio) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("studios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
      toast({
        title: "Studio deleted",
        description: "The studio has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${studio.name}?`)) {
      deleteMutation.mutate(studio.id);
    }
  };

  const addressString = typeof studio.address === 'string'
    ? studio.address
    : studio.address?.street || studio.address?.city || JSON.stringify(studio.address);

  return (
    <Card className={`${glassStyles.cards.primary} hover:shadow-2xl transition-all duration-300`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-slate-900/90 to-slate-800/90">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{studio.name}</h3>
              {studio.code && (
                <p className="text-xs text-muted-foreground truncate">
                  {studio.code}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-studio-menu-${studio.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={glassStyles.cards.primary}>
              <DropdownMenuItem onClick={() => onEdit(studio)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          {addressString && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{addressString}</span>
            </div>
          )}
          {studio.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{studio.email}</span>
            </div>
          )}
          {studio.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{studio.phone}</span>
            </div>
          )}
        </div>

        {stats && (
          <div className={`mt-4 p-2 rounded-lg ${glassStyles.cards.secondary}`}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {stats.totalTickets}
                </div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-blue-600">
                  {stats.activeTickets}
                </div>
                <div className="text-[10px] text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-600">
                  {stats.resolvedTickets}
                </div>
                <div className="text-[10px] text-muted-foreground">Resolved</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Badge
            variant={studio.isActive ? "default" : "secondary"}
            className={`text-xs ${studio.isActive ? glassStyles.badges.primary : glassStyles.badges.secondary}`}
          >
            {studio.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function StudioDialog({
  open,
  onOpenChange,
  studio,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studio: Studio | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    timeZone: "Asia/Kolkata",
    isActive: true,
  });

  // Reset form when dialog opens or studio changes
  useEffect(() => {
    if (studio) {
      const addressStr = typeof studio.address === 'string'
        ? studio.address
        : JSON.stringify(studio.address);

      setFormData({
        name: studio.name,
        code: studio.code,
        address: addressStr,
        phone: studio.phone || "",
        email: studio.email || "",
        timeZone: studio.timeZone || "Asia/Kolkata",
        isActive: studio.isActive,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        address: "",
        phone: "",
        email: "",
        timeZone: "Asia/Kolkata",
        isActive: true,
      });
    }
  }, [studio, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (studio) {
        // Update existing studio
        const { error } = await supabase
          .from("studios")
          .update({
            name: data.name,
            code: data.code,
            address: data.address || null,
            phone: data.phone || null,
            email: data.email || null,
            timeZone: data.timeZone,
            isActive: data.isActive,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", studio.id);

        if (error) throw error;
      } else {
        // Create new studio
        const { error } = await supabase.from("studios").insert({
          name: data.name,
          code: data.code,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          timeZone: data.timeZone,
          isActive: data.isActive,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
      toast({
        title: studio ? "Studio updated" : "Studio created",
        description: studio
          ? "The studio has been successfully updated."
          : "The studio has been successfully created.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Validation error",
        description: "Studio name and code are required",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={glassStyles.cards.primary}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {studio ? "Edit Studio" : "Add New Studio"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">
                Studio Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={glassStyles.inputs.default}
                placeholder="e.g., Mumbai Studio"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm">
                Code *
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className={glassStyles.inputs.default}
                placeholder="e.g., MUM-001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className={glassStyles.inputs.default}
              placeholder="Full studio address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={glassStyles.inputs.default}
                placeholder="studio@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={glassStyles.inputs.default}
                placeholder="+91 1234567890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeZone" className="text-sm">
              Time Zone
            </Label>
            <Input
              id="timeZone"
              value={formData.timeZone}
              onChange={(e) =>
                setFormData({ ...formData, timeZone: e.target.value })
              }
              className={glassStyles.inputs.default}
              placeholder="Asia/Kolkata"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="isActive" className="text-sm cursor-pointer">
              Active
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={glassStyles.buttons.ghost}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className={glassStyles.buttons.primary}
            >
              {saveMutation.isPending
                ? "Saving..."
                : studio
                  ? "Update Studio"
                  : "Create Studio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StudiosSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className={glassStyles.cards.primary}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
