/**
 * Workflow Progress - Visual indicator of form progression
 * Shows users where they are in a multi-step process
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  current?: boolean;
  optional?: boolean;
}

interface WorkflowProgressProps {
  steps: Step[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  variant?: "vertical" | "horizontal";
  showDescriptions?: boolean;
}

/**
 * WorkflowProgress - Main component
 */
export function WorkflowProgress({
  steps,
  currentStepId,
  onStepClick,
  variant = "horizontal",
  showDescriptions = true,
}: WorkflowProgressProps) {
  if (variant === "vertical") {
    return <VerticalProgress steps={steps} currentStepId={currentStepId} onStepClick={onStepClick} showDescriptions={showDescriptions} />;
  }

  return <HorizontalProgress steps={steps} currentStepId={currentStepId} onStepClick={onStepClick} />;
}

/**
 * Horizontal Progress - Inline progress display
 */
interface HorizontalProgressProps {
  steps: Step[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
}

function HorizontalProgress({ steps, currentStepId, onStepClick }: HorizontalProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{completedCount}</span> of{" "}
          <span className="font-semibold text-foreground">{steps.length}</span> complete
        </div>
        <div className="text-xs text-muted-foreground">
          {Math.round((completedCount / steps.length) * 100)}%
        </div>
      </div>

      {/* Progress line*/}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Step items */}
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex items-center flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-all flex-1",
                step.completed || step.id === currentStepId
                  ? "bg-primary/10"
                  : "hover:bg-muted"
              )}
            >
              <StepIndicator
                index={index}
                completed={step.completed || false}
                current={step.id === currentStepId}
              />
              <span className="text-xs font-medium flex-1 text-left truncate">
                {step.title}
              </span>
            </button>

            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Vertical Progress - Stacked progress display
 */
interface VerticalProgressProps {
  steps: Step[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  showDescriptions?: boolean;
}

function VerticalProgress({
  steps,
  currentStepId,
  onStepClick,
  showDescriptions = true,
}: VerticalProgressProps) {
  return (
    <div className="relative space-y-6">
      {/* Visual connection line */}
      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />

      {/* Steps */}
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          className="relative pl-20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {/* Step indicator */}
          <button
            onClick={() => onStepClick?.(step.id)}
            className="absolute left-0 top-1"
          >
            <StepIndicator
              index={index}
              completed={step.completed || false}
              current={step.id === currentStepId}
              size="lg"
            />
          </button>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className={cn(
                "p-4 rounded-xl transition-all",
                step.id === currentStepId
                  ? "bg-primary/10 border border-primary/20"
                  : step.completed
                    ? "bg-success/5 border border-success/20"
                    : "bg-muted/50 border border-muted"
              )}
            >
              <h4 className="font-semibold text-sm mb-1">{step.title}</h4>

              {showDescriptions && step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}

              {step.optional && (
                <span className="inline-block mt-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                  Optional
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * StepIndicator - Individual step indicator
 */
interface StepIndicatorProps {
  index: number;
  completed: boolean;
  current: boolean;
  size?: "sm" | "md" | "lg";
}

function StepIndicator({ index, completed, current, size = "md" }: StepIndicatorProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold transition-all",
        sizeClasses[size],
        completed
          ? "bg-success text-white"
          : current
            ? "bg-primary text-white scale-110 shadow-lg"
            : "bg-muted text-muted-foreground"
      )}
    >
      {completed ? (
        <Check className={size === "lg" ? "w-6 h-6" : size === "md" ? "w-4 h-4" : "w-3 h-3"} />
      ) : (
        index + 1
      )}
    </div>
  );
}

export default WorkflowProgress;
