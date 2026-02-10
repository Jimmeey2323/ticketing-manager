import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import {
  Search,
  Plus,
  Download,
  ChevronDown,
  X,
  SlidersHorizontal,
  Ticket,
  Calendar,
  User,
  Building2,
  Clock,
  AlertTriangle,
  BarChart3,
  Eye,
  Edit3,
  Star,
  TrendingUp,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  RefreshCw,
  Sparkles,
  Brain,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Meh,
  TrendingDown,
  Activity,
  Target,
  UserPlus,
  ChevronRight,
  ChevronUp,
  MoreHorizontal,
  Check,
  Send,
  MessageSquare,
  AlertCircle,
  Copy,
  Trash2,
  Archive,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { TicketCardSkeleton } from "@/components/loading-skeleton";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import { TrainerFeedbackModal } from "@/components/trainer-feedback-modal";
import { PRIORITIES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { glassStyles } from "@/lib/glassmorphic-design";

const STATUSES = {
  new: { label: "New", color: "bg-blue-500" },
  assigned: { label: "Assigned", color: "bg-blue-600" },
  in_progress: { label: "In Progress", color: "bg-amber-500" },
  pending_customer: { label: "Pending Customer", color: "bg-orange-500" },
  resolved: { label: "Resolved", color: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-slate-500" },
  reopened: { label: "Reopened", color: "bg-red-500" },
};

const SOURCES = {
  "in-person": "In Person",
  "phone": "Phone",
  "email": "Email",
  "app": "Mobile App",
  "website": "Website",
  "social": "Social Media",
};

export default function Tickets() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [studioFilter, setStudioFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "list" | "grid" | "compact" | "kanban" | "grouped">("table");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<"category" | "priority" | "status" | "studio" | "assignee">("category");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any>>({});
  const [showSmartFilters, setShowSmartFilters] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Fetch categories from Supabase
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, code')
        .eq('isActive', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch studios from Supabase
  const { data: studios = [] } = useQuery({
    queryKey: ['studios-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name, code')
        .eq('isActive', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch users for assignee filter
  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, firstName, lastName, displayName, email')
        .eq('isActive', true)
        .order('displayName');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tickets from Supabase with filters
  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['tickets', searchQuery, statusFilter, priorityFilter, categoryFilter, studioFilter, sourceFilter, assigneeFilter, dateRange, slaFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          category:categories(id, name, code, icon, color),
          subcategory:subcategories(id, name, code),
          studio:studios(id, name, code),
          assignedTo:users!tickets_assignedToUserId_fkey(id, firstName, lastName, displayName, email),
          reportedBy:users!tickets_reportedByUserId_fkey(id, firstName, lastName, displayName)
        `);

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      if (priorityFilter !== "all") {
        query = query.eq('priority', priorityFilter);
      }
      if (categoryFilter !== "all") {
        query = query.eq('categoryId', categoryFilter);
      }
      if (studioFilter !== "all") {
        query = query.eq('studioId', studioFilter);
      }
      if (sourceFilter !== "all") {
        query = query.eq('source', sourceFilter);
      }
      if (assigneeFilter !== "all") {
        if (assigneeFilter === "unassigned") {
          query = query.is('assignedToUserId', null);
        } else {
          query = query.eq('assignedToUserId', assigneeFilter);
        }
      }
      if (slaFilter === "breached") {
        query = query.eq('slaBreached', true);
      } else if (slaFilter === "at-risk") {
        query = query.eq('slaBreached', false).not('slaDueAt', 'is', null);
      }
      if (searchQuery) {
        query = query.or(`ticketNumber.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,customerName.ilike.%${searchQuery}%,customerEmail.ilike.%${searchQuery}%`);
      }

      // Apply date range filter
      if (dateRange !== "all") {
        const now = new Date();
        let startDate: Date;
        switch (dateRange) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case "quarter":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte('createdAt', startDate.toISOString());
      }

      // Apply sorting
      switch (sortBy) {
        case "oldest":
          query = query.order('createdAt', { ascending: true });
          break;
        case "priority":
          query = query.order('priority', { ascending: false }).order('createdAt', { ascending: false });
          break;
        case "updated":
          query = query.order('updatedAt', { ascending: false });
          break;
        default:
          query = query.order('createdAt', { ascending: false });
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // AI Analysis Function
  const analyzeTicketsWithAI = async (ticketIds: string[]) => {
    if (ticketIds.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis (replace with actual Supabase Edge Function call)
      // const { data, error } = await supabase.functions.invoke('analyze-tickets-batch', {
      //   body: { ticketIds }
      // });

      // Mock AI analysis for demonstration
      const mockAnalysis: Record<string, any> = {};
      ticketIds.forEach(id => {
        const ticket = tickets?.find((t: any) => t.id === id);
        if (!ticket) return;

        // Calculate urgency score based on priority, age, and SLA
        const priorityScore = {
          critical: 90,
          high: 70,
          medium: 50,
          low: 30
        }[ticket.priority || 'medium'] || 50;

        const ageHours = ticket.createdAt ? differenceInHours(new Date(), new Date(ticket.createdAt)) : 0;
        const ageScore = Math.min(ageHours / 24 * 20, 20); // Up to 20 points for age

        const slaScore = ticket.slaBreached ? 30 : (ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date()) ? 20 : 0;

        const urgencyScore = Math.min(priorityScore + ageScore + slaScore, 100);

        // Sentiment analysis based on title/description keywords
        const text = `${ticket.title} ${ticket.description || ''}`.toLowerCase();
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (text.includes('thank') || text.includes('great') || text.includes('love') || text.includes('excellent')) {
          sentiment = 'positive';
        } else if (text.includes('urgent') || text.includes('broken') || text.includes('not working') ||
                   text.includes('frustrated') || text.includes('angry') || text.includes('poor')) {
          sentiment = 'negative';
        }

        // Escalation risk
        let escalationRisk: 'low' | 'medium' | 'high' = 'low';
        if (urgencyScore > 80 || ticket.priority === 'critical' || ticket.slaBreached) {
          escalationRisk = 'high';
        } else if (urgencyScore > 60 || ticket.priority === 'high' || sentiment === 'negative') {
          escalationRisk = 'medium';
        }

        // Customer impact (1-5 stars)
        let customerImpact = 3;
        if (sentiment === 'negative' || ticket.clientMood === 'angry' || ticket.clientMood === 'frustrated') {
          customerImpact = 1;
        } else if (sentiment === 'positive' || ticket.clientMood === 'happy') {
          customerImpact = 5;
        } else if (urgencyScore > 70) {
          customerImpact = 2;
        }

        mockAnalysis[id] = {
          sentiment,
          urgencyScore: Math.round(urgencyScore),
          escalationRisk,
          customerImpact,
          suggestedActions: [
            urgencyScore > 80 ? 'Escalate immediately' : null,
            !ticket.assignedToUserId ? 'Assign to team member' : null,
            ticket.slaBreached ? 'Notify manager - SLA breached' : null,
            sentiment === 'negative' ? 'Follow up with customer' : null,
          ].filter(Boolean),
          suggestedAssignee: null // Could be enhanced with actual user matching
        };
      });

      setAiAnalysis(prev => ({ ...prev, ...mockAnalysis }));
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze tickets with React Query
  const { data: cachedAiAnalysis } = useQuery({
    queryKey: ['ai-analysis', tickets?.map((t: any) => t.id)],
    queryFn: async () => {
      if (!tickets || tickets.length === 0) return {};
      await analyzeTicketsWithAI(tickets.map((t: any) => t.id));
      return aiAnalysis;
    },
    enabled: tickets && tickets.length > 0 && viewMode === 'table',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Smart sort function
  const smartSort = (ticketsToSort: any[]) => {
    return [...ticketsToSort].sort((a, b) => {
      const scoreA = aiAnalysis[a.id]?.urgencyScore || 0;
      const scoreB = aiAnalysis[b.id]?.urgencyScore || 0;
      return scoreB - scoreA;
    });
  };

  // Group tickets by selected field
  const groupedTickets = useMemo(() => {
    if (!tickets || viewMode !== 'grouped') return {};

    const groups: Record<string, any[]> = {};

    tickets.forEach((ticket: any) => {
      let key = 'Unknown';

      switch (groupBy) {
        case 'category':
          key = ticket.category?.name || 'Uncategorized';
          break;
        case 'priority':
          key = PRIORITIES[ticket.priority as keyof typeof PRIORITIES]?.label || 'Medium';
          break;
        case 'status':
          key = STATUSES[ticket.status as keyof typeof STATUSES]?.label || 'New';
          break;
        case 'studio':
          key = ticket.studio?.name || 'No Studio';
          break;
        case 'assignee':
          key = ticket.assignedTo?.displayName || ticket.assignedTo?.firstName || 'Unassigned';
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(ticket);
    });

    return groups;
  }, [tickets, groupBy, viewMode]);

  const toggleGroup = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey);
    } else {
      newCollapsed.add(groupKey);
    }
    setCollapsedGroups(newCollapsed);
  };

  const activeFiltersCount = [statusFilter, priorityFilter, categoryFilter, studioFilter, sourceFilter, assigneeFilter, dateRange, slaFilter]
    .filter(f => f !== "all").length;

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setStudioFilter("all");
    setSourceFilter("all");
    setAssigneeFilter("all");
    setDateRange("all");
    setSlaFilter("all");
    setSearchQuery("");
  };

  const toggleTicketSelection = (id: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTickets(newSelected);
  };

  const selectAllVisible = () => {
    if (tickets) {
      setSelectedTickets(new Set(tickets.map((t: any) => t.id)));
    }
  };

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  // Calculate stats
  const stats = tickets ? {
    total: tickets.length,
    new: tickets.filter((t: any) => t.status === 'new').length,
    inProgress: tickets.filter((t: any) => ['assigned', 'in_progress'].includes(t.status)).length,
    resolved: tickets.filter((t: any) => ['resolved', 'closed'].includes(t.status)).length,
    overdue: tickets.filter((t: any) => t.slaBreached || (t.slaDueAt && new Date(t.slaDueAt) < new Date())).length,
    critical: tickets.filter((t: any) => t.priority === 'critical').length,
  } : { total: 0, new: 0, inProgress: 0, resolved: 0, overdue: 0, critical: 0 };

  const criticalTickets = useMemo(
    () =>
      (tickets || [])
        .filter((ticket: any) => ticket.priority === "critical")
        .sort((a: any, b: any) => {
          const aDeadline = a.slaDueAt ? new Date(a.slaDueAt).getTime() : Number.MAX_SAFE_INTEGER;
          const bDeadline = b.slaDueAt ? new Date(b.slaDueAt).getTime() : Number.MAX_SAFE_INTEGER;
          return aDeadline - bDeadline;
        }),
    [tickets],
  );

  const isCriticalTicket = (ticket: any) => ticket.priority === "critical";

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Ticket className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text-accent">All Tickets</h1>
              <p className="text-sm text-muted-foreground">
                Manage and track customer feedback and issues
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="rounded-xl border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
          >
            <Star className="h-3 w-3 mr-2" />
            <span className="text-xs">Trainer Feedback</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (sortBy === 'smart') {
                setSortBy('newest');
              } else {
                setSortBy('smart');
              }
            }}
            className={cn(
              "rounded-xl border-purple-500/50 text-purple-600 hover:bg-purple-500/10",
              sortBy === 'smart' && "bg-purple-500/20"
            )}
          >
            <Brain className="h-3 w-3 mr-2" />
            <span className="text-xs">Smart Sort</span>
            {sortBy === 'smart' && <Sparkles className="h-3 w-3 ml-1" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-3 w-3 mr-2" />
            <span className="text-xs">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl border-border hover:bg-muted">
            <Download className="h-3 w-3 mr-2" />
            <span className="text-xs">Export</span>
          </Button>
          <Button asChild className="rounded-xl bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/30 font-semibold">
            <Link href="/tickets/new">
              <Plus className="h-3 w-3 mr-2" />
              <span className="text-xs">New Ticket</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Ticket, color: "from-blue-500 to-cyan-500" },
          { label: "New", value: stats.new, icon: Plus, color: "from-emerald-500 to-teal-500" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, color: "from-amber-500 to-orange-500" },
          { label: "Resolved", value: stats.resolved, icon: TrendingUp, color: "from-green-500 to-emerald-500" },
          { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "from-red-500 to-rose-500" },
          { label: "Critical", value: stats.critical, icon: AlertTriangle, color: "from-red-500 to-rose-600" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br", stat.color)}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {criticalTickets.length > 0 && (
        <Card className="critical-ticket-spotlight border-red-500/50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="critical-ticket-dot mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    Critical Response Lane
                  </p>
                  <p className="text-xs text-red-700/80">
                    {criticalTickets.length} critical ticket{criticalTickets.length === 1 ? "" : "s"} need priority handling
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {criticalTickets.slice(0, 4).map((ticket: any) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleTicketClick(ticket)}
                    className="critical-ticket-chip"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{ticket.ticketNumber}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Card */}
      <Card className={cn("border-0 shadow-xl", glassStyles.cards.primary)}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            {/* Search and View Toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticket #, title, customer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl border-border text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-xl"
              >
                <SlidersHorizontal className="h-3 w-3 mr-2" />
                <span className="text-xs">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary text-[10px]">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSmartFilters(!showSmartFilters)}
                className={cn(
                  "rounded-xl border-indigo-500/50 text-indigo-600 hover:bg-indigo-500/10",
                  showSmartFilters && "bg-indigo-500/20"
                )}
              >
                <Sparkles className="h-3 w-3 mr-2" />
                <span className="text-xs">Smart Filters</span>
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 rounded-xl text-xs">
                  <ArrowUpDown className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest"><span className="text-xs">Newest First</span></SelectItem>
                  <SelectItem value="oldest"><span className="text-xs">Oldest First</span></SelectItem>
                  <SelectItem value="priority"><span className="text-xs">By Priority</span></SelectItem>
                  <SelectItem value="updated"><span className="text-xs">Last Updated</span></SelectItem>
                  <SelectItem value="smart"><span className="text-xs flex items-center gap-1"><Brain className="h-3 w-3" />AI Smart Sort</span></SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                  <SelectTrigger className="w-36 rounded-xl text-xs">
                    <SelectValue placeholder="View mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table"><span className="text-xs">Table</span></SelectItem>
                    <SelectItem value="list"><span className="text-xs">List</span></SelectItem>
                    <SelectItem value="grid"><span className="text-xs">Grid</span></SelectItem>
                    <SelectItem value="compact"><span className="text-xs">Compact</span></SelectItem>
                    <SelectItem value="kanban"><span className="text-xs">Kanban</span></SelectItem>
                    <SelectItem value="grouped"><span className="text-xs">Grouped</span></SelectItem>
                  </SelectContent>
                </Select>
                {viewMode === "grouped" && (
                  <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                    <SelectTrigger className="w-32 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category"><span className="text-xs">By Category</span></SelectItem>
                      <SelectItem value="priority"><span className="text-xs">By Priority</span></SelectItem>
                      <SelectItem value="status"><span className="text-xs">By Status</span></SelectItem>
                      <SelectItem value="studio"><span className="text-xs">By Studio</span></SelectItem>
                      <SelectItem value="assignee"><span className="text-xs">By Assignee</span></SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Smart Filters */}
            <AnimatePresence>
              {showSmartFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={cn("p-4 rounded-xl space-y-3", glassStyles.cards.secondary)}>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-indigo-600" />
                      <h4 className="text-xs font-semibold text-indigo-900">AI-Suggested Filters</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-red-500/10 border-red-500/50 text-red-600 text-[10px] rounded-lg"
                        onClick={() => setSlaFilter("breached")}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        SLA Breached ({tickets?.filter((t: any) => t.slaBreached).length || 0})
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-500/10 border-purple-500/50 text-purple-600 text-[10px] rounded-lg"
                        onClick={() => setPriorityFilter("critical")}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Critical Priority ({tickets?.filter((t: any) => t.priority === 'critical').length || 0})
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-500/10 border-blue-500/50 text-blue-600 text-[10px] rounded-lg"
                        onClick={() => setAssigneeFilter("unassigned")}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Unassigned ({tickets?.filter((t: any) => !t.assignedToUserId).length || 0})
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-amber-500/10 border-amber-500/50 text-amber-600 text-[10px] rounded-lg"
                        onClick={() => setStatusFilter("new")}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        New Tickets ({tickets?.filter((t: any) => t.status === 'new').length || 0})
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36 rounded-xl text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All Statuses</span></SelectItem>
                        {Object.entries(STATUSES).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            <span className="text-xs">{config.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-32 rounded-xl text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All Priorities</span></SelectItem>
                        {Object.entries(PRIORITIES).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            <span className="text-xs">{config.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40 rounded-xl text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All Categories</span></SelectItem>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="text-xs">{cat.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={studioFilter} onValueChange={setStudioFilter}>
                      <SelectTrigger className="w-40 rounded-xl text-xs">
                        <SelectValue placeholder="Studio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All Studios</span></SelectItem>
                        {studios.map((studio: any) => (
                          <SelectItem key={studio.id} value={studio.id}>
                            <span className="text-xs">{studio.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-32 rounded-xl text-xs">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All Sources</span></SelectItem>
                        {Object.entries(SOURCES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <span className="text-xs">{label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger className="w-40 rounded-xl text-xs">
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All Assignees</span></SelectItem>
                        <SelectItem value="unassigned"><span className="text-xs">Unassigned</span></SelectItem>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            <span className="text-xs">{user.displayName || user.firstName || user.email}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-32 rounded-xl text-xs">
                        <Calendar className="h-3 w-3 mr-2" />
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All Time</span></SelectItem>
                        <SelectItem value="today"><span className="text-xs">Today</span></SelectItem>
                        <SelectItem value="week"><span className="text-xs">Last 7 Days</span></SelectItem>
                        <SelectItem value="month"><span className="text-xs">Last 30 Days</span></SelectItem>
                        <SelectItem value="quarter"><span className="text-xs">Last 90 Days</span></SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={slaFilter} onValueChange={setSlaFilter}>
                      <SelectTrigger className="w-32 rounded-xl text-xs">
                        <SelectValue placeholder="SLA Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all"><span className="text-xs">All SLA</span></SelectItem>
                        <SelectItem value="breached"><span className="text-xs">SLA Breached</span></SelectItem>
                        <SelectItem value="at-risk"><span className="text-xs">At Risk</span></SelectItem>
                      </SelectContent>
                    </Select>

                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="rounded-xl text-muted-foreground hover:text-foreground text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear all
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Filter Badges */}
            {activeFiltersCount > 0 && !showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Filters:</span>
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-lg text-[10px]">
                    Status: {STATUSES[statusFilter as keyof typeof STATUSES]?.label || statusFilter}
                    <button onClick={() => setStatusFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {priorityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-lg text-[10px]">
                    Priority: {PRIORITIES[priorityFilter as keyof typeof PRIORITIES]?.label || priorityFilter}
                    <button onClick={() => setPriorityFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-lg text-[10px]">
                    Category: {categories.find((c: any) => c.id === categoryFilter)?.name || categoryFilter}
                    <button onClick={() => setCategoryFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {studioFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 rounded-lg text-[10px]">
                    Studio: {studios.find((s: any) => s.id === studioFilter)?.name || studioFilter}
                    <button onClick={() => setStudioFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {assigneeFilter !== "all" && assigneeFilter !== "unassigned" && (
                  <Badge variant="secondary" className="gap-1 rounded-lg text-[10px]">
                    Assignee: {users.find((u: any) => u.id === assigneeFilter)?.displayName || "User"}
                    <button onClick={() => setAssigneeFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {assigneeFilter === "unassigned" && (
                  <Badge variant="secondary" className="gap-1 rounded-lg text-[10px]">
                    Unassigned Only
                    <button onClick={() => setAssigneeFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTickets.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium">
                {selectedTickets.size} ticket{selectedTickets.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl text-xs">
                      Bulk Actions
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="text-xs">Assign to Team</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">Change Status</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">Change Priority</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive text-xs">Close Tickets</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTickets(new Set())}
                  className="rounded-xl text-xs"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets Display */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <TicketCardSkeleton key={i} />
          ))}
        </div>
      ) : tickets && tickets.length > 0 ? (
        <>
          {/* Table View with AI Columns */}
          {viewMode === "table" && (
            <div className={cn("rounded-xl overflow-hidden shadow-xl", glassStyles.cards.primary)}>
              <div className="overflow-x-auto max-h-[calc(100vh-16rem)] relative">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 border-b-2 border-border/60 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-sm shadow-md">
                    <tr>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">
                        <Checkbox
                          checked={selectedTickets.size === tickets.length}
                          onCheckedChange={(checked) => checked ? selectAllVisible() : setSelectedTickets(new Set())}
                          className="border-white/30"
                        />
                      </th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Ticket</th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Status</th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Priority</th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-purple-300" />
                          Sentiment
                        </div>
                      </th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-blue-300" />
                          Urgency
                        </div>
                      </th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-300" />
                          Risk
                        </div>
                      </th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-300" />
                          Impact
                        </div>
                      </th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Category</th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Customer</th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Assigned</th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Created</th>
                      <th className="text-left p-3 text-xs font-bold uppercase tracking-wide text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sortBy === 'smart' ? smartSort(tickets) : tickets).map((ticket: any, index: number) => {
                      const isOverdue = ticket.slaBreached || (ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date() &&
                        !["resolved", "closed"].includes(ticket.status || ""));
                      const analysis = aiAnalysis[ticket.id];
                      const isAnalyzing = !analysis && viewMode === 'table';

                      return (
                        <motion.tr
                          key={ticket.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "border-b border-border/30 cursor-pointer transition-all duration-200",
                            "hover:bg-white/60 hover:shadow-md",
                            isOverdue && "bg-red-500/5",
                            isCriticalTicket(ticket) && "critical-ticket-row",
                            index % 2 === 0 && "bg-white/20"
                          )}
                          onClick={() => handleTicketClick(ticket)}
                        >
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedTickets.has(ticket.id)}
                              onCheckedChange={() => toggleTicketSelection(ticket.id)}
                            />
                          </td>
                          <td className="p-2 max-w-xs">
                            <div className="flex flex-col">
                              <span className="font-medium text-xs line-clamp-1 flex items-center gap-1">
                                {isCriticalTicket(ticket) && <span className="critical-ticket-dot" />}
                                {ticket.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">{ticket.ticketNumber}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <StatusBadge status={ticket.status || "new"} />
                          </td>
                          <td className="p-2">
                            <PriorityBadge priority={ticket.priority || "medium"} />
                          </td>

                          {/* AI Sentiment Column */}
                          <td className="p-2">
                            {isAnalyzing ? (
                              <div className="h-5 w-16 bg-muted/50 animate-pulse rounded" />
                            ) : analysis ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] rounded-lg gap-1",
                                  analysis.sentiment === 'positive' && "border-green-500/50 text-green-700 bg-green-500/10",
                                  analysis.sentiment === 'neutral' && "border-slate-500/50 text-slate-700 bg-slate-500/10",
                                  analysis.sentiment === 'negative' && "border-red-500/50 text-red-700 bg-red-500/10"
                                )}
                              >
                                {analysis.sentiment === 'positive' && <ThumbsUp className="h-3 w-3" />}
                                {analysis.sentiment === 'neutral' && <Meh className="h-3 w-3" />}
                                {analysis.sentiment === 'negative' && <ThumbsDown className="h-3 w-3" />}
                                {analysis.sentiment}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* AI Urgency Score Column */}
                          <td className="p-2">
                            {isAnalyzing ? (
                              <div className="h-5 w-20 bg-muted/50 animate-pulse rounded" />
                            ) : analysis ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full transition-all duration-500",
                                      analysis.urgencyScore >= 80 ? "bg-gradient-to-r from-red-500 to-rose-600" :
                                      analysis.urgencyScore >= 60 ? "bg-gradient-to-r from-orange-500 to-amber-600" :
                                      analysis.urgencyScore >= 40 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                                      "bg-gradient-to-r from-emerald-500 to-green-500"
                                    )}
                                    style={{ width: `${analysis.urgencyScore}%` }}
                                  />
                                </div>
                                <span className={cn(
                                  "text-[10px] font-semibold min-w-[2rem] text-right",
                                  analysis.urgencyScore >= 80 && "text-red-600",
                                  analysis.urgencyScore >= 60 && analysis.urgencyScore < 80 && "text-orange-600",
                                  analysis.urgencyScore >= 40 && analysis.urgencyScore < 60 && "text-amber-600",
                                  analysis.urgencyScore < 40 && "text-emerald-600"
                                )}>
                                  {analysis.urgencyScore}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* AI Escalation Risk Column */}
                          <td className="p-2">
                            {isAnalyzing ? (
                              <div className="h-5 w-14 bg-muted/50 animate-pulse rounded" />
                            ) : analysis ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] rounded-lg",
                                  analysis.escalationRisk === 'high' && "border-red-500/50 text-red-700 bg-red-500/10",
                                  analysis.escalationRisk === 'medium' && "border-amber-500/50 text-amber-700 bg-amber-500/10",
                                  analysis.escalationRisk === 'low' && "border-emerald-500/50 text-emerald-700 bg-emerald-500/10"
                                )}
                              >
                                {analysis.escalationRisk}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* AI Customer Impact Column */}
                          <td className="p-2">
                            {isAnalyzing ? (
                              <div className="h-5 w-16 bg-muted/50 animate-pulse rounded" />
                            ) : analysis ? (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "h-3 w-3",
                                      star <= analysis.customerImpact
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-slate-300"
                                    )}
                                  />
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="p-2">
                            <span className="text-xs">{ticket.category?.name || "—"}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-xs">{ticket.customerName || "—"}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-xs">{ticket.assignedTo?.displayName || "Unassigned"}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-[10px] text-muted-foreground">
                              {ticket.createdAt && formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </span>
                          </td>

                          {/* Actions Column */}
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleTicketClick(ticket)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Ticket
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Assign to Me
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <User className="mr-2 h-4 w-4" />
                                  Reassign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Check className="mr-2 h-4 w-4 text-green-600" />
                                  Mark Resolved
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="mr-2 h-4 w-4 text-blue-600" />
                                  Escalate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Flag className="mr-2 h-4 w-4 text-orange-600" />
                                  Change Priority
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Add Comment
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {analysis?.suggestedActions && analysis.suggestedActions.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-purple-600 flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      AI Suggestions
                                    </div>
                                    {analysis.suggestedActions.map((action: string, i: number) => (
                                      <DropdownMenuItem key={i} className="text-xs pl-6">
                                        <ChevronRight className="h-3 w-3 mr-1" />
                                        {action}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-3">
              {tickets.map((ticket: any) => {
                const isOverdue = ticket.slaBreached || (ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date() && 
                  !["resolved", "closed"].includes(ticket.status || ""));
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <Checkbox
                      checked={selectedTickets.has(ticket.id)}
                      onCheckedChange={() => toggleTicketSelection(ticket.id)}
                      className="mt-5"
                    />
                    <Card
                      className={cn(
                        "flex-1 glass-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                        "border-l-4",
                        ticket.priority === "critical" ? "border-l-red-500" :
                        ticket.priority === "high" ? "border-l-orange-500" :
                        ticket.priority === "medium" ? "border-l-yellow-500" : "border-l-green-500",
                        isOverdue && "ring-2 ring-red-500/50",
                        isCriticalTicket(ticket) && "critical-ticket-card"
                      )}
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm line-clamp-2 mb-1">{ticket.title}</h3>
                              <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs gap-1 ml-2">
                                  <AlertTriangle className="h-3 w-3" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <StatusBadge status={ticket.status || "new"} />
                              <PriorityBadge priority={ticket.priority || "medium"} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {ticket.category && <Badge variant="outline" className="rounded-lg">{ticket.category.name}</Badge>}
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {ticket.customerName && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {ticket.customerName}
                                </span>
                              )}
                              {ticket.studio && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {ticket.studio.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {ticket.createdAt && formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                          {ticket.assignedTo && (
                            <div className="flex items-center gap-2 pt-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px] bg-primary/20">
                                  {((ticket.assignedTo.displayName ?? ticket.assignedTo.firstName ?? "U") || "U").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                Assigned to {ticket.assignedTo.displayName || ticket.assignedTo.firstName || "User"}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tickets.map((ticket: any) => {
                const isOverdue = ticket.slaBreached || (ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date() && 
                  !["resolved", "closed"].includes(ticket.status || ""));
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card
                      className={cn(
                        "glass-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                        "border-l-4 h-full",
                        ticket.priority === "critical" ? "border-l-red-500" :
                        ticket.priority === "high" ? "border-l-orange-500" :
                        ticket.priority === "medium" ? "border-l-yellow-500" : "border-l-green-500",
                        isOverdue && "ring-2 ring-red-500/50",
                        isCriticalTicket(ticket) && "critical-ticket-card"
                      )}
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm line-clamp-2 flex-1">{ticket.title}</h3>
                            <StatusBadge status={ticket.status || "new"} />
                          </div>
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={ticket.priority || "medium"} />
                            {ticket.category && <Badge variant="outline" className="text-xs">{ticket.category.name}</Badge>}
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {ticket.customerName && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {ticket.customerName}
                              </div>
                            )}
                            {ticket.studio && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {ticket.studio.name}
                              </div>
                            )}
                            {ticket.assignedTo && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {ticket.assignedTo.displayName || "Assigned"}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {ticket.createdAt && formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Compact View */}
          {viewMode === "compact" && (
            <Card className="overflow-hidden">
              <div className="divide-y">
                {tickets.map((ticket: any) => {
                  const isOverdue = ticket.slaBreached || (ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date() && 
                    !["resolved", "closed"].includes(ticket.status || ""));
                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-3",
                        isOverdue && "bg-red-500/5",
                        isCriticalTicket(ticket) && "critical-ticket-row"
                      )}
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <Checkbox
                        checked={selectedTickets.has(ticket.id)}
                        onCheckedChange={() => toggleTicketSelection(ticket.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{ticket.title}</h4>
                          <p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={ticket.status || "new"} />
                          <PriorityBadge priority={ticket.priority || "medium"} />
                          <span className="text-xs text-muted-foreground min-w-[100px] text-right">
                            {ticket.createdAt && formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Kanban View */}
          {viewMode === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(STATUSES).map(([statusKey, statusConfig]) => {
                const statusTickets = tickets.filter((t: any) => (t.status || "new") === statusKey);
                return (
                  <div key={statusKey} className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <h3 className="font-semibold text-sm">{statusConfig.label}</h3>
                      <Badge variant="secondary" className="text-xs">{statusTickets.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {statusTickets.map((ticket: any) => (
                        <Card
                          key={ticket.id}
                          className={cn(
                            "cursor-pointer hover:shadow-md transition-shadow",
                            isCriticalTicket(ticket) && "critical-ticket-card border-red-500/60",
                          )}
                          onClick={() => handleTicketClick(ticket)}
                        >
                          <CardContent className="p-3 space-y-2">
                            <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={ticket.priority || "medium"} />
                              {ticket.category && (
                                <Badge variant="outline" className="text-xs">{ticket.category.name}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {ticket.assignedTo ? (
                                <>
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[8px] bg-primary/20">
                                      {((ticket.assignedTo.displayName ?? ticket.assignedTo.firstName ?? "U") || "U").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{ticket.assignedTo.displayName?.split(' ')[0] || "User"}</span>
                                </>
                              ) : (
                                <span>Unassigned</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {statusTickets.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No tickets
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grouped View */}
          {viewMode === "grouped" && (
            <div className="space-y-4">
              {Object.entries(groupedTickets).map(([groupKey, groupTickets]) => (
                <motion.div
                  key={groupKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("rounded-xl overflow-hidden", glassStyles.cards.primary)}
                >
                  {/* Group Header */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 cursor-pointer",
                      glassStyles.cards.secondary,
                      "hover:bg-white/80 transition-colors border-b border-border/50"
                    )}
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: collapsedGroups.has(groupKey) ? 0 : 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                      <h3 className="text-sm font-semibold">{groupKey}</h3>
                      <Badge variant="secondary" className="text-[10px] rounded-lg">
                        {groupTickets.length} ticket{groupTickets.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Show quick stats for the group */}
                      <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-600">
                        {groupTickets.filter((t: any) => t.slaBreached).length} overdue
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-600">
                        {groupTickets.filter((t: any) => t.priority === 'critical').length} critical
                      </Badge>
                    </div>
                  </div>

                  {/* Group Content */}
                  <AnimatePresence>
                    {!collapsedGroups.has(groupKey) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-2">
                          {groupTickets.map((ticket: any) => {
                            const isOverdue = ticket.slaBreached || (ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date() &&
                              !["resolved", "closed"].includes(ticket.status || ""));

                            return (
                              <Card
                                key={ticket.id}
                                className={cn(
                                  "cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4",
                                  ticket.priority === "critical" ? "border-l-red-500" :
                                  ticket.priority === "high" ? "border-l-orange-500" :
                                  ticket.priority === "medium" ? "border-l-yellow-500" : "border-l-green-500",
                                  isOverdue && "ring-2 ring-red-500/30",
                                  isCriticalTicket(ticket) && "critical-ticket-card"
                                )}
                                onClick={() => handleTicketClick(ticket)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-xs line-clamp-1 flex-1">{ticket.title}</h4>
                                        {isOverdue && (
                                          <Badge variant="destructive" className="text-[10px] gap-1 shrink-0">
                                            <AlertTriangle className="h-2 w-2" />
                                            Overdue
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-muted-foreground font-mono">{ticket.ticketNumber}</span>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {groupBy !== 'status' && <StatusBadge status={ticket.status || "new"} />}
                                        {groupBy !== 'priority' && <PriorityBadge priority={ticket.priority || "medium"} />}
                                        {groupBy !== 'category' && ticket.category && (
                                          <Badge variant="outline" className="text-[10px]">{ticket.category.name}</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground shrink-0">
                                      {ticket.customerName && (
                                        <span className="flex items-center gap-1">
                                          <User className="h-2 w-2" />
                                          {ticket.customerName}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-2 w-2" />
                                        {ticket.createdAt && formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                      </span>
                                      {groupBy !== 'assignee' && ticket.assignedTo && (
                                        <span className="flex items-center gap-1">
                                          <User className="h-2 w-2" />
                                          {ticket.assignedTo.displayName?.split(' ')[0] || "Assigned"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {Object.keys(groupedTickets).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No groups to display</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
          <EmptyState
            title="No tickets found"
            description={
              activeFiltersCount > 0 || searchQuery
                ? "Try adjusting your filters or search query"
                : "Create your first ticket to get started"
            }
            action={
              activeFiltersCount > 0 || searchQuery
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Create Ticket", onClick: () => navigate("/tickets/new") }
            }
          />
        )}

      {tickets && tickets.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</span>
          {tickets.length > 10 && (
            <Button variant="ghost" size="sm" onClick={selectAllVisible} className="text-xs">
              Select all visible
            </Button>
          )}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedTicket.ticketNumber}
                  </span>
                  <StatusBadge status={selectedTicket.status || "new"} />
                  <PriorityBadge priority={selectedTicket.priority || "medium"} />
                </div>
                <DialogTitle className="text-lg">{selectedTicket.title}</DialogTitle>
                <DialogDescription className="text-xs">
                  Created {selectedTicket.createdAt && format(new Date(selectedTicket.createdAt), "PPpp")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* Left Column - Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-medium mb-2 uppercase tracking-wide">Description</h4>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {selectedTicket.description || "No description provided."}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-xs font-medium mb-3 uppercase tracking-wide">Customer Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Name</span>
                        <p className="font-medium">{selectedTicket.customerName || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</span>
                        <p className="font-medium">{selectedTicket.customerEmail || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Phone</span>
                        <p className="font-medium">{selectedTicket.customerPhone || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Membership ID</span>
                        <p className="font-medium">{selectedTicket.customerMembershipId || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</span>
                        <p className="font-medium capitalize">{selectedTicket.customerStatus || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Mood</span>
                        <p className="font-medium capitalize">{selectedTicket.clientMood || "Not recorded"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Meta */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-medium mb-3 uppercase tracking-wide">Ticket Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Category</span>
                        <p className="font-medium">{selectedTicket.category?.name || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Subcategory</span>
                        <p className="font-medium">{selectedTicket.subcategory?.name || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Studio</span>
                        <p className="font-medium">{selectedTicket.studio?.name || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Source</span>
                        <p className="font-medium capitalize">{selectedTicket.source || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Assigned To</span>
                        <p className="font-medium">
                          {selectedTicket.assignedTo?.displayName || selectedTicket.assignedTo?.firstName || "Unassigned"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Reported By</span>
                        <p className="font-medium">
                          {selectedTicket.reportedBy?.displayName || selectedTicket.reportedBy?.firstName || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-xs font-medium mb-3 uppercase tracking-wide">SLA Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Due Date</span>
                        <p className="font-medium">
                          {selectedTicket.slaDueAt
                            ? format(new Date(selectedTicket.slaDueAt), "PPp")
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">SLA Status</span>
                        <p className={cn(
                          "font-medium",
                          selectedTicket.slaBreached && "text-destructive"
                        )}>
                          {selectedTicket.slaBreached ? "Breached" : "On Track"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-xs font-medium mb-2 uppercase tracking-wide">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedTicket.tags.map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="rounded-xl text-xs">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    navigate(`/tickets/${selectedTicket.id}`);
                  }}
                  className="rounded-xl text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-2" />
                  Open Full View
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Trainer Feedback Modal */}
      <TrainerFeedbackModal 
        open={isFeedbackModalOpen} 
        onOpenChange={setIsFeedbackModalOpen} 
      />
    </div>
  );
}
