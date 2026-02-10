import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Plus, Search, Users, Mail, Clock, MoreVertical, Edit2, Trash2, Building2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { glassStyles } from "@/lib/glassmorphic-design";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  leadUserId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  code: string;
  isActive: boolean;
}

export default function Teams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teams from Supabase
  const { data: teams, isLoading, error } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("createdAt", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch departments for the dropdown
  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("isActive", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  const filteredTeams = teams?.filter(
    (team) =>
      (team.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsDialogOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <TeamsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-sm text-destructive">Error loading teams</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Teams</h1>
          <p className="text-xs text-muted-foreground">
            Manage support teams and their assignments
          </p>
        </div>
        <Button
          onClick={handleAddTeam}
          className={glassStyles.buttons.primary}
          data-testid="button-add-team"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`pl-9 ${glassStyles.inputs.default}`}
          data-testid="input-search-teams"
        />
      </div>

      {filteredTeams && filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEditTeam}
              departments={departments || []}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No teams found"
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Create your first team to get started"
          }
          action={
            !searchQuery
              ? { label: "Add Team", onClick: handleAddTeam }
              : undefined
          }
        />
      )}

      <TeamDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        team={editingTeam}
        departments={departments || []}
      />
    </div>
  );
}

function TeamCard({
  team,
  onEdit,
  departments,
}: {
  team: Team;
  onEdit: (team: Team) => void;
  departments: Department[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({
        title: "Team deleted",
        description: "The team has been successfully deleted.",
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
    if (confirm(`Are you sure you want to delete ${team.name}?`)) {
      deleteMutation.mutate(team.id);
    }
  };

  const department = departments.find((d) => d.id === team.departmentId);

  return (
    <Card className={`${glassStyles.cards.primary} hover:shadow-2xl transition-all duration-300`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-slate-900/90 to-slate-800/90">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{team.name}</h3>
              {department && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground truncate">
                    {department.name}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`button-team-menu-${team.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={glassStyles.cards.primary}>
              <DropdownMenuItem onClick={() => onEdit(team)}>
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

        {team.description && (
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
            {team.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Badge
            variant={team.isActive ? "default" : "secondary"}
            className={`text-xs ${team.isActive ? glassStyles.badges.primary : glassStyles.badges.secondary}`}
          >
            {team.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamDialog({
  open,
  onOpenChange,
  team,
  departments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  departments: Department[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentId: "",
    isActive: true,
  });

  // Reset form when dialog opens or team changes
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || "",
        departmentId: team.departmentId || "",
        isActive: team.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        departmentId: "",
        isActive: true,
      });
    }
  }, [team, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (team) {
        // Update existing team
        const { error } = await supabase
          .from("teams")
          .update({
            name: data.name,
            description: data.description || null,
            departmentId: data.departmentId || null,
            isActive: data.isActive,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", team.id);

        if (error) throw error;
      } else {
        // Create new team
        const { error } = await supabase.from("teams").insert({
          name: data.name,
          description: data.description || null,
          departmentId: data.departmentId || null,
          isActive: data.isActive,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({
        title: team ? "Team updated" : "Team created",
        description: team
          ? "The team has been successfully updated."
          : "The team has been successfully created.",
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
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Team name is required",
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
            {team ? "Edit Team" : "Add New Team"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">
              Team Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={glassStyles.inputs.default}
              placeholder="e.g., Customer Support"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={glassStyles.inputs.default}
              placeholder="Brief description of the team's responsibilities"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm">
              Department
            </Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) =>
                setFormData({ ...formData, departmentId: value })
              }
            >
              <SelectTrigger className={glassStyles.inputs.default}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className={glassStyles.cards.primary}>
                <SelectItem value="">None</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                : team
                  ? "Update Team"
                  : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className={glassStyles.cards.primary}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="mt-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
