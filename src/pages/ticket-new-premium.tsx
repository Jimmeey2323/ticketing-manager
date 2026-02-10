/**
 * Premium Ticket Creation Flow
 * Multi-step form with glassmorphic design and template preview
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  FileText,
  Tag,
  User,
  Calendar,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { glassStyles } from "@/lib/glassmorphic-design";
import { ENHANCED_TEMPLATES, type EnhancedTicketTemplate } from "@/components/enhanced-ticket-templates";

const steps = [
  { id: 1, name: "Template", description: "Choose a template or start blank" },
  { id: 2, name: "Details", description: "Fill in ticket information" },
  { id: 3, name: "Review", description: "Preview and submit" },
];

interface TicketFormData {
  title: string;
  description: string;
  priority: string;
  category: string;
  tags: string[];
}

export default function TicketCreationPremium() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedTicketTemplate | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EnhancedTicketTemplate | null>(null);

  const form = useForm<TicketFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "",
      tags: [],
    },
  });

  const handleTemplateSelect = (template: EnhancedTicketTemplate) => {
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleUseTemplate = () => {
    if (previewTemplate) {
      // Populate form with template values
      previewTemplate.formFields.forEach((field) => {
        if (field.fieldName === "tags" && Array.isArray(field.value)) {
          form.setValue("tags", field.value);
        } else if (typeof field.value === "string") {
          form.setValue(field.fieldName as keyof TicketFormData, field.value);
        }
      });
      setSelectedTemplate(previewTemplate);
      setShowTemplatePreview(false);
      setCurrentStep(2);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (data: TicketFormData) => {
    console.log("Submitting ticket:", data);
    // API call to create ticket
  };

  return (
    <div className={cn("min-h-screen", glassStyles.backgrounds.app)}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={cn("text-4xl font-bold mb-2", glassStyles.textGradients.primary)}>
            Create New Ticket
          </h1>
          <p className="text-slate-600 text-lg">
            Use a template or create a custom ticket from scratch
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div className="flex items-center flex-1">
                  <div className="relative">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-semibold transition-all duration-300",
                        currentStep > step.id
                          ? cn(glassStyles.gradients.success, "text-white")
                          : currentStep === step.id
                          ? cn(glassStyles.gradients.accent, "text-white", glassStyles.effects.glow)
                          : "bg-white/60 text-slate-400 border border-slate-200"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p
                      className={cn(
                        "font-semibold",
                        currentStep >= step.id ? "text-slate-900" : "text-slate-400"
                      )}
                    >
                      {step.name}
                    </p>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        currentStep > step.id
                          ? glassStyles.gradients.success
                          : "bg-slate-200"
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Template Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={cn("rounded-2xl border-0 mb-6", glassStyles.cards.primary)}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    Quick Start Templates
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Jump-start with a pre-configured template or start from scratch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {ENHANCED_TEMPLATES.map((template) => {
                      const Icon = template.icon;
                      return (
                        <motion.div
                          key={template.id}
                          whileHover={{ y: -4 }}
                          className={cn(
                            "p-6 rounded-xl border-2 cursor-pointer transition-all",
                            glassStyles.cards.secondary,
                            selectedTemplate?.id === template.id
                              ? "border-purple-500 bg-purple-50/50"
                              : "border-transparent hover:border-slate-300"
                          )}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                `bg-gradient-to-br ${template.color}`
                              )}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 mb-1">
                                {template.name}
                              </h3>
                              <p className="text-sm text-slate-600 mb-3">
                                {template.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={cn("rounded-lg text-xs", glassStyles.badges.secondary)}>
                                  {template.priority}
                                </Badge>
                                <Badge className={cn("rounded-lg text-xs", glassStyles.badges.secondary)}>
                                  {template.formFields.length} fields
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Start Blank Option */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={cn(
                      "p-6 rounded-xl border-2 cursor-pointer transition-all",
                      glassStyles.cards.secondary,
                      selectedTemplate === null
                        ? "border-purple-500 bg-purple-50/50"
                        : "border-transparent hover:border-slate-300"
                    )}
                    onClick={() => {
                      setSelectedTemplate(null);
                      form.reset();
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          glassStyles.gradients.primary
                        )}
                      >
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">
                          Start from Blank
                        </h3>
                        <p className="text-sm text-slate-600">
                          Create a custom ticket without a template
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleNextStep}
                  className={cn(
                    "rounded-xl px-8",
                    glassStyles.buttons.primary
                  )}
                >
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Form Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={cn("rounded-2xl border-0 mb-6", glassStyles.cards.primary)}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Ticket Information
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {selectedTemplate
                      ? `Using ${selectedTemplate.name} template - customize as needed`
                      : "Fill in the details for your new ticket"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Ticket Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...form.register("title", { required: true })}
                      placeholder="Brief summary of the issue"
                      className={cn("rounded-xl", glassStyles.inputs.glass)}
                    />
                  </div>

                  {/* Priority & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        Priority <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.watch("priority")}
                        onValueChange={(value) => form.setValue("priority", value)}
                      >
                        <SelectTrigger className={cn("rounded-xl", glassStyles.inputs.glass)}>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.watch("category")}
                        onValueChange={(value) => form.setValue("category", value)}
                      >
                        <SelectTrigger className={cn("rounded-xl", glassStyles.inputs.glass)}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booking">Booking & Technology</SelectItem>
                          <SelectItem value="customer">Customer Service</SelectItem>
                          <SelectItem value="account">Account Management</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      {...form.register("description", { required: true })}
                      placeholder="Detailed description of the issue..."
                      rows={8}
                      className={cn("rounded-xl", glassStyles.inputs.glass)}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {form.watch("tags")?.map((tag, idx) => (
                        <Badge
                          key={idx}
                          className={cn("rounded-lg", glassStyles.badges.secondary)}
                        >
                          {tag}
                          <button
                            onClick={() => {
                              const newTags = form.watch("tags").filter((_, i) => i !== idx);
                              form.setValue("tags", newTags);
                            }}
                            className="ml-2"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePrevStep}
                  className={cn("rounded-xl px-8", glassStyles.buttons.secondary)}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleNextStep}
                  className={cn("rounded-xl px-8", glassStyles.buttons.primary)}
                >
                  Review <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={cn("rounded-2xl border-0 mb-6", glassStyles.cards.primary)}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    Review & Submit
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Double-check the information before creating the ticket
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className={cn("p-6 rounded-xl", glassStyles.cards.secondary)}>
                    <h3 className="font-semibold text-slate-900 mb-4">Ticket Summary</h3>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-600 text-sm">Title</Label>
                        <p className="text-slate-900 font-medium">{form.watch("title")}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-600 text-sm">Priority</Label>
                          <p className="text-slate-900 font-medium capitalize">
                            {form.watch("priority")}
                          </p>
                        </div>
                        <div>
                          <Label className="text-slate-600 text-sm">Category</Label>
                          <p className="text-slate-900 font-medium">{form.watch("category")}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-600 text-sm">Description</Label>
                        <p className="text-slate-900 whitespace-pre-wrap">
                          {form.watch("description")}
                        </p>
                      </div>
                      {form.watch("tags")?.length > 0 && (
                        <div>
                          <Label className="text-slate-600 text-sm">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {form.watch("tags").map((tag, idx) => (
                              <Badge key={idx} className={cn("rounded-lg", glassStyles.badges.secondary)}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handlePrevStep}
                  className={cn("rounded-xl px-8", glassStyles.buttons.secondary)}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Edit
                </Button>
                <Button
                  size="lg"
                  onClick={form.handleSubmit(handleSubmit)}
                  className={cn("rounded-xl px-8", glassStyles.buttons.accent)}
                >
                  <Check className="w-5 h-5 mr-2" /> Create Ticket
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Preview Dialog */}
        <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
          <DialogContent className={cn("max-w-2xl rounded-2xl border-0", glassStyles.cards.primary)}>
            {previewTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        `bg-gradient-to-br ${previewTemplate.color}`
                      )}
                    >
                      <previewTemplate.icon className="w-6 h-6 text-white" />
                    </div>
                    {previewTemplate.name} Template
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-slate-600">{previewTemplate.description}</p>

                  <div className={cn("p-4 rounded-xl", glassStyles.cards.secondary)}>
                    <h4 className="font-semibold text-slate-900 mb-2">Pre-configured Fields</h4>
                    <div className="space-y-2">
                      {previewTemplate.formFields.map((field, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="text-slate-600">{field.label}:</span>{" "}
                          <span className="text-slate-900 font-medium">
                            {Array.isArray(field.value) ? field.value.join(", ") : String(field.value).slice(0, 50)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {previewTemplate.quickTips && previewTemplate.quickTips.length > 0 && (
                    <div className={cn("p-4 rounded-xl bg-blue-50/50")}>
                      <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        Quick Tips
                      </h4>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {previewTemplate.quickTips.map((tip, idx) => (
                          <li key={idx}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplatePreview(false)}
                      className={cn("flex-1 rounded-xl", glassStyles.buttons.secondary)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUseTemplate}
                      className={cn("flex-1 rounded-xl", glassStyles.buttons.accent)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Use This Template
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
