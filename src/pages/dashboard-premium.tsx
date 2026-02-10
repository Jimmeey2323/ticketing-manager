/**
 * Premium Glassmorphic Dashboard
 * Modern, sophisticated design with glass UI components
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Activity,
  Users,
  Target,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { glassStyles, glass } from "@/lib/glassmorphic-design";
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
  new: "#3b82f6",
  assigned: "#a855f7",
  in_progress: "#8b5cf6",
  pending_customer: "#f59e0b",
  resolved: "#10b981",
  closed: "#64748b",
  reopened: "#ef4444",
};

const priorityColors: Record<string, string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function DashboardPremium() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { data: allTickets, error } = await supabase.from("tickets").select("*");

      if (error) throw error;

      const tickets = allTickets || [];

      const openStatuses = ["new", "assigned", "in_progress", "pending_customer", "reopened"];
      const totalOpen = tickets.filter((t) => openStatuses.includes(t.status || "")).length;
      const totalNew = tickets.filter((t) => t.status === "new").length;
      const resolvedToday = tickets.filter(
        (t) => t.resolved_at && t.resolved_at >= startOfToday && t.resolved_at <= endOfToday
      ).length;
      const slaBreached = tickets.filter((t) => t.sla_breached).length;

      const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at);
      const avgResolutionTime =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => {
              const created = new Date(t.created_at).getTime();
              const resolved = new Date(t.resolved_at).getTime();
              return sum + (resolved - created) / (1000 * 60 * 60);
            }, 0) / resolvedTickets.length
          : 0;

      const slaCompliance = Math.max(
        0,
        Math.round(((totalOpen - slaBreached) / Math.max(totalOpen, 1)) * 100)
      );

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

      const categoryCounts: Record<string, number> = {};
      tickets.forEach((t) => {
        const category = t.category || "General";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      const topIssues = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const teamWorkload = [
        { name: "Team A", tickets: Math.floor(totalOpen * 0.4), capacity: 10 },
        { name: "Team B", tickets: Math.floor(totalOpen * 0.35), capacity: 10 },
        { name: "Team C", tickets: Math.floor(totalOpen * 0.25), capacity: 10 },
      ];

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

  const metrics = [
    {
      id: "open-tickets",
      title: "Open Tickets",
      value: stats.totalOpen,
      change: stats.totalNew,
      changeLabel: "new today",
      icon: AlertTriangle,
      trend: "neutral",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "resolved-today",
      title: "Resolved Today",
      value: stats.resolvedToday,
      change: 12,
      changeLabel: "vs yesterday",
      icon: CheckCircle2,
      trend: "up",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      id: "avg-resolution",
      title: "Avg Resolution",
      value: `${stats.avgResolutionTime.toFixed(1)}h`,
      change: 8,
      changeLabel: "improvement",
      icon: Clock,
      trend: "down",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "sla-compliance",
      title: "SLA Compliance",
      value: `${stats.slaCompliance}%`,
      change: 4,
      changeLabel: "this week",
      icon: Target,
      trend: "up",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className={cn("min-h-screen", glassStyles.backgrounds.app)}>
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className={cn("text-4xl font-bold mb-2", glassStyles.textGradients.primary)}>
              Dashboard
            </h1>
            <p className="text-slate-600 text-lg">
              Welcome back! Here's what's happening with your support.
            </p>
          </div>
          <Link href="/ticket-new">
            <Button
              size="lg"
              className={cn(
                "rounded-2xl px-6 py-6 text-base font-semibold",
                glassStyles.buttons.primary,
                glassStyles.effects.float
              )}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Ticket
            </Button>
          </Link>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card
                className={cn(
                  "rounded-2xl border-0 overflow-hidden",
                  glassStyles.cards.metric,
                  glassStyles.effects.float
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        `bg-gradient-to-br ${metric.gradient}`,
                        glassStyles.effects.glow
                      )}
                    >
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {metric.trend === "up" && (
                        <>
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">+{metric.change}%</span>
                        </>
                      )}
                      {metric.trend === "down" && (
                        <>
                          <ArrowDownRight className="w-4 h-4 text-rose-600" />
                          <span className="text-rose-600 font-semibold">-{metric.change}%</span>
                        </>
                      )}
                      {metric.trend === "neutral" && (
                        <span className="text-slate-600 font-semibold">+{metric.change}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium mb-1">{metric.title}</p>
                    <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{metric.changeLabel}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      Weekly Activity
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Tickets created vs resolved over the last 7 days
                    </CardDescription>
                  </div>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      glassStyles.gradients.accent
                    )}
                  >
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.weeklyTrend}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(226, 232, 240, 0.5)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="url(#colorCreated)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#colorResolved)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* SLA Compliance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      glassStyles.gradients.success
                    )}
                  >
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      SLA Compliance
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(stats.slaCompliance / 100) * 351.86} 351.86`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">
                        {stats.slaCompliance}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50">
                    <span className="text-sm font-medium text-slate-700">On Track</span>
                    <Badge className={cn("rounded-lg", glassStyles.badges.success)}>
                      {stats.totalOpen - stats.slaBreached}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50">
                    <span className="text-sm font-medium text-slate-700">Breached</span>
                    <Badge className={cn("rounded-lg", glassStyles.badges.danger)}>
                      {stats.slaBreached}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      glassStyles.gradients.warning
                    )}
                  >
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Priority Distribution
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={stats.byPriority}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.byPriority.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      glassStyles.gradients.info
                    )}
                  >
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Status Overview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.byStatus.map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {item.name.replace("_", " ")}
                      </span>
                      <Badge className={cn("rounded-lg", glassStyles.badges.secondary)}>
                        {item.value}
                      </Badge>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.value / Math.max(stats.totalOpen, 1)) * 100}%`,
                          background: `linear-gradient(to right, ${item.color}, ${item.color}dd)`,
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    glassStyles.gradients.danger
                  )}
                >
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Top Issue Categories
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Most reported issues this week
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {stats.topIssues.map((issue, idx) => (
                  <motion.div
                    key={issue.category}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    className={cn(
                      "p-4 rounded-xl text-center",
                      glassStyles.cards.secondary,
                      glassStyles.effects.float
                    )}
                  >
                    <div className="text-3xl font-bold text-slate-900 mb-1">{issue.count}</div>
                    <div className="text-sm font-medium text-slate-600">{issue.category}</div>
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

function DashboardSkeleton() {
  return (
    <div className={cn("min-h-screen", glassStyles.backgrounds.app)}>
      <div className="max-w-[1600px] mx-auto p-6 space-y-8">
        <div className="h-16 bg-white/60 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/60 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white/60 rounded-2xl animate-pulse" />
          <div className="h-96 bg-white/60 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export { DashboardSkeleton };
