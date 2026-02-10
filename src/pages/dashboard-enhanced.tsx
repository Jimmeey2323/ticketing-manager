/**
 * Enhanced Dashboard - Modernized with improved styling, layout, and visual hierarchy
 * Features: KPI cards, charts, quick actions, recent activity, SLA tracking
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
import { colors, spacing } from "@/lib/design-system";

interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  avgResolutionTime: number;
  slaCompliance: number;
  teamWorkload: { name: string; tickets: number; capacity: number }[];
  priorityBreakdown: { priority: string; count: number; color: string }[];
  statusBreakdown: { status: string; count: number; color: string }[];
  weeklyTrend: { date: string; created: number; resolved: number }[];
  recentTickets: any[];
  topIssues: { category: string; count: number }[];
}

const priorityColorMap: Record<string, string> = {
  critical: colors.primary[600],
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

const statusColorMap: Record<string, string> = {
  new: colors.primary[500],
  assigned: colors.primary[400],
  in_progress: "#8b5cf6",
  pending_customer: "#f59e0b",
  resolved: "#10b981",
  closed: "#6b7280",
};

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      // Fetch from API (placeholder)
      const mockMetrics: DashboardMetrics = {
        totalTickets: 248,
        openTickets: 45,
        resolvedToday: 12,
        avgResolutionTime: 2.5,
        slaCompliance: 94,
        teamWorkload: [
          { name: "Alice Chen", tickets: 8, capacity: 10 },
          { name: "Bob Kumar", tickets: 6, capacity: 10 },
          { name: "Carol Davis", tickets: 9, capacity: 10 },
        ],
        priorityBreakdown: [
          { priority: "Critical", count: 3, color: priorityColorMap.critical },
          { priority: "High", count: 18, color: priorityColorMap.high },
          { priority: "Medium", count: 16, count: priorityColorMap.medium },
          { priority: "Low", count: 8, color: priorityColorMap.low },
        ],
        statusBreakdown: [
          { status: "New", count: 12, color: statusColorMap.new },
          { status: "Assigned", count: 8, color: statusColorMap.assigned },
          { status: "In Progress", count: 15, color: statusColorMap.in_progress },
          { status: "Pending", count: 10, color: statusColorMap.pending_customer },
        ],
        weeklyTrend: [
          { date: "Mon", created: 12, resolved: 8 },
          { date: "Tue", created: 19, resolved: 11 },
          { date: "Wed", created: 14, resolved: 14 },
          { date: "Thu", created: 22, resolved: 16 },
          { date: "Fri", created: 18, resolved: 12 },
          { date: "Sat", created: 5, resolved: 4 },
          { date: "Sun", created: 3, resolved: 2 },
        ],
        recentTickets: [],
        topIssues: [
          { category: "Payment Issues", count: 18 },
          { category: "Booking Problems", count: 12 },
          { category: "Technical Issues", count: 9 },
          { category: "Member Feedback", count: 6 },
        ],
      };
      return mockMetrics;
    },
  });

  if (isLoading || !metrics) {
    return <DashboardSkeleton />;
  }

  const kpis = [
    {
      id: "open-tickets",
      title: "Open Tickets",
      value: metrics.openTickets,
      icon: AlertTriangle,
      trend: { value: -15, direction: "down" as const },
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
    {
      id: "resolved-today",
      title: "Resolved Today",
      value: metrics.resolvedToday,
      icon: CheckCircle,
      trend: { value: 23, direction: "up" as const },
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      id: "avg-resolution",
      title: "Avg Resolution",
      value: `${metrics.avgResolutionTime}h`,
      icon: Clock,
      trend: { value: -8, direction: "down" as const },
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      id: "sla-compliance",
      title: "SLA Compliance",
      value: `${metrics.slaCompliance}%`,
      icon: Target,
      trend: { value: 4, direction: "up" as const },
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
                <BarChart data={metrics.weeklyTrend}>
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
                    <span className="text-sm font-bold text-green-600">{metrics.slaCompliance}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.slaCompliance}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">On Track</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      92
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">At Risk</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      4
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Breached</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      2
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
                    data={metrics.priorityBreakdown}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {metrics.priorityBreakdown.map((entry, idx) => (
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
                {metrics.statusBreakdown.map((item) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.status}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {item.count}
                      </Badge>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${(item.count / metrics.openTickets) * 100}%`,
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
                {metrics.teamWorkload.map((member) => {
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
              <CardDescription>Most reported issues this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topIssues.map((issue, idx) => (
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
                className={cn("text-2xl font-bold mt-1 bg-gradient-to-r", kpi.color, "bg-clip-text text-transparent")}
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
      <div className="h-10 bg-muted rounded-lg w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export { DashboardSkeleton };
