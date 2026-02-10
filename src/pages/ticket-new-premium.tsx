/**
 * Premium Ticket Creation Flow - Complete Implementation
 * 3-step wizard with glassmorphic design, real-time Supabase data, and AI features
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  FileText,
  User,
  Calendar,
  AlertCircle,
  X,
  Loader2,
  Hash,
  MapPin,
  Zap,
  Send,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Plus,
  Bot,
  Building,
  Users,
  Tag,
  Clock,
  Paperclip,
  Upload,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { glassStyles } from "@/lib/glassmorphic-design";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";
import { MomenceClientSearch } from "@/components/momence-client-search";
import { ClassSelector, type ClassSession } from "@/components/class-selector";
import { AIFeedbackChatbot } from "@/components/ai-feedback-chatbot";
import { TICKET_TEMPLATES } from "@/components/ticket-templates";
import { PRIORITIES, CLIENT_MOODS, CLIENT_STATUSES, TRAINERS, CLASSES } from "@/lib/constants";

// Types from Supabase
interface Category {
  id: string;
  name: string;
  code: string;
  icon: string | null;
  color: string | null;
  defaultPriority: string | null;
  slaHours: number | null;
}

interface Subcategory {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  defaultPriority: string | null;
}

interface DynamicField {
  id: string;
  uniqueId: string;
  label: string;
  fieldTypeId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  isRequired: boolean | null;
  isHidden: boolean | null;
  options: string[] | null;
  defaultValue: string | null;
  sortOrder: number | null;
  fieldType?: {
    name: string;
    inputComponent: string;
  };
}

interface Studio {
  id: string;
  name: string;
  code: string;
  address: any;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface UserRecord {
  id: string;
  displayName: string | null;
  email: string | null;
  role: string | null;
}

// Form schema with conditional validation
const ticketFormSchema = z.object({
  // Required core fields
  description: z.string().min(10, "Description must be at least 10 characters"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  studioId: z.string().min(1, "Please select a location/studio"),
  categoryId: z.string().min(1, "Please select a category"),
  subcategoryId: z.string().optional(),
  priority: z.string().default("medium"),

  // Assignment fields
  assignedDepartmentId: z.string().optional(),
  assignedToUserId: z.string().optional(),

  // Client details module
  includeClientDetails: z.boolean().default(false),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  customerMembershipId: z.string().optional(),
  customerStatus: z.string().optional(),
  clientMood: z.string().optional(),

  // Class details module
  includeClassDetails: z.boolean().default(false),
  className: z.string().optional(),
  classDateTime: z.string().optional(),

  // Trainer details module
  includeTrainerDetails: z.boolean().default(false),
  trainerName: z.string().optional(),
  trainerEmail: z.string().email().optional().or(z.literal("")),
  trainerPhone: z.string().optional(),

  // Additional fields
  incidentDateTime: z.string().optional(),
  internalNotes: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  // Client details validation
  if (data.includeClientDetails) {
    if (!data.customerName || data.customerName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Client name is required when client details are added",
        path: ["customerName"],
      });
    }
    if ((!data.customerEmail || data.customerEmail.trim() === "") &&
        (!data.customerPhone || data.customerPhone.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either email or phone is required for client",
        path: ["customerEmail"],
      });
    }
  }

  // Trainer details validation
  if (data.includeTrainerDetails) {
    if (!data.trainerName || data.trainerName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Trainer name is required when trainer details are added",
        path: ["trainerName"],
      });
    }
    if ((!data.trainerEmail || data.trainerEmail.trim() === "") &&
        (!data.trainerPhone || data.trainerPhone.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either email or phone is required for trainer",
        path: ["trainerEmail"],
      });
    }
  }

  // Class details validation
  if (data.includeClassDetails) {
    if (!data.className || data.className.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Class name is required when class details are added",
        path: ["className"],
      });
    }
  }
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

const steps = [
  { id: 1, name: "Template", description: "Choose template or start blank" },
  { id: 2, name: "Details", description: "Complete ticket information" },
  { id: 3, name: "Review", description: "Preview and submit" },
];

export default function TicketCreationPremium() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { user } = useAuth();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [ticketNumber, setTicketNumber] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [selectedMomenceClient, setSelectedMomenceClient] = useState<any>(null);
  const [selectedMomenceSession, setSelectedMomenceSession] = useState<ClassSession | null>(null);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  // Collapsible states
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [classDetailsOpen, setClassDetailsOpen] = useState(false);
  const [trainerDetailsOpen, setTrainerDetailsOpen] = useState(false);

  // Parse URL params for template
  const templateId = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get('template');
  }, [searchString]);

  // Generate ticket number on mount
  useEffect(() => {
    const generateTicketNumber = () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TKT-${year}${month}${day}-${random}`;
    };
    setTicketNumber(generateTicketNumber());
  }, []);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      description: "",
      title: "",
      studioId: "",
      categoryId: "",
      subcategoryId: "",
      priority: "medium",
      assignedDepartmentId: "_auto",
      assignedToUserId: "_auto",
      includeClientDetails: false,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerMembershipId: "",
      customerStatus: "",
      clientMood: "",
      includeClassDetails: false,
      className: "",
      classDateTime: "",
      includeTrainerDetails: false,
      trainerName: "",
      trainerEmail: "",
      trainerPhone: "",
      incidentDateTime: new Date().toISOString().slice(0, 16),
      internalNotes: "",
      source: "in-person",
      tags: [],
    },
    mode: "onChange",
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedSubcategoryId = form.watch("subcategoryId");
  const description = form.watch("description");
  const includeClientDetails = form.watch("includeClientDetails");
  const includeClassDetails = form.watch("includeClassDetails");
  const includeTrainerDetails = form.watch("includeTrainerDetails");

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('isActive', true)
        .order('sortOrder')
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch subcategories
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('categoryId', selectedCategoryId)
        .eq('isActive', true)
        .order('sortOrder')
        .order('name');
      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!selectedCategoryId,
  });

  // Fetch dynamic fields
  const { data: dynamicFields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['dynamicFields', selectedCategoryId, selectedSubcategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];

      let query = supabase
        .from('dynamicFields')
        .select(`*, fieldType:fieldTypes(name, inputComponent)`)
        .eq('isActive', true)
        .eq('isHidden', false)
        .eq('categoryId', selectedCategoryId);

      if (selectedSubcategoryId) {
        query = query.eq('subcategoryId', selectedSubcategoryId);
      } else {
        query = query.is('subcategoryId', null);
      }

      const { data, error } = await query.order('sortOrder');
      if (error) throw error;
      return data as DynamicField[];
    },
    enabled: !!selectedCategoryId,
  });

  // Fetch studios
  const { data: studios = [], isLoading: studiosLoading } = useQuery({
    queryKey: ['studios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studios')
        .select('*')
        .eq('isActive', true)
        .order('name');
      if (error) throw error;
      return data as Studio[];
    },
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('isActive', true)
        .order('name');
      if (error) throw error;
      return data as Department[];
    },
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, displayName, email, role')
        .eq('isActive', true)
        .order('displayName');
      if (error) throw error;
      return data as UserRecord[];
    },
  });

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      form.setValue('subcategoryId', '');
      const category = categories.find(c => c.id === selectedCategoryId);
      if (category?.defaultPriority) {
        form.setValue('priority', category.defaultPriority);
      }
    }
  }, [selectedCategoryId, categories, form]);

  // Sync collapsible state with form values
  useEffect(() => {
    form.setValue('includeClientDetails', clientDetailsOpen);
  }, [clientDetailsOpen, form]);

  useEffect(() => {
    form.setValue('includeClassDetails', classDetailsOpen);
  }, [classDetailsOpen, form]);

  useEffect(() => {
    form.setValue('includeTrainerDetails', trainerDetailsOpen);
  }, [trainerDetailsOpen, form]);

  // Template prefilling effect with formFields processing
  useEffect(() => {
    if (templateId && categories.length > 0 && currentStep === 1) {
      const template = TICKET_TEMPLATES.find(t => t.id === templateId);
      if (template && !selectedTemplateId) {
        setSelectedTemplateId(templateId);

        const matchingCategory = categories.find(
          c => c.name.toLowerCase().includes(template.category.toLowerCase().split(' ')[0]) ||
               template.category.toLowerCase().includes(c.name.toLowerCase())
        );

        if (matchingCategory) {
          form.setValue('categoryId', matchingCategory.id);
        }

        // Process formFields if available (new comprehensive template system)
        if (template.formFields && template.formFields.length > 0) {
          let hasCustomerFields = false;
          let hasClassFields = false;
          let hasTrainerFields = false;
          let firstHighlightedField: string | null = null;
          const highlightedFieldNames: string[] = [];

          template.formFields.forEach((field) => {
            const { fieldName, value, highlighted, placeholder } = field;

            // Track field types for auto-opening collapsible sections
            if (fieldName.startsWith('customer')) hasCustomerFields = true;
            if (fieldName.startsWith('class')) hasClassFields = true;
            if (fieldName.startsWith('trainer')) hasTrainerFields = true;

            // Track highlighted fields
            if (highlighted) {
              highlightedFieldNames.push(fieldName);
              if (!firstHighlightedField) {
                firstHighlightedField = fieldName;
              }
            }

            // Set field value - replace placeholder brackets with empty string for user input
            if (placeholder && typeof value === 'string' && value.match(/\[.*?\]/)) {
              form.setValue(fieldName as any, '');
            } else {
              form.setValue(fieldName as any, value);
            }
          });

          // Update highlighted fields state
          setHighlightedFields(highlightedFieldNames);

          // Auto-open relevant collapsible sections
          if (hasCustomerFields) {
            setClientDetailsOpen(true);
          }
          if (hasClassFields) {
            setClassDetailsOpen(true);
          }
          if (hasTrainerFields) {
            setTrainerDetailsOpen(true);
          }

          toast({
            title: "Template Applied",
            description: `Using "${template.name}" template. ${firstHighlightedField ? 'Highlighted fields require your input.' : 'Please review and customize.'}`,
          });

          // Auto advance to step 2 and scroll to first highlighted field
          setCurrentStep(2);
          setTimeout(() => {
            if (firstHighlightedField) {
              const element = document.querySelector(`[name="${firstHighlightedField}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (element as HTMLElement).focus();
              }
            }
          }, 300);
        } else {
          // Fallback to legacy template system
          form.setValue('title', template.suggestedTitle);
          form.setValue('description', template.suggestedDescription);
          form.setValue('priority', template.priority);

          if (template.category.includes('Customer') || template.category.includes('Service')) {
            setClientDetailsOpen(true);
          }
          if (template.suggestedDescription.toLowerCase().includes('class') ||
              template.suggestedDescription.toLowerCase().includes('trainer')) {
            setClassDetailsOpen(true);
            setTrainerDetailsOpen(true);
          }

          toast({
            title: "Template Applied",
            description: `Using "${template.name}" template. Please fill in the bracketed fields.`,
          });

          // Auto advance to step 2
          setCurrentStep(2);
        }
      }
    }
  }, [templateId, categories, form, toast, selectedTemplateId, currentStep]);

  // Generate AI title from description
  const generateTitle = useCallback(async () => {
    if (!description || description.length < 10) {
      toast({
        title: "Description too short",
        description: "Please enter at least 10 characters in the description to generate a title",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-ticket', {
        body: {
          description,
          action: 'generateTitle',
        }
      });

      if (error) throw error;

      if (data?.title) {
        form.setValue('title', data.title);
        toast({
          title: "Title generated",
          description: "AI has generated a title based on your description",
        });
      }
    } catch (error) {
      console.error('Error generating title:', error);
      const firstSentence = description.split(/[.!?]/)[0].trim();
      const fallbackTitle = firstSentence.length > 50
        ? firstSentence.substring(0, 47) + "..."
        : firstSentence;
      form.setValue('title', fallbackTitle || "Customer Issue");
      toast({
        title: "Title generated",
        description: "Created title from description",
      });
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [description, form, toast]);

  const handleMomenceClientSelect = (client: any) => {
    setSelectedMomenceClient(client);
    if (client) {
      form.setValue("customerName", `${client.firstName || ''} ${client.lastName || ''}`.trim());
      form.setValue("customerEmail", client.email || "");
      form.setValue("customerPhone", client.phoneNumber || "");
      form.setValue("customerMembershipId", client.id ? String(client.id) : "");
      form.setValue("source", "momence");
    }
  };

  // Helper to check if field should be highlighted
  const isFieldHighlighted = (fieldName: string): boolean => {
    return highlightedFields.includes(fieldName);
  };

  const handleMomenceSessionSelect = (session: ClassSession | null) => {
    setSelectedMomenceSession(session);
    if (session) {
      form.setValue("className", session.name || "");

      if (session.startsAt) {
        const sessionDate = new Date(session.startsAt);
        form.setValue("classDateTime", sessionDate.toISOString().slice(0, 16));
      }

      if (session.teacher) {
        const trainerFullName = `${session.teacher.firstName || ''} ${session.teacher.lastName || ''}`.trim();
        form.setValue("trainerName", trainerFullName);

        if (trainerFullName) {
          setTrainerDetailsOpen(true);
        }
      }

      form.setValue("source", "momence");
      setClassDetailsOpen(true);

      toast({
        title: "Class Selected",
        description: `Class "${session.name}" details have been filled in.`,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: TicketFormValues) => {
    try {
      setIsSubmitting(true);

      // Build dynamic field data
      const dynamicFieldData: Record<string, any> = {};
      dynamicFields.forEach((field) => {
        const value = (data as any)[field.uniqueId];
        if (value !== undefined && value !== "") {
          dynamicFieldData[field.uniqueId] = value;
        }
      });

      // Add optional module data
      if (data.includeClassDetails) {
        dynamicFieldData.className = data.className;
        dynamicFieldData.classDateTime = data.classDateTime;
      }
      if (data.includeTrainerDetails) {
        dynamicFieldData.trainerName = data.trainerName;
        dynamicFieldData.trainerEmail = data.trainerEmail;
        dynamicFieldData.trainerPhone = data.trainerPhone;
      }

      const category = categories.find(c => c.id === data.categoryId);
      const subcategory = subcategories.find(s => s.id === data.subcategoryId);

      // AI-powered routing analysis
      let aiRouting = null;
      try {
        const { data: routingData, error: routingError } = await supabase.functions.invoke('analyze-ticket', {
          body: {
            title: data.title,
            description: data.description,
            category: category?.name,
            subcategory: subcategory?.name,
            studioId: data.studioId,
          }
        });
        if (!routingError && routingData) {
          aiRouting = routingData;
          const priorityOrder = ['low', 'medium', 'high', 'critical'];
          if (aiRouting.priority && priorityOrder.indexOf(aiRouting.priority) > priorityOrder.indexOf(data.priority)) {
            data.priority = aiRouting.priority;
          }
        }
      } catch (aiError) {
        console.warn('AI routing failed:', aiError);
      }

      const ticketData = {
        ticketNumber,
        studioId: data.studioId,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId || null,
        priority: data.priority,
        title: data.title,
        description: data.description,
        customerName: data.includeClientDetails ? data.customerName || null : null,
        customerEmail: data.includeClientDetails ? data.customerEmail || null : null,
        customerPhone: data.includeClientDetails ? data.customerPhone || null : null,
        customerMembershipId: data.includeClientDetails ? data.customerMembershipId || null : null,
        customerStatus: data.includeClientDetails ? data.customerStatus || null : null,
        clientMood: data.includeClientDetails ? data.clientMood || null : null,
        incidentDateTime: data.incidentDateTime ? new Date(data.incidentDateTime).toISOString() : null,
        internalNotes: data.internalNotes || null,
        assignedDepartmentId: data.assignedDepartmentId && data.assignedDepartmentId !== '_auto' ? data.assignedDepartmentId : null,
        assignedToUserId: data.assignedToUserId && data.assignedToUserId !== '_auto' ? data.assignedToUserId : null,
        reportedByUserId: user?.id || null,
        dynamicFieldData: {
          ...dynamicFieldData,
          aiRouting: aiRouting ? {
            department: aiRouting.department,
            suggestedTags: aiRouting.suggestedTags,
            needsEscalation: aiRouting.needsEscalation,
            routingConfidence: aiRouting.routingConfidence,
            analysis: aiRouting.analysis,
          } : null,
        },
        source: data.source || 'in-person',
        status: aiRouting?.needsEscalation ? 'escalated' : 'new',
        tags: data.tags || aiRouting?.suggestedTags || [],
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;

      const studioName = studios.find(s => s.id === data.studioId)?.name || '';

      // Send email notifications
      const notificationPromises: Promise<any>[] = [];

      if (data.assignedToUserId && data.assignedToUserId !== '_auto') {
        const assignee = users.find(u => u.id === data.assignedToUserId);
        if (assignee?.email) {
          notificationPromises.push(
            supabase.functions.invoke('send-ticket-notification', {
              body: {
                type: 'assignment',
                ticketNumber,
                ticketTitle: data.title,
                recipientEmail: assignee.email,
                recipientName: assignee.displayName || assignee.email,
                studioName,
                priority: data.priority,
                category: category?.name,
                ticketUrl: `${window.location.origin}/tickets/${ticket.id}`,
              }
            }).catch(err => console.warn('Failed to send assignee notification:', err))
          );
        }
      }

      if (user?.email) {
        notificationPromises.push(
          supabase.functions.invoke('send-ticket-notification', {
            body: {
              type: 'status_change',
              ticketNumber,
              ticketTitle: data.title,
              recipientEmail: user.email,
              recipientName: user.firstName || user.email,
              oldStatus: 'Draft',
              newStatus: 'New',
              studioName,
              priority: data.priority,
              ticketUrl: `${window.location.origin}/tickets/${ticket.id}`,
            }
          }).catch(err => console.warn('Failed to send reporter notification:', err))
        );
      }

      if (data.includeClientDetails && data.customerEmail) {
        notificationPromises.push(
          supabase.functions.invoke('send-ticket-notification', {
            body: {
              type: 'status_change',
              ticketNumber,
              ticketTitle: data.title,
              recipientEmail: data.customerEmail,
              recipientName: data.customerName || data.customerEmail,
              oldStatus: 'Submitted',
              newStatus: 'Received',
              studioName,
              priority: data.priority,
              ticketUrl: `${window.location.origin}/tickets/${ticket.id}`,
            }
          }).catch(err => console.warn('Failed to send customer notification:', err))
        );
      }

      if (notificationPromises.length > 0) {
        Promise.all(notificationPromises).catch(err => {
          console.warn('Some notifications failed:', err);
        });
      }

      toast({
        title: "Ticket created successfully",
        description: `Ticket ${ticketNumber} has been submitted. Notifications sent.`,
      });

      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate("/tickets");
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error creating ticket",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render dynamic field
  const renderDynamicField = (field: DynamicField) => {
    const fieldTypeName = field.fieldType?.name || '';
    const inputComponent = field.fieldType?.inputComponent || 'Input';
    const fieldLabel = field.label || 'Field';

    return (
      <FormField
        key={field.uniqueId}
        control={form.control}
        name={field.uniqueId as any}
        render={({ field: formField }) => (
          <FormItem className="space-y-2">
            <FormLabel className="flex items-center gap-2 text-sm font-medium">
              {fieldLabel}
              {field.isRequired && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              {inputComponent === 'Select' || fieldTypeName === 'Dropdown' ? (
                <Select onValueChange={formField.onChange} value={(formField.value as string) || ''}>
                  <SelectTrigger className="rounded-xl bg-background/80 border-border/60 hover:border-primary/40 transition-colors text-sm">
                    <SelectValue placeholder={`Select ${fieldLabel.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {field.options?.filter(opt => opt && opt.trim() !== '').map((opt, idx) => (
                      <SelectItem key={idx} value={opt} className="text-sm">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : inputComponent === 'Textarea' || fieldTypeName === 'Long Text' ? (
                <Textarea
                  placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                  value={(formField.value as string) || ''}
                  onChange={formField.onChange}
                  className="rounded-xl bg-background/80 border-border/60 hover:border-primary/40 transition-colors min-h-24 text-sm"
                />
              ) : inputComponent === 'Checkbox' || fieldTypeName === 'Checkbox' ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/40">
                  <Checkbox
                    id={field.uniqueId}
                    checked={formField.value === 'Yes' || formField.value === true}
                    onCheckedChange={(checked) => formField.onChange(checked ? 'Yes' : 'No')}
                    className="h-5 w-5"
                  />
                  <label htmlFor={field.uniqueId} className="text-sm text-foreground/80 cursor-pointer">
                    Yes
                  </label>
                </div>
              ) : (
                <Input
                  type={fieldTypeName === 'Email' ? 'email' : fieldTypeName === 'Phone' ? 'tel' : 'text'}
                  placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                  value={(formField.value as string) || ''}
                  onChange={formField.onChange}
                  className="rounded-xl bg-background/80 border-border/60 hover:border-primary/40 transition-colors text-sm"
                />
              )}
            </FormControl>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    );
  };

  const currentDateTime = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const handleNextStep = async () => {
    if (currentStep === 2) {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Missing required fields",
          description: "Please complete all required fields before continuing",
          variant: "destructive",
        });
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={cn("min-h-screen", glassStyles.backgrounds.app)}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/tickets")}
              className="rounded-xl hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className={cn("text-3xl font-bold mb-1", glassStyles.textGradients.primary)}>
                Create New Ticket
              </h1>
              <p className="text-sm text-muted-foreground">
                Premium ticket creation with AI assistance
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAIChatbot(true)}
              className="rounded-xl gap-2 text-sm"
            >
              <Bot className="h-4 w-4" />
              AI Assistant
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex-1 flex items-center">
                  <div className="flex items-center flex-1">
                    <div className="relative">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 text-sm",
                          currentStep > step.id
                            ? cn(glassStyles.gradients.success, "text-white")
                            : currentStep === step.id
                            ? cn(glassStyles.gradients.accent, "text-white", glassStyles.effects.glow)
                            : "bg-white/60 text-slate-400 border border-slate-200"
                        )}
                      >
                        {currentStep > step.id ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span>{step.id}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p
                        className={cn(
                          "font-semibold text-sm",
                          currentStep >= step.id ? "text-slate-900" : "text-slate-400"
                        )}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-slate-500">{step.description}</p>
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
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Quick Start Templates
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Jump-start with a pre-configured template or start from scratch
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {TICKET_TEMPLATES.map((template) => {
                          const Icon = template.icon;
                          return (
                            <motion.div
                              key={template.id}
                              whileHover={{ y: -2 }}
                              className={cn(
                                "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                glassStyles.cards.secondary,
                                selectedTemplateId === template.id
                                  ? "border-purple-500 bg-purple-50/50"
                                  : "border-transparent hover:border-slate-300"
                              )}
                              onClick={() => {
                                navigate(`/tickets/new-premium?template=${template.id}`);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm mb-1">
                                    {template.name}
                                  </h3>
                                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                    {template.description}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge className={cn("text-xs", glassStyles.badges.secondary)}>
                                      {template.priority}
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
                        whileHover={{ y: -2 }}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer transition-all",
                          glassStyles.cards.secondary,
                          !selectedTemplateId
                            ? "border-purple-500 bg-purple-50/50"
                            : "border-transparent hover:border-slate-300"
                        )}
                        onClick={() => {
                          setSelectedTemplateId(null);
                          form.reset();
                          setCurrentStep(2);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", glassStyles.gradients.primary)}>
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm mb-1">
                              Start from Blank
                            </h3>
                            <p className="text-xs text-slate-600">
                              Create a custom ticket without a template
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleNextStep}
                      className={cn("rounded-xl px-8 text-sm", glassStyles.buttons.primary)}
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
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
                  className="space-y-4"
                >
                  {/* AI Description & Title */}
                  <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        AI Description & Title
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Describe the issue in detail. AI will help generate a title.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the issue in your own words..."
                                className={cn(
                                  "min-h-24 rounded-xl text-sm",
                                  isFieldHighlighted("description") && "template-field-highlight"
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Title *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Brief summary of the issue"
                                    className={cn(
                                      "rounded-xl text-sm",
                                      isFieldHighlighted("title") && "template-field-highlight"
                                    )}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateTitle}
                          disabled={isGeneratingTitle || description.length < 10}
                          className="rounded-xl text-sm h-10"
                        >
                          {isGeneratingTitle ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span className="ml-2">Generate</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Core Ticket Info */}
                  <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Hash className="h-4 w-4 text-emerald-600" />
                        Core Ticket Info
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Auto-generated fields. Department and Owner can be changed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-xl">
                        <div>
                          <span className="text-xs text-muted-foreground">Ticket ID</span>
                          <p className="font-mono font-semibold text-xs">{ticketNumber}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Date & Time</span>
                          <p className="font-medium text-xs">{currentDateTime}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Reported By</span>
                          <p className="font-medium text-xs truncate">{user?.email || 'Current User'}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Status</span>
                          <Badge variant="secondary" className="mt-1 text-xs">New</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="assignedDepartmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Routing Department</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl bg-background text-sm">
                                    <SelectValue placeholder="Auto-assign or select..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-popover border border-border z-50">
                                  <SelectItem value="_auto" className="text-sm">Auto-assign (AI routing)</SelectItem>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id} className="text-sm">
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs">
                                Leave empty for AI-based routing
                              </FormDescription>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="assignedToUserId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Assigned To / Owner</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl bg-background text-sm">
                                    <SelectValue placeholder="Auto-assign or select..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-popover border border-border z-50">
                                  <SelectItem value="_auto" className="text-sm">Auto-assign</SelectItem>
                                  {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id} className="text-sm">
                                      {u.displayName || u.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs">
                                Leave empty for auto-assignment
                              </FormDescription>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Classification & Location */}
                  <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        Classification & Location
                      </CardTitle>
                      <CardDescription className="text-xs">Categorize and assign the ticket</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Category *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl bg-background text-sm">
                                    <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id} className="text-sm">
                                      <span className="flex items-center gap-2">
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: cat.color || '#3B82F6' }}
                                        />
                                        {cat.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        {selectedCategoryId && subcategories.length > 0 && (
                          <FormField
                            control={form.control}
                            name="subcategoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Subcategory</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl bg-background text-sm">
                                      <SelectValue placeholder="Select subcategory" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-popover border border-border z-50">
                                    {subcategories.map((sub) => (
                                      <SelectItem key={sub.id} value={sub.id} className="text-sm">
                                        {sub.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="studioId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Location / Studio *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl bg-background text-sm">
                                    <SelectValue placeholder={studiosLoading ? "Loading..." : "Select location"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {studios.map((studio) => (
                                    <SelectItem key={studio.id} value={studio.id} className="text-sm">
                                      <span className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        {studio.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Priority Level</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-2 md:grid-cols-4 gap-2"
                              >
                                {Object.entries(PRIORITIES).map(([value, config]) => (
                                  <label
                                    key={value}
                                    className={cn(
                                      "flex items-center justify-center p-2 rounded-xl cursor-pointer transition-all border-2",
                                      field.value === value
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/30"
                                    )}
                                  >
                                    <RadioGroupItem value={value} className="sr-only" />
                                    <span className={cn(
                                      "text-xs font-medium",
                                      field.value === value ? "text-primary" : "text-muted-foreground"
                                    )}>
                                      {config.label}
                                    </span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Dynamic Custom Fields */}
                  {selectedCategoryId && (
                    <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Dynamic Custom Fields
                          {fieldsLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {dynamicFields.length > 0
                            ? "Category-specific fields to help resolve this ticket"
                            : subcategories.length > 0 && !selectedSubcategoryId
                              ? "Select a subcategory above to see additional fields"
                              : "No additional fields for this category"
                          }
                        </CardDescription>
                      </CardHeader>
                      {dynamicFields.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/20 rounded-xl border border-border/50">
                            {dynamicFields.map(renderDynamicField)}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Client Details Module */}
                  <Collapsible open={clientDetailsOpen} onOpenChange={setClientDetailsOpen}>
                    <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              Client Details Module
                              <Badge variant="outline" className="text-xs">Optional</Badge>
                            </CardTitle>
                            {clientDetailsOpen ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {clientDetailsOpen && (
                            <CardDescription className="text-xs">
                              Search Momence or enter client details manually
                            </CardDescription>
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-3 pt-0">
                          <MomenceClientSearch
                            onClientSelect={handleMomenceClientSelect}
                            selectedClient={selectedMomenceClient}
                          />

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="customerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Client Name *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Full name"
                                      className={cn(
                                        "rounded-xl text-sm",
                                        isFieldHighlighted("customerName") && "template-field-highlight"
                                      )}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="customerEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="email"
                                      placeholder="email@example.com"
                                      className={cn(
                                        "rounded-xl text-sm",
                                        isFieldHighlighted("customerEmail") && "template-field-highlight"
                                      )}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="customerPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Phone</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="tel"
                                      placeholder="+91 XXXXX XXXXX"
                                      className={cn(
                                        "rounded-xl text-sm",
                                        isFieldHighlighted("customerPhone") && "template-field-highlight"
                                      )}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="customerMembershipId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Membership ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Member ID" className="rounded-xl text-sm" {...field} />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="customerStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Client Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-xl bg-background text-sm">
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-popover border border-border z-50">
                                      {CLIENT_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value} className="text-sm">
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="clientMood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Client Mood</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-xl bg-background text-sm">
                                        <SelectValue placeholder="How was the client feeling?" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-popover border border-border z-50">
                                      {CLIENT_MOODS.map((mood) => (
                                        <SelectItem key={mood.value} value={mood.value} className="text-sm">
                                          {mood.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Class Details Module */}
                  <Collapsible open={classDetailsOpen} onOpenChange={setClassDetailsOpen}>
                    <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              Class Details Module
                              <Badge variant="outline" className="text-xs">Optional</Badge>
                            </CardTitle>
                            {classDetailsOpen ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {classDetailsOpen && (
                            <CardDescription className="text-xs">
                              Select from Momence classes or enter manually
                            </CardDescription>
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-3 pt-0">
                          <ClassSelector
                            onClassSelect={handleMomenceSessionSelect}
                            selectedClass={selectedMomenceSession}
                            label="Select Class from Momence"
                            placeholder="Search: Class Name | Date | Time | Teacher"
                          />

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="className"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Class Name *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "rounded-xl bg-background text-sm",
                                          isFieldHighlighted("className") && "template-field-highlight"
                                        )}
                                      >
                                        <SelectValue placeholder="Select class" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-popover border border-border z-50 max-h-60">
                                      {CLASSES.map((cls) => (
                                        <SelectItem key={cls} value={cls} className="text-sm">{cls}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="classDateTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Class Date & Time</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="datetime-local"
                                      className={cn(
                                        "rounded-xl text-sm",
                                        isFieldHighlighted("classDateTime") && "template-field-highlight"
                                      )}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Trainer Details Module */}
                  <Collapsible open={trainerDetailsOpen} onOpenChange={setTrainerDetailsOpen}>
                    <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-2xl pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Dumbbell className="h-4 w-4 text-primary" />
                              Trainer Details Module
                              <Badge variant="outline" className="text-xs">Optional</Badge>
                            </CardTitle>
                            {trainerDetailsOpen ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          {trainerDetailsOpen && (
                            <CardDescription className="text-xs">
                              Name and (email or phone) are required when this section is added
                            </CardDescription>
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-3 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="trainerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Trainer Name *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "rounded-xl bg-background text-sm",
                                          isFieldHighlighted("trainerName") && "template-field-highlight"
                                        )}
                                      >
                                        <SelectValue placeholder="Select trainer" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-popover border border-border z-50 max-h-60">
                                      {TRAINERS.map((trainer) => (
                                        <SelectItem key={trainer.id} value={trainer.name} className="text-sm">
                                          {trainer.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="trainerEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Trainer Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="email"
                                      placeholder="trainer@example.com"
                                      className={cn(
                                        "rounded-xl text-sm",
                                        isFieldHighlighted("trainerEmail") && "template-field-highlight"
                                      )}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="trainerPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Trainer Phone</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="tel"
                                      placeholder="+91 XXXXX XXXXX"
                                      className={cn(
                                        "rounded-xl text-sm",
                                        isFieldHighlighted("trainerPhone") && "template-field-highlight"
                                      )}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Additional Info */}
                  <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Additional Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField
                        control={form.control}
                        name="internalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Internal Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any additional notes for internal reference..."
                                className="min-h-20 rounded-xl text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              These notes are visible only to staff, not customers
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="incidentDateTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Incident Date & Time</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                className={cn(
                                  "rounded-xl text-sm",
                                  isFieldHighlighted("incidentDateTime") && "template-field-highlight"
                                )}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              When did the incident actually occur?
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Source</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-xl bg-background text-sm">
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-popover border border-border z-50">
                                <SelectItem value="in-person" className="text-sm">In Person</SelectItem>
                                <SelectItem value="phone" className="text-sm">Phone</SelectItem>
                                <SelectItem value="email" className="text-sm">Email</SelectItem>
                                <SelectItem value="momence" className="text-sm">Momence</SelectItem>
                                <SelectItem value="chat" className="text-sm">Chat</SelectItem>
                                <SelectItem value="social-media" className="text-sm">Social Media</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* File Attachments */}
                  <Card className={cn("rounded-2xl border-0", glassStyles.cards.primary)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-primary" />
                        File Attachments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Click to upload or drag files here
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Max 5 files (Images, PDF, DOC)
                          </span>
                        </label>
                      </div>
                      {attachedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {attachedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                            >
                              <span className="text-xs truncate">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className={cn("rounded-xl px-6 text-sm", glassStyles.buttons.secondary)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className={cn("rounded-xl px-6 text-sm", glassStyles.buttons.primary)}
                    >
                      Review <ArrowRight className="w-4 h-4 ml-2" />
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
                      <CardTitle className="text-base font-semibold">
                        Review & Submit
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Double-check the information before creating the ticket
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={cn("p-4 rounded-xl", glassStyles.cards.secondary)}>
                        <h3 className="font-semibold text-sm mb-3">Ticket Summary</h3>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Title</Label>
                            <p className="text-sm font-medium">{form.watch("title")}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Priority</Label>
                              <p className="text-sm font-medium capitalize">
                                {form.watch("priority")}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Category</Label>
                              <p className="text-sm font-medium">
                                {categories.find(c => c.id === form.watch("categoryId"))?.name || "Not selected"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Studio</Label>
                              <p className="text-sm font-medium">
                                {studios.find(s => s.id === form.watch("studioId"))?.name || "Not selected"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Ticket Number</Label>
                              <p className="text-sm font-mono font-bold">{ticketNumber}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p className="text-sm whitespace-pre-wrap">
                              {form.watch("description")}
                            </p>
                          </div>
                          {includeClientDetails && form.watch("customerName") && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Client</Label>
                              <p className="text-sm font-medium">
                                {form.watch("customerName")}
                                {form.watch("customerEmail") && ` (${form.watch("customerEmail")})`}
                              </p>
                            </div>
                          )}
                          {includeClassDetails && form.watch("className") && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Class</Label>
                              <p className="text-sm font-medium">{form.watch("className")}</p>
                            </div>
                          )}
                          {includeTrainerDetails && form.watch("trainerName") && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Trainer</Label>
                              <p className="text-sm font-medium">{form.watch("trainerName")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className={cn("rounded-xl px-6 text-sm", glassStyles.buttons.secondary)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn("rounded-xl px-8 text-sm", glassStyles.buttons.accent)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" /> Create Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Form>
      </div>

      {/* AI Feedback Chatbot Dialog */}
      <Dialog open={showAIChatbot} onOpenChange={setShowAIChatbot}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>AI Feedback Assistant</DialogTitle>
          </DialogHeader>
          <AIFeedbackChatbot onClose={() => setShowAIChatbot(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
