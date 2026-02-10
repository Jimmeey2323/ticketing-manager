/**
 * Form Builder Component - Reusable form builder for dynamic forms
 * Separates form logic from UI
 */

import React, { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}

interface FormBuilderProps {
  sections: FormSection[];
  onSubmit?: () => void;
}

/**
 * FormBuilder - Main form structure component
 * Handles organizing multiple form sections
 */
export function FormBuilder({ sections, onSubmit }: FormBuilderProps) {
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <FormSection
          key={section.id}
          section={section}
          index={index}
        />
      ))}
    </div>
  );
}

/**
 * FormSection - Individual form section with optional collapse
 */
interface FormSectionProps {
  section: FormSection;
  index: number;
}

function FormSection({ section, index }: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(section.defaultOpen !== false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader
          className={section.collapsible ? "cursor-pointer" : ""}
          onClick={() => section.collapsible && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {section.icon && <div className="text-primary">{section.icon}</div>}
              <div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                {section.description && (
                  <CardDescription className="mt-1">{section.description}</CardDescription>
                )}
              </div>
            </div>
            {section.collapsible && (
              <motion.div
                animate={{ rotate: isOpen ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            )}
          </div>
        </CardHeader>

        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0">
                {section.children}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

/**
 * FormGrid - Grid layout for form fields
 */
interface FormGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "xs" | "sm" | "md" | "lg";
}

export function FormGrid({ children, columns = 2, gap = "md" }: FormGridProps) {
  const gapClasses = {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  const columnClasses = {
    1: "grid-cols-1",
    2: "md:grid-cols-2 grid-cols-1",
    3: "md:grid-cols-3 grid-cols-1",
    4: "md:grid-cols-4 grid-cols-1",
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
      {children}
    </div>
  );
}

/**
 * FormFieldGroup - Group related fields together
 */
interface FormFieldGroupProps {
  title?: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2 | 3;
}

export function FormFieldGroup({
  title,
  description,
  children,
  columns = 1,
}: FormFieldGroupProps) {
  return (
    <div className="space-y-3">
      {title && (
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <FormGrid columns={columns}>{children}</FormGrid>
    </div>
  );
}

/**
 * FormFieldWrapper - Wrapper for individual form fields
 */
interface FormFieldWrapperProps {
  children: ReactNode;
  className?: string;
}

export function FormFieldWrapper({ children, className = "" }: FormFieldWrapperProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * FormActions - Form action buttons
 */
interface FormActionsProps {
  onSubmit: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormActions({
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div className="flex gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
        )}
      </div>
      <Button
        onClick={onSubmit}
        disabled={isLoading}
        className="btn-premium"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {submitLabel}...
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * FormHelpText - Helper text for form fields
 */
interface FormHelpTextProps {
  children: ReactNode;
  type?: "info" | "warning" | "error" | "success";
}

export function FormHelpText({ children, type = "info" }: FormHelpTextProps) {
  const classes = {
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    error: "text-red-600 dark:text-red-400",
    success: "text-green-600 dark:text-green-400",
  };

  return (
    <p className={`text-xs ${classes[type]} mt-1`}>
      {children}
    </p>
  );
}

// Import necessary components for FormActions
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, Check } from "lucide-react";
