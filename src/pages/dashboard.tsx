/**
 * Dashboard - Merged Enhanced + Current
 * Features: Real Supabase data + enhanced styling with KPIs and visualizations
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Users,
  Zap,
  Target,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TicketCard } from "@/components/ticket-card";
import { EmptyState } from "@/components/empty-state";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { colors } from "@/lib/design-system";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface DashboardStats {
  totalOpen: number;
  totalNew: number;
  resolvedToday: number;
  slaBreached: number;
  avgResolutionTime: number;
  slaCompliance: number;
  byStatus: { name: string; value: number; color: string }[];
  byPriority: { name: string; value: number; color: string }[];
  weeklyTrend: { date: string; created: number; resolved: number }[];
  recentTickets: any[];
  topIssues: { category: string; count: number }[];
  teamWorkload: { name: string; tickets: number; capacity: number }[];
}

const statusColors: Record<string, string> = {
  new: colors.primary[500],
  assigned: colors.primary[400],
  in_progress: "#8b5cf6",
  pending_customer: "#f59e0b",
  resolved: "#10b981",
  closed: "#6b7280",
  reopened: colors.primary[600],
};

const priorityColors: Record<string, string> = {
  critical: colors.primary[600],
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Fetch all tickets
      const { data: allTickets, error } = await supabase.from("tickets").select("*");

      if (error) throw error;

      const tickets = allTickets || [];

      // Calculate stats
      const openStatuses = ["new", "assigned", "in_progress", "pending_customer", "reopened"];
      const totalOpen = tickets.filter((t) => openStatuses.includes(t.status || "")).length;
      const totalNew = tickets.filter((t) => t.status === "new").length;
      const resolvedToday = tickets.filter(
        (t) => t.resolved_at && t.resolved_at >= startOfToday && t.resolved_at <= endOfToday
      ).length;
      const slaBreached = tickets.filter((t) => t.sla_breached).length;

      // Calculate average resolution time (in hours)
      const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at);
      const avgResolutionTime =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => {
              const created = new Date(t.created_at).getTime();
              const resolved = new Date(t.resolved_at).getTime();
              return sum + (resolved - created) / (1000 * 60 * 60);
            }, 0) / resolvedTickets.length
          : 0;

      // SLA Compliance
      const slaCompliance = Math.max(
        0,
        Math.round(((totalOpen - slaBreached) / Math.max(totalOpen, 1)) * 100)
      );

      // Group by status
      const statusCounts: Record<string, number> = {};
      tickets.forEach((t) => {
        const status = t.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      const byStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
        color: statusColors[name] || "#6b7280",
      }));

      // Group by priority
      const priorityCounts: Record<string, number> = {};
      tickets.forEach((t) => {
        const priority = t.priority || "medium";
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      });
      const byPriority = Object.entries(priorityCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: priorityColors[name] || "#6b7280",
      }));

      // Weekly trend
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayStart = startOfDay(date).toISOString();
        const dayEnd = endOfDay(date).toISOString();

        const created = tickets.filter(
          (t) => t.created_at && t.created_at >= dayStart && t.created_at <= dayEnd
        ).length;
        const resolved = tickets.filter(
          (t) => t.resolved_at && t.resolved_at >= dayStart && t.resolved_at <= dayEnd
        ).length;

        weeklyTrend.push({
          date: format(date, "EEE"),
          created,
          resolved,
        });
      }

      // Top issues by category
      const categoryCounts: Record<string, number> = {};
      tickets.forEach((t) => {
        const category = t.category || "General";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      const topIssues = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      // Mock team workload (would come from user assignments in production)
      const teamWorkload = [
        { name: "Team A", tickets: Math.floor(totalOpen * 0.4), capacity: 10 },
        { name: "Team B", tickets: Math.floor(totalOpen * 0.35), capacity: 10 },
        { name: "Team C", tickets: Math.floor(totalOpen * 0.25), capacity: 10 },
      ];

      // Get recent tickets
      const { data: recentTickets } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        totalOpen,
        totalNew,
        resolvedToday,
        slaBreached,
        avgResolutionTime,
        slaCompliance,
        byStatus,
        byPriority,
        weeklyTrend,
        recentTickets: recentTickets || [],
        topIssues,
        teamWorkload,
      };
    },
    refetchInterval: 30000,
  });

  if (statsLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const kpis = [
    {
      id: "open-tickets",
      title: "Open Tickets",
      value: stats.totalOpen,
      icon: AlertTriangle,
      trend: { value: Math.abs(stats.totalNew), direction: stats.totalNew > 0 ? "up" : "down" },
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
    {
      id: "resolved-today",
      title: "Resolved Today",
      value: stats.resolvedToday,
      icon: CheckCircle,
      trend: { value: 12, direction: "up" },
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      id: "avg-resolution",
      title: "Avg Resolution",
      value: `${stats.avgResolutionTime.toFixed(1)}h`,
      icon: Clock,
      trend: { value: 8, direction: "down" },
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      id: "sla-compliance",
      title: "SLA Compliance",
      value: `${stats.slaCompliance}%`,
      icon: Target,
      trend: { value: 4, direction: "up" },
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's your support hub overview.
          </p>
        </div>
        <Link href="/ticket-new">
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-shadow">
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {kpis.map((kpi, idx) => (
          <KPICard key={kpi.id} kpi={kpi} delay={idx * 0.1} />
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Weekly Trend
              </CardTitle>
              <CardDescription>Tickets created vs resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="created" fill={colors.primary[500]} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="resolved" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* SLA Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-4 h-4 text-primary" />
                SLA Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Compliance</span>
                    <span className="text-sm font-bold text-green-600">{stats.slaCompliance}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.slaCompliance}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">On Track</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {stats.totalOpen - stats.slaBreached}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Breached</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {stats.slaBreached}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Priority & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                By Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.byPriority}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {stats.byPriority.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                By Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.byStatus.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-capitalize">{item.name}</span>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${(item.value / Math.max(stats.totalOpen, 1)) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Workload & Top Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Team Workload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.teamWorkload.map((member) => {
                  const percentage = (member.tickets / member.capacity) * 100;
                  const isOverloaded = percentage > 80;

                  return (
                    <div key={member.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{member.name}</span>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-1 rounded",
                            isOverloaded
                              ? "bg-red-100 text-red-700 dark:bg-red-950/40"
                              : "bg-green-100 text-green-700 dark:bg-green-950/40"
                          )}
                        >
                          {member.tickets}/{member.capacity}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            isOverloaded
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : "bg-gradient-to-r from-green-500 to-emerald-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.1, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Top Issues
              </CardTitle>
              <CardDescription>Most common issue categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topIssues.map((issue, idx) => (
                  <motion.div
                    key={issue.category}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                  >
                    <span className="text-sm font-medium">{issue.category}</span>
                    <Badge variant="secondary">{issue.count}</Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * KPI Card Component
 */
interface KPICardProps {
  kpi: {
    id: string;
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    trend: { value: number; direction: "up" | "down" };
    color: string;
    bgColor: string;
  };
  delay: number;
}

function KPICard({ kpi, delay }: KPICardProps) {
  const Icon = kpi.icon;
  const TrendIcon = kpi.trend.direction === "up" ? TrendingUp : TrendingDown;
  const trendColor = kpi.trend.direction === "up" ? "text-green-600" : "text-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={cn("border-0 shadow-md hover:shadow-lg transition-all", kpi.bgColor)}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header with icon and trend */}
            <div className="flex items-start justify-between">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", kpi.color, "bg-opacity-20")}>
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <div className={cn("flex items-center gap-1", trendColor)}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-xs font-semibold">{Math.abs(kpi.trend.value)}%</span>
              </div>
            </div>

            {/* Value and label */}
            <div>
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
              <motion.p
                className={cn(
                  "text-2xl font-bold mt-1 bg-gradient-to-r",
                  kpi.color,
                  "bg-clip-text text-transparent"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.3 }}
              >
                {kpi.value}
              </motion.p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Dashboard Skeleton Loader
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      <div className="h-10 bg-muted rounded-lg w-40 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export { DashboardSkeleton };
