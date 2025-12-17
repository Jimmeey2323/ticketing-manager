import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  X,
  CheckCircle,
  AlertCircle,
  Ticket,
  Star,
  Lightbulb,
  Target,
  TrendingUp,
  Wand2,
  FileText,
  ArrowRight,
  Building2,
  Calendar,
  Phone,
  Mail,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { CATEGORIES, STUDIOS, TRAINERS, PRIORITIES } from "@/lib/constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  ticketCreated?: {
    ticketNumber: string;
    title: string;
    category: string;
    priority: string;
    studio: string;
  };
  currentQuestion?: ConversationQuestion;
  collectedData?: Partial<TicketData>;
}

interface ConversationQuestion {
  id: string;
  question: string;
  type: "single-select" | "multi-select" | "text" | "confirm";
  options?: { value: string; label: string; icon?: any; description?: string }[];
  field: keyof TicketData;
  required?: boolean;
}

interface TicketData {
  category: string;
  subcategory: string;
  studio: string;
  priority: string;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  trainerName: string;
  className: string;
  classDate: string;
  feedbackType: string;
  sentiment: string;
}

interface AIFeedbackChatbotProps {
  onClose?: () => void;
  onAutoFill?: (data: any) => void;
  className?: string;
}

// Question flow for guided ticket creation
const CONVERSATION_FLOW: ConversationQuestion[] = [
  {
    id: "feedbackType",
    question: "What type of feedback would you like to submit?",
    type: "single-select",
    field: "feedbackType",
    required: true,
    options: [
      { value: "complaint", label: "Report an Issue", icon: AlertCircle, description: "Something went wrong" },
      { value: "trainer-feedback", label: "Trainer Feedback", icon: Star, description: "About an instructor" },
      { value: "suggestion", label: "Suggestion", icon: Lightbulb, description: "Improvement idea" },
      { value: "inquiry", label: "General Inquiry", icon: MessageCircle, description: "Question or help" },
    ],
  },
  {
    id: "category",
    question: "Which area does this relate to?",
    type: "single-select",
    field: "category",
    required: true,
    options: CATEGORIES.map(cat => ({
      value: cat.id,
      label: cat.name,
      description: cat.subcategories?.slice(0, 2).join(", ") || "",
    })),
  },
  {
    id: "studio",
    question: "Which studio location is this about?",
    type: "single-select",
    field: "studio",
    required: true,
    options: STUDIOS.map(s => ({
      value: s.id,
      label: s.name,
      description: s.city,
    })),
  },
  {
    id: "priority",
    question: "How urgent is this?",
    type: "single-select",
    field: "priority",
    required: true,
    options: [
      { value: "critical", label: "Critical", description: "Needs immediate attention" },
      { value: "high", label: "High", description: "Important, resolve today" },
      { value: "medium", label: "Medium", description: "Normal priority" },
      { value: "low", label: "Low", description: "When time permits" },
    ],
  },
  {
    id: "description",
    question: "Please describe what happened in detail:",
    type: "text",
    field: "description",
    required: true,
  },
  {
    id: "customerName",
    question: "What is the customer's name? (if applicable)",
    type: "text",
    field: "customerName",
    required: false,
  },
  {
    id: "customerEmail",
    question: "Customer's email for follow-up? (optional)",
    type: "text",
    field: "customerEmail",
    required: false,
  },
  {
    id: "confirm",
    question: "Ready to create this ticket?",
    type: "confirm",
    field: "title",
    options: [
      { value: "yes", label: "Create Ticket", description: "Submit now" },
      { value: "edit", label: "Edit Details", description: "Make changes" },
    ],
  },
];

const TRAINER_QUESTIONS: ConversationQuestion[] = [
  {
    id: "trainerName",
    question: "Which trainer is this feedback about?",
    type: "single-select",
    field: "trainerName",
    required: true,
    options: TRAINERS.map(t => ({
      value: t.name,
      label: t.name,
      description: t.specialization,
    })),
  },
  {
    id: "className",
    question: "Which class was this? (optional)",
    type: "text",
    field: "className",
  },
];

export function AIFeedbackChatbot({ onClose, onAutoFill, className }: AIFeedbackChatbotProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Partial<TicketData>>({});
  const [questionFlow, setQuestionFlow] = useState<ConversationQuestion[]>([]);
  const [conversationStarted, setConversationStarted] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your AI assistant. I'll help you create a ticket step by step.\n\nJust answer a few quick questions and I'll handle the rest!",
      timestamp: new Date(),
      currentQuestion: CONVERSATION_FLOW[0],
    }]);
    setQuestionFlow(CONVERSATION_FLOW);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Build dynamic question flow based on feedback type
  const buildQuestionFlow = useCallback((feedbackType: string) => {
    let flow = [...CONVERSATION_FLOW];
    
    // Insert trainer questions after category for trainer feedback
    if (feedbackType === "trainer-feedback") {
      const categoryIndex = flow.findIndex(q => q.id === "category");
      flow.splice(categoryIndex + 1, 0, ...TRAINER_QUESTIONS);
    }
    
    return flow;
  }, []);

  // Handle option selection
  const handleOptionSelect = useCallback(async (value: string, question: ConversationQuestion) => {
    if (isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question.options?.find(o => o.value === value)?.label || value,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Update collected data
    const newData = { ...collectedData, [question.field]: value };
    setCollectedData(newData);

    // Special handling for feedback type - update flow
    if (question.id === "feedbackType") {
      const newFlow = buildQuestionFlow(value);
      setQuestionFlow(newFlow);
    }

    // Handle confirmation
    if (question.id === "confirm") {
      if (value === "yes") {
        await createTicket(newData);
        return;
      } else {
        // Reset to start
        setCurrentQuestionIndex(0);
        setCollectedData({});
        setMessages([{
          id: "restart",
          role: "assistant",
          content: "No problem! Let's start over.",
          timestamp: new Date(),
          currentQuestion: CONVERSATION_FLOW[0],
        }]);
        return;
      }
    }

    // Move to next question
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400)); // Small delay for UX

    const currentFlow = question.id === "feedbackType" ? buildQuestionFlow(value) : questionFlow;
    const currentIndex = currentFlow.findIndex(q => q.id === question.id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < currentFlow.length) {
      const nextQuestion = currentFlow[nextIndex];
      setCurrentQuestionIndex(nextIndex);
      
      // If next is confirm, generate title first
      if (nextQuestion.id === "confirm") {
        const title = generateTitle(newData);
        newData.title = title;
        setCollectedData(newData);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: nextQuestion.id === "confirm" 
          ? `Great! Here's what I've prepared:\n\n📋 **${newData.title || "New Ticket"}**\n🏷️ Priority: ${newData.priority || "Medium"}\n📍 Studio: ${STUDIOS.find(s => s.id === newData.studio)?.name || "Not specified"}\n\n${nextQuestion.question}`
          : nextQuestion.question,
        timestamp: new Date(),
        currentQuestion: nextQuestion,
        collectedData: newData,
      }]);
    }

    setIsLoading(false);
  }, [collectedData, questionFlow, buildQuestionFlow, isLoading]);

  // Handle text input submission
  const handleTextSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const currentQuestion = questionFlow[currentQuestionIndex];
    if (!currentQuestion) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Update collected data
    const newData = { ...collectedData, [currentQuestion.field]: input.trim() };
    setCollectedData(newData);
    setInput("");

    // Move to next question
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questionFlow.length) {
      const nextQuestion = questionFlow[nextIndex];
      setCurrentQuestionIndex(nextIndex);

      // If next is confirm, generate title
      if (nextQuestion.id === "confirm") {
        const title = generateTitle(newData);
        newData.title = title;
        setCollectedData(newData);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: nextQuestion.id === "confirm"
          ? `Perfect! Here's the ticket summary:\n\n📋 **${newData.title}**\n🏷️ Priority: ${newData.priority || "Medium"}\n📍 Studio: ${STUDIOS.find(s => s.id === newData.studio)?.name || "Not specified"}\n\n${nextQuestion.question}`
          : nextQuestion.question,
        timestamp: new Date(),
        currentQuestion: nextQuestion,
        collectedData: newData,
      }]);
    }

    setIsLoading(false);
  }, [input, currentQuestionIndex, questionFlow, collectedData, isLoading]);

  // Generate title from collected data
  const generateTitle = (data: Partial<TicketData>): string => {
    const feedbackType = data.feedbackType || "Issue";
    const category = CATEGORIES.find(c => c.id === data.category)?.name || "";
    const trainer = data.trainerName ? ` - ${data.trainerName}` : "";
    const studio = STUDIOS.find(s => s.id === data.studio)?.name || "";
    
    if (feedbackType === "trainer-feedback" && data.trainerName) {
      return `Trainer Feedback - ${data.trainerName} - ${studio}`;
    }
    
    return `${category}${trainer} - ${studio}`.trim() || "New Support Ticket";
  };

  // Create ticket with predefined routes
  const createTicket = async (data: Partial<TicketData>) => {
    setIsCreatingTicket(true);
    
    try {
      // Generate ticket number
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      const ticketNumber = `TKT-${year}${month}${day}-${random}`;

      // Get category config for routing
      const categoryConfig = CATEGORIES.find(c => c.id === data.category);
      
      // Get department based on category (predefined routes, not AI)
      const { data: departments } = await supabase
        .from("departments")
        .select("id, name")
        .eq("isActive", true);
      
      const defaultDept = departments?.find(d => 
        d.name.toLowerCase().includes(categoryConfig?.defaultTeam?.toLowerCase() || "operations")
      );

      // Get studio
      const { data: studios } = await supabase
        .from("studios")
        .select("id")
        .eq("code", data.studio)
        .maybeSingle();

      const studioId = studios?.id || (await supabase.from("studios").select("id").limit(1).single()).data?.id;

      // Create ticket
      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert([{
          ticketNumber,
          title: data.title || generateTitle(data),
          description: data.description || "",
          categoryId: data.category,
          studioId,
          priority: data.priority || "medium",
          status: "new",
          source: "ai-chatbot",
          customerName: data.customerName || null,
          customerEmail: data.customerEmail || null,
          assignedDepartmentId: defaultDept?.id || null,
          reportedByUserId: user?.id,
          tags: [data.feedbackType, categoryConfig?.code].filter(Boolean),
          dynamicFieldData: {
            trainerName: data.trainerName,
            className: data.className,
            classDate: data.classDate,
            feedbackType: data.feedbackType,
            aiGenerated: true,
          },
        }])
        .select()
        .single();

      if (error) throw error;

      // Success message
      const studioName = STUDIOS.find(s => s.id === data.studio)?.name || "";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `✅ **Ticket Created Successfully!**\n\nYour ticket has been submitted and routed to the ${defaultDept?.name || "Operations"} team.\n\nIs there anything else I can help you with?`,
        timestamp: new Date(),
        ticketCreated: {
          ticketNumber,
          title: data.title || "",
          category: categoryConfig?.name || "",
          priority: data.priority || "medium",
          studio: studioName,
        },
      }]);

      toast({
        title: "Ticket Created",
        description: `${ticketNumber} has been created and assigned`,
      });

      // Reset for new ticket
      setCurrentQuestionIndex(0);
      setCollectedData({});

    } catch (error: any) {
      console.error("Error creating ticket:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Sorry, I couldn't create the ticket. Please try again or use the manual form.",
        timestamp: new Date(),
      }]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Render option buttons
  const renderOptions = (question: ConversationQuestion) => {
    if (!question.options) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-2 mt-3"
      >
        {question.options.map((option, idx) => {
          const Icon = option.icon;
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleOptionSelect(option.value, question)}
              disabled={isLoading || isCreatingTicket}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                "hover:border-primary hover:bg-primary/5 hover:shadow-md",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "bg-card/50 border-border/50"
              )}
            >
              {Icon && (
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{option.label}</p>
                {option.description && (
                  <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </motion.button>
          );
        })}
      </motion.div>
    );
  };

  return (
    <Card className={cn(
      "flex flex-col h-[700px] max-h-[90vh] border-2 border-primary/20 shadow-2xl overflow-hidden",
      "bg-gradient-to-b from-card to-card/95",
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
            >
              <Bot className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Ticket Assistant
              </span>
              <p className="text-xs text-muted-foreground font-normal">Quick guided ticket creation</p>
            </div>
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-purple-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
                    : "bg-muted/60 backdrop-blur-sm border border-border/50"
                )}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {/* Ticket created card */}
                  {message.ticketCreated && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Ticket Created
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-bold text-base">{message.ticketCreated.ticketNumber}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {message.ticketCreated.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {message.ticketCreated.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          📍 {message.ticketCreated.studio}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Current question options */}
                  {message.currentQuestion && message.role === "assistant" && (
                    renderOptions(message.currentQuestion)
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {(isLoading || isCreatingTicket) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-purple-500/20">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/60 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {isCreatingTicket ? "Creating ticket..." : "Thinking..."}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card/50 shrink-0">
        {questionFlow[currentQuestionIndex]?.type === "text" ? (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
              placeholder="Type your response..."
              disabled={isLoading || isCreatingTicket}
              className="rounded-xl"
            />
            <Button 
              onClick={handleTextSubmit}
              disabled={!input.trim() || isLoading || isCreatingTicket}
              className="rounded-xl px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground">
            Select an option above to continue
          </p>
        )}
      </div>
    </Card>
  );
}
