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
  { id: 1, name: "Intake", description: "Pick template or blank flow" },
  { id: 2, name: "Structured Form", description: "Capture issue, routing, and context" },
  { id: 3, name: "Validation", description: "Review and submit to queue" },
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
          const deadline = ticket?.slaDueAt
            ? new Date(ticket.slaDueAt).toLocaleString()
            : "As per configured SLA";
          notificationPromises.push(
            supabase.functions.invoke('send-ticket-notification', {
              body: {
                type: 'assignment',
                assignmentType: 'assignment',
                ticketNumber,
                ticketTitle: data.title,
                recipientEmail: assignee.email,
                recipientName: assignee.displayName || assignee.email,
                studioName,
                priority: data.priority,
                category: category?.name,
                deadline,
                nextSteps: [
                  "Review ticket details and customer context",
                  "Post initial action plan and first response",
                  "Complete status updates before SLA deadline",
                ],
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
          <FormItem>
            <FormLabel className="text-xs font-medium text-foreground/80">
              {fieldLabel}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {inputComponent === 'Select' || fieldTypeName === 'Dropdown' ? (
                <Select onValueChange={formField.onChange} value={(formField.value as string) || ''}>
                  <SelectTrigger className="h-9 rounded-lg text-xs">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {field.options?.filter(opt => opt && opt.trim() !== '').map((opt, idx) => (
                      <SelectItem key={idx} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : inputComponent === 'Textarea' || fieldTypeName === 'Long Text' ? (
                <Textarea
                  placeholder=""
                  value={(formField.value as string) || ''}
                  onChange={formField.onChange}
                  className="rounded-lg min-h-20 text-xs resize-none"
                />
              ) : inputComponent === 'Checkbox' || fieldTypeName === 'Checkbox' ? (
                <div className="flex items-center gap-2 h-9">
                  <Checkbox
                    id={field.uniqueId}
                    checked={formField.value === 'Yes' || formField.value === true}
                    onCheckedChange={(checked) => formField.onChange(checked ? 'Yes' : 'No')}
                    className="h-4 w-4"
                  />
                  <label htmlFor={field.uniqueId} className="text-xs text-foreground/70 cursor-pointer">
                    Yes
                  </label>
                </div>
              ) : (
                <Input
                  type={fieldTypeName === 'Email' ? 'email' : fieldTypeName === 'Phone' ? 'tel' : 'text'}
                  placeholder=""
                  value={(formField.value as string) || ''}
                  onChange={formField.onChange}
                  className="h-9 rounded-lg text-xs"
                />
              )}
            </FormControl>
            {field.description && (
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">{field.description}</p>
            )}
            <FormMessage className="text-[10px]" />
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
                Structured Ticket Intake
              </h1>
              <p className="text-sm text-muted-foreground">
                Modern guided flow with routing controls and context modules
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
                                navigate(`/tickets/new?template=${template.id}`);
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
                  className="space-y-5"
                >
                  {/* Progress Guide */}
                  <Card className={cn("rounded-2xl border-0 shadow-lg", glassStyles.cards.primary)}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("p-2 rounded-xl", glassStyles.gradients.accent)}>
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">Ticket Creation Guide</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Complete each section below - required fields are marked with *
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        {[
                          { num: "1", title: "Basic Info", icon: FileText, color: "text-blue-600" },
                          { num: "2", title: "Classification", icon: Tag, color: "text-purple-600" },
                          { num: "3", title: "Assignment", icon: Users, color: "text-green-600" },
                          { num: "4", title: "Customer", icon: User, color: "text-orange-600" },
                          { num: "5", title: "Class/Trainer", icon: Calendar, color: "text-pink-600" },
                          { num: "6", title: "Details", icon: Clock, color: "text-teal-600" },
                        ].map((step) => (
                          <div
                            key={step.num}
                            className="flex flex-col items-center p-2 rounded-lg bg-muted/40 border border-border/50"
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
                                {step.num}
                              </span>
                              <step.icon className={cn("h-3.5 w-3.5", step.color)} />
                            </div>
                            <p className="text-[10px] font-semibold text-center">{step.title}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 1: Basic Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl shadow-md", glassStyles.gradients.primary)}>
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">1. Basic Information</h2>
                        <p className="text-xs text-muted-foreground">
                          Start with a clear description - AI will help create the title
                        </p>
                      </div>
                    </div>

                    <Card className={cn("rounded-2xl border-0 shadow-md", glassStyles.cards.primary)}>
                      <CardContent className="pt-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Issue Description *
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the issue or request"
                                  className={cn(
                                    "min-h-32 rounded-xl text-sm resize-none",
                                    isFieldHighlighted("description") && "template-field-highlight"
                                  )}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-xs flex items-start gap-1.5">
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                Include specific details like times, locations, people involved, and what resolution is needed
                              </FormDescription>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-blue-600" />
                                    Ticket Title *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Brief summary"
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
                            className={cn(
                              "rounded-xl text-sm h-10 px-4",
                              glassStyles.buttons.secondary
                            )}
                          >
                            {isGeneratingTitle ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            <span className="ml-2">AI Generate</span>
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                Priority Level
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                                >
                                  {Object.entries(PRIORITIES).map(([value, config]) => (
                                    <label
                                      key={value}
                                      className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all border-2 hover:shadow-md",
                                        field.value === value
                                          ? "border-primary bg-primary/10 shadow-md"
                                          : "border-border/60 hover:border-primary/50 bg-background/60"
                                      )}
                                    >
                                      <RadioGroupItem value={value} className="sr-only" />
                                      <span className={cn(
                                        "text-sm font-bold mb-1",
                                        field.value === value ? "text-primary" : "text-muted-foreground"
                                      )}>
                                        {config.label}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground text-center">
                                        {value === 'critical' ? '< 2 hrs' : value === 'high' ? '< 4 hrs' : value === 'medium' ? '< 24 hrs' : '< 48 hrs'}
                                      </span>
                                    </label>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormDescription className="text-xs flex items-start gap-1.5">
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                Priority determines response time - Critical for urgent customer-facing issues
                              </FormDescription>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <Separator className="my-6" />

                  {/* Section 2: Ticket Classification */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl shadow-md", glassStyles.gradients.success)}>
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">2. Ticket Classification</h2>
                        <p className="text-xs text-muted-foreground">
                          Categorize the ticket and specify location for proper routing
                        </p>
                      </div>
                    </div>

                    <Card className={cn("rounded-2xl border-0 shadow-md", glassStyles.cards.primary)}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="studioId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-purple-600" />
                                  Location / Studio *
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl bg-background text-sm h-11">
                                      <SelectValue placeholder={studiosLoading ? "Loading locations..." : "Select studio location"} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-popover border border-border z-50">
                                    {studios.map((studio) => (
                                      <SelectItem key={studio.id} value={studio.id} className="text-sm">
                                        <span className="flex items-center gap-2">
                                          <MapPin className="h-3.5 w-3.5 text-purple-600" />
                                          {studio.name}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs flex items-start gap-1.5">
                                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                  Which physical location is this ticket related to?
                                </FormDescription>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-purple-600" />
                                  Category *
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl bg-background text-sm h-11">
                                      <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select issue category"} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-popover border border-border z-50">
                                    {categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id} className="text-sm">
                                        <span className="flex items-center gap-2">
                                          <span
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: cat.color || '#3B82F6' }}
                                          />
                                          {cat.name}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs flex items-start gap-1.5">
                                  <Tag className="h-3 w-3 mt-0.5 shrink-0" />
                                  What type of issue is this? (billing, technical, service, etc.)
                                </FormDescription>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        {selectedCategoryId && subcategories.length > 0 && (
                          <FormField
                            control={form.control}
                            name="subcategoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <Tag className="h-4 w-4 text-purple-600" />
                                  Subcategory (Optional)
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl bg-background text-sm h-11">
                                      <SelectValue placeholder="Select a more specific category" />
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
                                <FormDescription className="text-xs">
                                  Narrow down the category for better routing and SLA management
                                </FormDescription>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Dynamic Custom Fields */}
                        {selectedCategoryId && dynamicFields.length > 0 && (
                          <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200/30 dark:border-purple-800/30">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                <Zap className="h-3 w-3 text-white" />
                              </div>
                              <h4 className="text-xs font-semibold text-foreground/90">Additional Fields</h4>
                              {fieldsLoading && <Loader2 className="h-3 w-3 animate-spin text-purple-600" />}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {dynamicFields.map(renderDynamicField)}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Separator className="my-6" />

                  {/* Section 3: Assignment & Routing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl shadow-md bg-gradient-to-br from-green-500 to-emerald-600")}>
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">3. Assignment & Routing</h2>
                        <p className="text-xs text-muted-foreground">
                          Auto-assign or manually select department and owner
                        </p>
                      </div>
                    </div>

                    <Card className={cn("rounded-2xl border-0 shadow-md", glassStyles.cards.primary)}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-border/50">
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Ticket ID</span>
                            <p className="font-mono font-bold text-sm text-primary mt-1">{ticketNumber}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Created</span>
                            <p className="font-semibold text-xs mt-1">{currentDateTime}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Reporter</span>
                            <p className="font-semibold text-xs truncate mt-1">{user?.email || 'Current User'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground font-medium">Status</span>
                            <Badge variant="secondary" className="mt-1 text-xs">New</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="assignedDepartmentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <Building className="h-4 w-4 text-green-600" />
                                  Department
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl bg-background text-sm h-11">
                                      <SelectValue placeholder="Auto-assign based on category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-popover border border-border z-50">
                                    <SelectItem value="_auto" className="text-sm font-semibold">
                                      <span className="flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                                        Auto-assign (AI Routing)
                                      </span>
                                    </SelectItem>
                                    {departments.map((dept) => (
                                      <SelectItem key={dept.id} value={dept.id} className="text-sm">
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs flex items-start gap-1.5">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  AI will route based on category and description if left on auto
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
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <User className="h-4 w-4 text-green-600" />
                                  Assigned To
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl bg-background text-sm h-11">
                                      <SelectValue placeholder="Auto-assign to available member" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-popover border border-border z-50">
                                    <SelectItem value="_auto" className="text-sm font-semibold">
                                      <span className="flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                                        Auto-assign
                                      </span>
                                    </SelectItem>
                                    {users.map((u) => (
                                      <SelectItem key={u.id} value={u.id} className="text-sm">
                                        {u.displayName || u.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs flex items-start gap-1.5">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  Manually assign to specific team member or use auto-assignment
                                </FormDescription>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator className="my-6" />

                  {/* Section 4: Customer/Client Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl shadow-md bg-gradient-to-br from-orange-500 to-amber-600")}>
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">4. Customer/Client Details</h2>
                        <p className="text-xs text-muted-foreground">
                          Optional - Add if ticket involves a specific customer
                        </p>
                      </div>
                    </div>

                    <Collapsible open={clientDetailsOpen} onOpenChange={setClientDetailsOpen}>
                      <Card className={cn("rounded-2xl border-0 shadow-md", glassStyles.cards.primary)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-all rounded-t-2xl pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg transition-all",
                                  clientDetailsOpen ? "bg-orange-100 dark:bg-orange-900/20" : "bg-muted/50"
                                )}>
                                  <User className={cn(
                                    "h-4 w-4 transition-colors",
                                    clientDetailsOpen ? "text-orange-600" : "text-muted-foreground"
                                  )} />
                                </div>
                                <div>
                                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    Client Information
                                    <Badge variant="outline" className="text-xs font-normal">
                                      {clientDetailsOpen ? "Expanded" : "Click to expand"}
                                    </Badge>
                                  </CardTitle>
                                  {!clientDetailsOpen && (
                                    <CardDescription className="text-xs mt-1">
                                      Click to add customer details and contact information
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {clientDetailsOpen ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-4 pt-0 pb-6">
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                <div className="text-xs text-blue-900 dark:text-blue-100">
                                  <p className="font-semibold mb-1">Quick Search Available</p>
                                  <p>Search Momence database below or enter details manually</p>
                                </div>
                              </div>
                            </div>

                            <MomenceClientSearch
                              onClientSelect={handleMomenceClientSelect}
                              selectedClient={selectedMomenceClient}
                            />

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="customerName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-semibold">Client Name *</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Full name"
                                        className={cn(
                                          "rounded-xl text-sm h-11",
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
                                    <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="email"
                                        placeholder="Email address"
                                        className={cn(
                                          "rounded-xl text-sm h-11",
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
                                    <FormLabel className="text-sm font-semibold">Phone Number</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="tel"
                                        placeholder="Phone number"
                                        className={cn(
                                          "rounded-xl text-sm h-11",
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
                                    <FormLabel className="text-sm font-semibold">Membership ID</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Member ID" className="rounded-xl text-sm h-11" {...field} />
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
                                    <FormLabel className="text-sm font-semibold">Client Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="rounded-xl bg-background text-sm h-11">
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
                                    <FormLabel className="text-sm font-semibold">Client Mood</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="rounded-xl bg-background text-sm h-11">
                                          <SelectValue placeholder="Client mood" />
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
                                    <FormDescription className="text-xs">
                                      Helps prioritize customer experience issues
                                    </FormDescription>
                                    <FormMessage className="text-xs" />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </div>

                  <Separator className="my-6" />

                  {/* Section 5: Class & Trainer Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl shadow-md bg-gradient-to-br from-pink-500 to-rose-600")}>
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">5. Class & Trainer Information</h2>
                        <p className="text-xs text-muted-foreground">
                          Optional - Add if ticket relates to a specific class or trainer
                        </p>
                      </div>
                    </div>

                    {/* Class Details */}
                    <Collapsible open={classDetailsOpen} onOpenChange={setClassDetailsOpen}>
                      <Card className={cn("rounded-2xl border-0 shadow-md", glassStyles.cards.primary)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-all rounded-t-2xl pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg transition-all",
                                  classDetailsOpen ? "bg-pink-100 dark:bg-pink-900/20" : "bg-muted/50"
                                )}>
                                  <Calendar className={cn(
                                    "h-4 w-4 transition-colors",
                                    classDetailsOpen ? "text-pink-600" : "text-muted-foreground"
                                  )} />
                                </div>
                                <div>
                                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    Class Details
                                    <Badge variant="outline" className="text-xs font-normal">
                                      {classDetailsOpen ? "Expanded" : "Click to expand"}
                                    </Badge>
                                  </CardTitle>
                                  {!classDetailsOpen && (
                                    <CardDescription className="text-xs mt-1">
                                      Click to add class information and schedule
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                              {classDetailsOpen ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-4 pt-0 pb-6">
                            <ClassSelector
                              onClassSelect={handleMomenceSessionSelect}
                              selectedClass={selectedMomenceSession}
                              label="Search Momence Classes"
                              placeholder="Search for class"
                            />

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="className"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-semibold">Class Name *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger
                                          className={cn(
                                            "rounded-xl bg-background text-sm h-11",
                                            isFieldHighlighted("className") && "template-field-highlight"
                                          )}
                                        >
                                          <SelectValue placeholder="Select class type" />
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
                                    <FormLabel className="text-sm font-semibold">Class Date & Time</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="datetime-local"
                                        className={cn(
                                          "rounded-xl text-sm h-11",
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

                    {/* Trainer Details */}
                    <Collapsible open={trainerDetailsOpen} onOpenChange={setTrainerDetailsOpen}>
                      <Card className={cn("rounded-2xl border-0 shadow-md", glassStyles.cards.primary)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-all rounded-t-2xl pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg transition-all",
                                  trainerDetailsOpen ? "bg-pink-100 dark:bg-pink-900/20" : "bg-muted/50"
                                )}>
                                  <Dumbbell className={cn(
                                    "h-4 w-4 transition-colors",
                                    trainerDetailsOpen ? "text-pink-600" : "text-muted-foreground"
                                  )} />
                                </div>
                                <div>
                                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    Trainer Details
                                    <Badge variant="outline" className="text-xs font-normal">
                                      {trainerDetailsOpen ? "Expanded" : "Click to expand"}
                                    </Badge>
                                  </CardTitle>
                                  {!trainerDetailsOpen && (
                                    <CardDescription className="text-xs mt-1">
                                      Click to add trainer information and contact details
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                              {trainerDetailsOpen ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-4 pt-0 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="trainerName"
                                render={({ field }) => (
                                  <FormItem className="md:col-span-2">
                                    <FormLabel className="text-sm font-semibold">Trainer Name *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger
                                          className={cn(
                                            "rounded-xl bg-background text-sm h-11",
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
                                    <FormLabel className="text-sm font-semibold">Trainer Email</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="email"
                                        placeholder="Email address"
                                        className={cn(
                                          "rounded-xl text-sm h-11",
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
                                    <FormLabel className="text-sm font-semibold">Trainer Phone</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="tel"
                                        placeholder="Phone number"
                                        className={cn(
                                          "rounded-xl text-sm h-11",
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
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-900 dark:text-amber-100">
                                  When adding trainer details, name is required and at least one contact method (email or phone) must be provided
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </div>

                  <Separator className="my-6" />

                  {/* Section 6: Additional Details & Attachments */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl shadow-md bg-gradient-to-br from-teal-500 to-cyan-600")}>
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">6. Additional Details & Attachments</h2>
                        <p className="text-xs text-muted-foreground">
                          Optional - Add internal notes, incident timing, and supporting files
                        </p>
                      </div>
                    </div>

                    <Card className={cn("rounded-2xl border-0 shadow-md", glassStyles.cards.primary)}>
                      <CardContent className="pt-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="internalNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-teal-600" />
                                Internal Notes (Staff Only)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add internal notes or action items for staff"
                                  className="min-h-24 rounded-xl text-sm resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-xs flex items-start gap-1.5">
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                These notes are private and won't be shared with customers
                              </FormDescription>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="incidentDateTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-teal-600" />
                                  Incident Date & Time
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    className={cn(
                                      "rounded-xl text-sm h-11",
                                      isFieldHighlighted("incidentDateTime") && "template-field-highlight"
                                    )}
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  When did this actually happen? (defaults to now)
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
                                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                  <Send className="h-4 w-4 text-teal-600" />
                                  Ticket Source
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl bg-background text-sm h-11">
                                      <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-popover border border-border z-50">
                                    <SelectItem value="in-person" className="text-sm">In Person</SelectItem>
                                    <SelectItem value="phone" className="text-sm">Phone Call</SelectItem>
                                    <SelectItem value="email" className="text-sm">Email</SelectItem>
                                    <SelectItem value="momence" className="text-sm">Momence Platform</SelectItem>
                                    <SelectItem value="chat" className="text-sm">Live Chat</SelectItem>
                                    <SelectItem value="social-media" className="text-sm">Social Media</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs">
                                  How did you receive this issue report?
                                </FormDescription>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-sm font-semibold flex items-center gap-2 mb-3">
                            <Paperclip className="h-4 w-4 text-teal-600" />
                            File Attachments
                          </Label>
                          <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 text-center bg-muted/20">
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
                              className="cursor-pointer flex flex-col items-center gap-3"
                            >
                              <div className="p-3 rounded-xl bg-primary/10">
                                <Upload className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground mb-1">
                                  Upload Supporting Files
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Click to browse or drag files here
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Supports: Images, PDF, DOC (Max 5 files)
                                </p>
                              </div>
                            </label>
                          </div>
                          {attachedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">
                                Attached Files ({attachedFiles.length}/5)
                              </p>
                              {attachedFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted/60 rounded-lg border border-border/50"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm truncate">{file.name}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      ({(file.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFile(index)}
                                    className="h-7 w-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 pb-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className={cn("rounded-xl px-8 text-sm h-11", glassStyles.buttons.secondary)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Templates
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className={cn("rounded-xl px-8 text-sm h-11 shadow-lg", glassStyles.buttons.primary)}
                    >
                      Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
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
