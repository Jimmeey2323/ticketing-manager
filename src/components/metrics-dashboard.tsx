/**
 * Metrics Dashboard Components - Reusable metrics panels for analytics
 * Provides customizable metric cards with animations and trend indicators
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricConfig {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label: string;
  };
  target?: number;
  warning?: number;
  critical?: number;
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "error" | "info";
  format?: "number" | "percentage" | "time" | "currency";
  comparison?: {
    label: string;
    value: string;
  };
}

interface MetricsGridProps {
  metrics: MetricConfig[];
  columns?: 1 | 2 | 3 | 4;
  variant?: "compact" | "standard" | "detailed";
}

/**
 * MetricsGrid - Container for metric cards
 */
export function MetricsGrid({ metrics, columns = 4, variant = "standard" }: MetricsGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "md:grid-cols-2 grid-cols-1",
    3: "md:grid-cols-3 grid-cols-1",
    4: "lg:grid-cols-4 md:grid-cols-2 grid-cols-1",
  };

  return (
    <div className={`grid ${columnClasses[columns]} gap-4`}>
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <MetricCard metric={metric} variant={variant} />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * MetricCard - Individual metric display
 */
interface MetricCardProps {
  metric: MetricConfig;
  variant?: "compact" | "standard" | "detailed";
}

function MetricCard({ metric, variant = "standard" }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    primary: "text-primary",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    error: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const bgClasses: Record<string, string> = {
    primary: "bg-primary/10",
    success: "bg-green-100/50 dark:bg-green-900/20",
    warning: "bg-amber-100/50 dark:bg-amber-900/20",
    error: "bg-red-100/50 dark:bg-red-900/20",
    info: "bg-blue-100/50 dark:bg-blue-900/20",
  };

  const color = metric.color || "primary";
  const status = getMetricStatus(metric);

  return (
    <Card className={cn("relative overflow-hidden", status === "critical" && "border-destructive")}>
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
          status === "critical"
            ? "from-red-500 to-red-600"
            : status === "warning"
              ? "from-amber-500 to-amber-600"
              : "from-primary/50 to-primary"
        )}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>

            {metric.description && (
              <CardDescription className="text-xs mt-1">{metric.description}</CardDescription>
            )}
          </div>

          {status === "critical" && (
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          )}
          {status === "success" && (
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Value Display */}
        <div className="flex items-baseline gap-2">
          <motion.div
            className={cn("text-3xl font-bold", colorClasses[color])}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {formatValue(metric.value, metric.format)}
          </motion.div>

          {metric.unit && (
            <span className="text-sm text-muted-foreground font-medium">{metric.unit}</span>
          )}
        </div>

        {/* Trend */}
        {metric.trend && (
          <div className="flex items-center gap-2">
            <TrendIndicator trend={metric.trend} />
            <span className="text-xs text-muted-foreground">{metric.trend.label}</span>
          </div>
        )}

        {/* Progress Bar */}
        {metric.target && variant !== "compact" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Target</span>
              <span className="font-medium">{Math.round((numericValue(metric.value) / metric.target) * 100)}%</span>
            </div>
            <ProgressBar
              value={numericValue(metric.value)}
              target={metric.target}
              warning={metric.warning}
              critical={metric.critical}
            />
          </div>
        )}

        {/* Comparison */}
        {metric.comparison && variant === "detailed" && (
          <div className="text-xs border-t pt-2 mt-2">
            <p className="text-muted-foreground">{metric.comparison.label}</p>
            <p className="font-medium text-foreground mt-1">{metric.comparison.value}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * TrendIndicator - Shows trend direction and value
 */
interface TrendIndicatorProps {
  trend: MetricConfig["trend"];
}

function TrendIndicator({ trend }: TrendIndicatorProps) {
  if (!trend) return null;

  const isPositive = trend.direction === "up";
  const color = isPositive ? "text-green-600" : trend.direction === "down" ? "text-red-600" : "text-gray-600";

  return (
    <div className={cn("flex items-center gap-1", color)}>
      {trend.direction === "up" && <TrendingUp className="w-4 h-4" />}
      {trend.direction === "down" && <TrendingDown className="w-4 h-4" />}
      {trend.direction === "neutral" && <Minus className="w-4 h-4" />}

      <span className="text-xs font-medium">
        {trend.direction === "up" ? "+" : ""}{trend.value}%
      </span>
    </div>
  );
}

/**
 * ProgressBar - Visual progress indicator with threshold zones
 */
interface ProgressBarProps {
  value: number;
  target: number;
  warning?: number;
  critical?: number;
}

function ProgressBar({ value, target, warning, critical }: ProgressBarProps) {
  const percentage = Math.min((value / target) * 100, 100);
  const isWarning = warning && value > warning;
  const isCritical = critical && value > critical;

  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn(
          "h-full rounded-full transition-colors",
          isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

/**
 * MetricsRow - Horizontal metric display for compact view
 */
interface Metric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
}

interface MetricsRowProps {
  metrics: Metric[];
  separator?: boolean;
}

export function MetricsRow({ metrics, separator = true }: MetricsRowProps) {
  return (
    <div className={cn("flex items-center gap-6 py-4", separator && "border-b")}>
      {metrics.map((metric, index) => (
        <div key={metric.id} className={cn(index > 0 && separator && "pl-6 border-l")}>
          <p className="text-xs text-muted-foreground">{metric.label}</p>
          <p className="text-lg font-bold text-foreground">
            {metric.value}
            {metric.unit && <span className="text-xs ml-1">{metric.unit}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * StatisticCard - Detailed statistic with more information
 */
interface StatisticCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    label: string;
    isPositive: boolean;
  };
}

export function StatisticCard({ title, value, description, icon, trend }: StatisticCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-primary opacity-70">{icon}</div>}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{value}</div>

        {description && <p className="text-xs text-muted-foreground">{description}</p>}

        {trend && (
          <div className={cn("text-xs font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
            {trend.isPositive ? "↑" : "↓"} {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Utility Functions
// ============================================

function getMetricStatus(metric: MetricConfig): "normal" | "warning" | "critical" | "success" {
  const value = numericValue(metric.value);

  if (metric.critical && value > metric.critical) {
    return "critical";
  }

  if (metric.warning && value > metric.warning) {
    return "warning";
  }

  if (metric.target && value >= metric.target) {
    return "success";
  }

  return "normal";
}

function numericValue(value: number | string): number {
  if (typeof value === "number") return value;
  return parseInt(value, 10) || 0;
}

function formatValue(value: number | string, format?: string): string {
  const num = numericValue(value);

  switch (format) {
    case "percentage":
      return `${num}%`;

    case "time":
      if (num < 60) return `${num}m`;
      if (num < 1440) return `${Math.round(num / 60)}h`;
      return `${Math.round(num / 1440)}d`;

    case "currency":
      return `$${num.toLocaleString()}`;

    case "number":
    default:
      return num.toLocaleString();
  }
}

export default MetricsGrid;
