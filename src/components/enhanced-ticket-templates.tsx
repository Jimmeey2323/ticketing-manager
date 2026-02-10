/**
 * Enhanced Template System - Properly populates form fields from templates
 * Features: Template selection, field auto-population, preset values
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  CreditCard,
  Users,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Sparkles,
  UserX,
  Settings,
  Package,
  Headphones,
  Star,
  ChevronRight,
  Check,
  Zap,
  Dialog as DialogIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Template Field Configuration - Defines fields to populate
 */
export interface TemplateField {
  fieldName: string;
  label: string;
  value: string | string[];
  type: "text" | "select" | "tags" | "textarea";
  required?: boolean;
}

/**
 * Enhanced Ticket Template with field population
 */
export interface EnhancedTicketTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  subcategory?: string;
  priority: "critical" | "high" | "medium" | "low";
  suggestedTitle: string;
  // NEW: Field population instead of just text
  formFields: TemplateField[];
  tags: string[];
  color: string;
  slaHours?: number;
  quickTips?: string[];
  requiredFields?: string[];
  commonFollowUps?: string[];
}

/**
 * Updated Template Library with Field Configurations
 */
export const ENHANCED_TEMPLATES: EnhancedTicketTemplate[] = [
  {
    id: "booking-issue",
    name: "Booking Failed",
    description: "Customer unable to book classes through app or website",
    icon: Calendar,
    category: "Booking & Technology",
    subcategory: "Class Booking",
    priority: "high",
    slaHours: 4,
    suggestedTitle: "Class Booking Issue - Unable to Complete Reservation",
    formFields: [
      {
        fieldName: "title",
        label: "Ticket Title",
        value: "Class Booking Issue - Unable to Complete Reservation",
        type: "text",
        required: true,
      },
      {
        fieldName: "priority",
        label: "Priority",
        value: "high",
        type: "select",
        required: true,
      },
      {
        fieldName: "category",
        label: "Category",
        value: "Booking & Technology",
        type: "select",
        required: true,
      },
      {
        fieldName: "description",
        label: "Description",
        value: `📱 DEVICE & PLATFORM
• Platform: [iOS/Android/Web]
• App version: [version]
• Device model: [model]

🚫 ERROR DETAILS
• Error message: [exact error text]
• Error code (if shown): [code]
• When did error occur: [specific time]

🔄 BOOKING ATTEMPT
• Class name: [class name]
• Date & time: [date/time]
• Membership type: [type]

⚙️ TROUBLESHOOTING STEPS TRIED
• [Step 1]
• [Step 2]
• [Step 3]`,
        type: "textarea",
        required: true,
      },
      {
        fieldName: "tags",
        label: "Tags",
        value: ["booking", "technical", "app"],
        type: "tags",
      },
    ],
    tags: ["booking", "technical", "app"],
    color: "from-blue-500 to-cyan-500",
    quickTips: [
      "Ask customer to clear app cache and try again",
      "Confirm their membership is active",
      "Check if they have available credits/sessions",
      "Try from a different device or browser",
    ],
    requiredFields: ["Platform", "Error message", "Class attempted"],
    commonFollowUps: [
      "Can you manually process the booking as a workaround?",
      "Is there a backend issue preventing bookings?",
      "Need to refund any transaction attempts",
    ],
  },
  {
    id: "payment-problem",
    name: "Payment Issue",
    description: "Problems with payment processing or billing",
    icon: CreditCard,
    category: "Booking & Technology",
    subcategory: "Payment Processing",
    priority: "high",
    slaHours: 2,
    suggestedTitle: "Payment Processing Error - Transaction Failed",
    formFields: [
      {
        fieldName: "title",
        label: "Ticket Title",
        value: "Payment Processing Error - Transaction Failed",
        type: "text",
        required: true,
      },
      {
        fieldName: "priority",
        label: "Priority",
        value: "high",
        type: "select",
        required: true,
      },
      {
        fieldName: "category",
        label: "Category",
        value: "Booking & Technology",
        type: "select",
        required: true,
      },
      {
        fieldName: "description",
        label: "Description",
        value: `💳 PAYMENT DETAILS
• Amount: [amount]
• Currency: [INR/USD/other]
• Payment method: [Card/UPI/Wallet/Other]
• Card type (if card): [Visa/Mastercard/Amex]

❌ ERROR INFORMATION
• Error message: [exact message]
• Error code: [code]
• Transaction ID (if generated): [id]
• When error occurred: [timestamp]

📋 TRANSACTION CONTEXT
• What was being purchased: [membership/class pack/retail]
• Product/package name: [name]
• Billing address matches registered: [yes/no]`,
        type: "textarea",
        required: true,
      },
      {
        fieldName: "tags",
        label: "Tags",
        value: ["payment", "billing", "urgent"],
        type: "tags",
      },
    ],
    tags: ["payment", "billing", "urgent"],
    color: "from-emerald-500 to-teal-500",
    quickTips: [
      "Check payment gateway status",
      "Verify card is not blocked or expired",
      "Confirm billing address matches card",
      "Process manually if gateway is down",
    ],
    requiredFields: ["Amount", "Payment method", "Error message"],
    commonFollowUps: [
      "Refund duplicate/partial charges immediately",
      "Contact payment processor if needed",
      "Send confirmation once resolved",
    ],
  },
  {
    id: "instructor-feedback",
    name: "Instructor Feedback",
    description: "Feedback or concern about instructor performance",
    icon: Star,
    category: "Customer Service",
    subcategory: "Staff Professionalism",
    priority: "medium",
    slaHours: 24,
    suggestedTitle: "Instructor Feedback",
    formFields: [
      {
        fieldName: "title",
        label: "Ticket Title",
        value: "Instructor Feedback",
        type: "text",
        required: true,
      },
      {
        fieldName: "priority",
        label: "Priority",
        value: "medium",
        type: "select",
        required: true,
      },
      {
        fieldName: "category",
        label: "Category",
        value: "Customer Service",
        type: "select",
        required: true,
      },
      {
        fieldName: "description",
        label: "Description",
        value: `👤 INSTRUCTOR INFORMATION
• Instructor name: [name]
• Class: [class name]
• Class date/time: [date/time]
• Studio/Location: [location]

⭐ FEEDBACK TYPE
☐ Positive feedback
☐ Constructive feedback
☐ Concern/Complaint

📝 FEEDBACK DETAILS
[Provide detailed feedback]

💡 SPECIFIC OBSERVATIONS
• What went well: [observations]
• Areas for improvement: [observations]
• Impact on experience: [description]

👥 CUSTOMER CONTEXT
• Member since: [date]
• Frequency: [classes per week]
• Is this first feedback: [yes/no]`,
        type: "textarea",
        required: true,
      },
      {
        fieldName: "tags",
        label: "Tags",
        value: ["feedback", "instructor"],
        type: "tags",
      },
    ],
    tags: ["feedback", "instructor"],
    color: "from-yellow-500 to-orange-500",
    quickTips: [
      "Thank customer for feedback",
      "Escalate positive feedback to instructor",
      "Plan coaching conversation if constructive",
      "Maintain professional tone always",
    ],
  },
  {
    id: "membership-issue",
    name: "Membership Issue",
    description: "Problems with membership status or benefits",
    icon: Users,
    category: "Account Management",
    priority: "medium",
    slaHours: 8,
    suggestedTitle: "Membership Status Issue",
    formFields: [
      {
        fieldName: "title",
        label: "Ticket Title",
        value: "Membership Status Issue",
        type: "text",
        required: true,
      },
      {
        fieldName: "priority",
        label: "Priority",
        value: "medium",
        type: "select",
        required: true,
      },
      {
        fieldName: "category",
        label: "Category",
        value: "Account Management",
        type: "select",
        required: true,
      },
      {
        fieldName: "description",
        label: "Description",
        value: `👤 MEMBER DETAILS
• Member ID: [id]
• Email: [email]
• Current membership: [tier]
• Membership status: [active/expired/suspended]

❓ ISSUE DESCRIPTION
[Describe the membership issue]

📊 MEMBERSHIP HISTORY
• Membership start date: [date]
• Current benefits: [list]
• Classes remaining: [number]
• Renewal date: [date]`,
        type: "textarea",
        required: true,
      },
      {
        fieldName: "tags",
        label: "Tags",
        value: ["membership", "account"],
        type: "tags",
      },
    ],
    tags: ["membership", "account"],
    color: "from-indigo-500 to-purple-500",
    quickTips: [
      "Verify membership in system immediately",
      "Check renewal status and dates",
      "Confirm benefits match member expectations",
      "Offer upgrade/renewal options if applicable",
    ],
  },
];

/**
 * Template Selector Component
 * Shows available templates and applies selection
 */
interface TemplateSelectorProps {
  onSelect: (template: EnhancedTicketTemplate) => void;
  selectedId?: string;
}

export function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full justify-start text-muted-foreground"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {selectedId ? "Change Template" : "Select a Template"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Ticket Templates
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {ENHANCED_TEMPLATES.map((template) => (
              <TemplatePreview
                key={template.id}
                template={template}
                isSelected={selectedId === template.id}
                onSelect={() => {
                  onSelect(template);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Template Preview Card
 */
interface TemplatePreviewProps {
  template: EnhancedTicketTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplatePreview({ template, isSelected, onSelect }: TemplatePreviewProps) {
  const Icon = template.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className="cursor-pointer"
    >
      <Card
        className={cn(
          "border-2 transition-all hover:shadow-lg",
          isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br", template.color, "bg-opacity-10")}>
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            {isSelected && <Check className="w-5 h-5 text-primary" />}
          </div>
          <CardTitle className="text-base">{template.name}</CardTitle>
          <CardDescription className="text-xs">{template.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-semibold">Priority:</span> {template.priority}
            </p>
            <p>
              <span className="font-semibold">SLA:</span> {template.slaHours}h
            </p>
            <p>
              <span className="font-semibold">Fields:</span> {template.formFields.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Template Application Hook
 * Use this to apply template values to form
 */
export function useTemplateApplication() {
  return {
    applyTemplate: (template: EnhancedTicketTemplate, formSetValue: any) => {
      // Apply each field from the template
      template.formFields.forEach((field) => {
        formSetValue(field.fieldName, field.value);
      });

      return {
        appliedTemplate: template.id,
        fieldsApplied: template.formFields.length,
        message: `✓ ${template.name} template applied! ${template.formFields.length} fields populated.`,
      };
    },
  };
}

/**
 * Quick Tips Component
 */
interface QuickTipsProps {
  tips?: string[];
  title?: string;
}

export function QuickTips({ tips = [], title = "Quick Tips" }: QuickTipsProps) {
  if (!tips.length) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-amber-600 flex-shrink-0">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Common Follow-ups Component
 */
interface CommonFollowUpsProps {
  followUps?: string[];
}

export function CommonFollowUps({ followUps = [] }: CommonFollowUpsProps) {
  if (!followUps.length) return null;

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Common Follow-ups
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
          {followUps.map((followUp, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-blue-600 flex-shrink-0">→</span>
              <span>{followUp}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default ENHANCED_TEMPLATES;
