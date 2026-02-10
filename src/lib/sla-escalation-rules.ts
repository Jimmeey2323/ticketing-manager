/**
 * Comprehensive SLA and Escalation System
 * Defines SLA rules, escalation hierarchy, and auto-assignment logic
 */

// ============================================
// SLA RULES CONFIGURATION
// ============================================

export interface SLARule {
  priority: string;
  category?: string;
  responseTimeMinutes: number;      // First response SLA
  resolutionTimeHours: number;      // Full resolution SLA
  escalationThresholds: {
    level1: number;  // % of SLA time (e.g., 50% = escalate at 50% SLA consumed)
    level2: number;  // % of SLA time (e.g., 75% = escalate at 75% SLA consumed)
    level3: number;  // % of SLA time (e.g., 100% = escalate immediately when breached)
  };
  businessHoursOnly: boolean;
}

export const SLA_RULES: SLARule[] = [
  // CRITICAL PRIORITY - Immediate attention required
  {
    priority: "critical",
    category: "Health & Safety",
    responseTimeMinutes: 15,
    resolutionTimeHours: 1,
    escalationThresholds: {
      level1: 25,   // Escalate after 15 minutes
      level2: 50,   // Escalate to manager after 30 minutes
      level3: 75,   // Escalate to director after 45 minutes
    },
    businessHoursOnly: false,  // 24/7 coverage
  },
  {
    priority: "critical",
    category: "Payment Processing",
    responseTimeMinutes: 30,
    resolutionTimeHours: 2,
    escalationThresholds: {
      level1: 33,
      level2: 66,
      level3: 100,
    },
    businessHoursOnly: false,
  },
  {
    priority: "critical",
    // Default critical (no specific category)
    responseTimeMinutes: 30,
    resolutionTimeHours: 4,
    escalationThresholds: {
      level1: 40,
      level2: 70,
      level3: 100,
    },
    businessHoursOnly: false,
  },

  // HIGH PRIORITY - Urgent but not life-threatening
  {
    priority: "high",
    category: "Booking & Technology",
    responseTimeMinutes: 60,
    resolutionTimeHours: 4,
    escalationThresholds: {
      level1: 50,
      level2: 75,
      level3: 100,
    },
    businessHoursOnly: true,
  },
  {
    priority: "high",
    category: "Health & Safety",
    responseTimeMinutes: 60,
    resolutionTimeHours: 3,
    escalationThresholds: {
      level1: 45,
      level2: 70,
      level3: 100,
    },
    businessHoursOnly: true,
  },
  {
    priority: "high",
    // Default high priority
    responseTimeMinutes: 120,
    resolutionTimeHours: 8,
    escalationThresholds: {
      level1: 50,
      level2: 80,
      level3: 100,
    },
    businessHoursOnly: true,
  },

  // MEDIUM PRIORITY - Standard service
  {
    priority: "medium",
    category: "Customer Service",
    responseTimeMinutes: 240,
    resolutionTimeHours: 24,
    escalationThresholds: {
      level1: 60,
      level2: 85,
      level3: 100,
    },
    businessHoursOnly: true,
  },
  {
    priority: "medium",
    // Default medium priority
    responseTimeMinutes: 360,
    resolutionTimeHours: 48,
    escalationThresholds: {
      level1: 70,
      level2: 90,
      level3: 100,
    },
    businessHoursOnly: true,
  },

  // LOW PRIORITY - Non-urgent requests
  {
    priority: "low",
    responseTimeMinutes: 720,
    resolutionTimeHours: 72,
    escalationThresholds: {
      level1: 80,
      level2: 95,
      level3: 100,
    },
    businessHoursOnly: true,
  },
];

// ============================================
// ESCALATION HIERARCHY
// ============================================

export interface EscalationLevel {
  level: number;
  name: string;
  roles: string[];
  departments: string[];
  notificationTypes: ('email' | 'sms' | 'slack' | 'in-app')[];
  requiresAcknowledgment: boolean;
  autoAssign: boolean;
}

export const ESCALATION_HIERARCHY: EscalationLevel[] = [
  {
    level: 0,
    name: "Initial Assignment",
    roles: ["staff", "associate", "front-desk"],
    departments: ["Client Success", "Customer Service"],
    notificationTypes: ["email", "in-app"],
    requiresAcknowledgment: false,
    autoAssign: true,
  },
  {
    level: 1,
    name: "Team Lead",
    roles: ["senior-associate", "team-lead"],
    departments: ["Client Success", "Operations"],
    notificationTypes: ["email", "in-app", "slack"],
    requiresAcknowledgment: true,
    autoAssign: true,
  },
  {
    level: 2,
    name: "Manager",
    roles: ["manager", "senior-manager"],
    departments: ["Operations", "Management"],
    notificationTypes: ["email", "sms", "in-app", "slack"],
    requiresAcknowledgment: true,
    autoAssign: true,
  },
  {
    level: 3,
    name: "Director",
    roles: ["director", "senior-director"],
    departments: ["Management", "Executive"],
    notificationTypes: ["email", "sms", "in-app", "slack"],
    requiresAcknowledgment: true,
    autoAssign: false,  // Directors must explicitly accept
  },
  {
    level: 4,
    name: "Executive",
    roles: ["vp", "ceo", "coo"],
    departments: ["Executive"],
    notificationTypes: ["email", "sms"],
    requiresAcknowledgment: true,
    autoAssign: false,
  },
];

// ============================================
// AUTO-ASSIGNMENT RULES
// ============================================

export interface AssignmentRule {
  category: string;
  subcategory?: string;
  targetDepartment: string;
  targetRole?: string;
  priority?: string;
  routingLogic: 'round-robin' | 'least-busy' | 'skill-based' | 'random';
  skillsRequired?: string[];
  businessUnit?: string;
}

export const ASSIGNMENT_RULES: AssignmentRule[] = [
  // Safety & Health - Immediate routing
  {
    category: "Health & Safety",
    targetDepartment: "Operations",
    targetRole: "manager",
    priority: "critical",
    routingLogic: "least-busy",
    skillsRequired: ["first-aid", "safety-certified"],
  },
  {
    category: "Health & Safety",
    subcategory: "Injury During Class",
    targetDepartment: "Management",
    targetRole: "director",
    priority: "critical",
    routingLogic: "skill-based",
    skillsRequired: ["incident-response", "liability-management"],
  },

  // Technology & Booking
  {
    category: "Booking & Technology",
    subcategory: "App Issues",
    targetDepartment: "IT",
    routingLogic: "round-robin",
    skillsRequired: ["mobile-app", "troubleshooting"],
  },
  {
    category: "Booking & Technology",
    subcategory: "Payment Processing",
    targetDepartment: "Finance",
    priority: "high",
    routingLogic: "least-busy",
    skillsRequired: ["payment-systems", "refunds"],
  },
  {
    category: "Booking & Technology",
    subcategory: "Class Booking",
    targetDepartment: "Client Success",
    routingLogic: "round-robin",
  },

  // Customer Service
  {
    category: "Customer Service",
    subcategory: "Staff Professionalism",
    targetDepartment: "Training",
    targetRole: "training-manager",
    routingLogic: "skill-based",
    skillsRequired: ["hr", "training"],
  },
  {
    category: "Customer Service",
    subcategory: "Front Desk Service",
    targetDepartment: "Operations",
    routingLogic: "least-busy",
  },
  {
    category: "Customer Service",
    targetDepartment: "Client Success",
    routingLogic: "least-busy",
  },

  // Sales & Marketing
  {
    category: "Sales & Marketing",
    subcategory: "Trial Class Experience",
    targetDepartment: "Sales",
    routingLogic: "round-robin",
    skillsRequired: ["sales", "conversion"],
  },
  {
    category: "Sales & Marketing",
    targetDepartment: "Marketing",
    routingLogic: "round-robin",
  },

  // Special Programs
  {
    category: "Special Programs",
    targetDepartment: "Marketing",
    targetRole: "partnerships-manager",
    routingLogic: "skill-based",
    skillsRequired: ["events", "influencer-relations"],
  },

  // Retail
  {
    category: "Retail Management",
    targetDepartment: "Retail",
    routingLogic: "round-robin",
  },

  // Facilities
  {
    category: "Facilities Management",
    targetDepartment: "Facilities",
    targetRole: "facilities-manager",
    routingLogic: "least-busy",
  },
];

// ============================================
// ESCALATION TRIGGERS
// ============================================

export interface EscalationTrigger {
  id: string;
  name: string;
  description: string;
  type: 'time-based' | 'condition-based' | 'manual' | 'ai-suggested';
  enabled: boolean;
  conditions: {
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not-contains';
    value: any;
  }[];
  actions: {
    escalateToLevel: number;
    notifyRoles: string[];
    setPriority?: string;
    addTags?: string[];
    sendNotification: boolean;
  };
}

export const ESCALATION_TRIGGERS: EscalationTrigger[] = [
  {
    id: "sla-breach-critical",
    name: "Critical SLA Breach",
    description: "Auto-escalate when critical ticket exceeds SLA",
    type: "time-based",
    enabled: true,
    conditions: [
      { field: "priority", operator: "=", value: "critical" },
      { field: "slaBreached", operator: "=", value: true },
    ],
    actions: {
      escalateToLevel: 3,
      notifyRoles: ["director", "manager"],
      sendNotification: true,
      addTags: ["sla-breach", "urgent"],
    },
  },
  {
    id: "safety-incident-immediate",
    name: "Safety Incident - Immediate Escalation",
    description: "Auto-escalate all safety incidents to management",
    type: "condition-based",
    enabled: true,
    conditions: [
      { field: "category", operator: "contains", value: "Safety" },
    ],
    actions: {
      escalateToLevel: 2,
      notifyRoles: ["manager", "director"],
      setPriority: "critical",
      sendNotification: true,
      addTags: ["safety", "escalated"],
    },
  },
  {
    id: "multiple-reopens",
    name: "Multiple Reopens",
    description: "Escalate if ticket reopened more than twice",
    type: "condition-based",
    enabled: true,
    conditions: [
      { field: "reopenCount", operator: ">=", value: 2 },
    ],
    actions: {
      escalateToLevel: 1,
      notifyRoles: ["team-lead", "manager"],
      sendNotification: true,
      addTags: ["quality-issue", "escalated"],
    },
  },
  {
    id: "customer-vip",
    name: "VIP Customer",
    description: "Route VIP customer tickets to senior team",
    type: "condition-based",
    enabled: true,
    conditions: [
      { field: "customerStatus", operator: "=", value: "vip" },
    ],
    actions: {
      escalateToLevel: 1,
      notifyRoles: ["senior-associate", "manager"],
      sendNotification: true,
      addTags: ["vip"],
    },
  },
  {
    id: "no-response-24h",
    name: "No Response 24 Hours",
    description: "Escalate if no staff response in 24 hours",
    type: "time-based",
    enabled: true,
    conditions: [
      { field: "hoursSinceCreated", operator: ">=", value: 24 },
      { field: "responseCount", operator: "=", value: 0 },
    ],
    actions: {
      escalateToLevel: 1,
      notifyRoles: ["team-lead"],
      sendNotification: true,
      addTags: ["delayed-response"],
    },
  },
  {
    id: "high-priority-aging",
    name: "High Priority Aging",
    description: "Escalate high priority tickets open >48h",
    type: "time-based",
    enabled: true,
    conditions: [
      { field: "priority", operator: "=", value: "high" },
      { field: "hoursSinceCreated", operator: ">=", value: 48 },
      { field: "status", operator: "!=", value: "resolved" },
    ],
    actions: {
      escalateToLevel: 2,
      notifyRoles: ["manager"],
      sendNotification: true,
      addTags: ["aging-ticket"],
    },
  },
  {
    id: "negative-sentiment",
    name: "Negative Customer Sentiment",
    description: "AI-detected negative sentiment escalation",
    type: "ai-suggested",
    enabled: true,
    conditions: [
      { field: "aiSentiment", operator: "=", value: "negative" },
      { field: "clientMood", operator: "contains", value: "angry" },
    ],
    actions: {
      escalateToLevel: 1,
      notifyRoles: ["team-lead", "senior-associate"],
      sendNotification: true,
      addTags: ["angry-customer", "sentiment-escalation"],
    },
  },
  {
    id: "payment-dispute",
    name: "Payment Dispute",
    description: "Route payment disputes to finance immediately",
    type: "condition-based",
    enabled: true,
    conditions: [
      { field: "category", operator: "contains", value: "Payment" },
      { field: "tags", operator: "contains", value: "dispute" },
    ],
    actions: {
      escalateToLevel: 2,
      notifyRoles: ["finance-manager", "manager"],
      setPriority: "high",
      sendNotification: true,
      addTags: ["finance-review"],
    },
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get SLA rule for a given priority and category
 */
export function getSLARule(priority: string, category?: string): SLARule | null {
  // Try to find exact match with category
  if (category) {
    const exactMatch = SLA_RULES.find(
      rule => rule.priority === priority && rule.category === category
    );
    if (exactMatch) return exactMatch;
  }

  // Fall back to priority-only match
  return SLA_RULES.find(
    rule => rule.priority === priority && !rule.category
  ) || null;
}

/**
 * Calculate SLA due date based on priority and category
 */
export function calculateSLADueDate(
  priority: string,
  category?: string,
  createdAt: Date = new Date()
): Date {
  const rule = getSLARule(priority, category);
  if (!rule) {
    // Default fallback: 48 hours
    return new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
  }

  const dueDate = new Date(createdAt);
  dueDate.setHours(dueDate.getHours() + rule.resolutionTimeHours);

  return dueDate;
}

/**
 * Get assignment rule for category/subcategory
 */
export function getAssignmentRule(
  category: string,
  subcategory?: string,
  priority?: string
): AssignmentRule | null {
  // Try exact match with subcategory and priority
  if (subcategory && priority) {
    const exactMatch = ASSIGNMENT_RULES.find(
      rule => rule.category === category &&
              rule.subcategory === subcategory &&
              rule.priority === priority
    );
    if (exactMatch) return exactMatch;
  }

  // Try with subcategory only
  if (subcategory) {
    const subMatch = ASSIGNMENT_RULES.find(
      rule => rule.category === category && rule.subcategory === subcategory
    );
    if (subMatch) return subMatch;
  }

  // Try with priority only
  if (priority) {
    const priorityMatch = ASSIGNMENT_RULES.find(
      rule => rule.category === category && rule.priority === priority && !rule.subcategory
    );
    if (priorityMatch) return priorityMatch;
  }

  // Fall back to category-only match
  return ASSIGNMENT_RULES.find(
    rule => rule.category === category && !rule.subcategory && !rule.priority
  ) || null;
}

/**
 * Check if ticket should be escalated
 */
export function checkEscalationNeeded(ticket: {
  priority: string;
  category?: string;
  createdAt: Date;
  slaDueAt?: Date;
  slaBreached?: boolean;
  reopenCount?: number;
  customerStatus?: string;
  responseCount?: number;
  status?: string;
  aiSentiment?: string;
  clientMood?: string;
  tags?: string[];
}): EscalationTrigger | null {
  const now = new Date();
  const hoursSinceCreated = (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);

  for (const trigger of ESCALATION_TRIGGERS) {
    if (!trigger.enabled) continue;

    const allConditionsMet = trigger.conditions.every(condition => {
      const fieldValue = (ticket as any)[condition.field];

      switch (condition.operator) {
        case '=':
          return fieldValue === condition.value;
        case '!=':
          return fieldValue !== condition.value;
        case '>':
          return fieldValue > condition.value;
        case '<':
          return fieldValue < condition.value;
        case '>=':
          return condition.field === 'hoursSinceCreated'
            ? hoursSinceCreated >= condition.value
            : fieldValue >= condition.value;
        case '<=':
          return fieldValue <= condition.value;
        case 'contains':
          return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
        case 'not-contains':
          return typeof fieldValue === 'string' && !fieldValue.includes(condition.value);
        default:
          return false;
      }
    });

    if (allConditionsMet) {
      return trigger;
    }
  }

  return null;
}

/**
 * Get escalation level for a ticket based on SLA consumption
 */
export function getEscalationLevel(
  priority: string,
  category: string | undefined,
  createdAt: Date,
  slaDueAt: Date
): number {
  const rule = getSLARule(priority, category);
  if (!rule) return 0;

  const now = new Date();
  const totalDuration = slaDueAt.getTime() - createdAt.getTime();
  const elapsed = now.getTime() - createdAt.getTime();
  const percentConsumed = (elapsed / totalDuration) * 100;

  if (percentConsumed >= rule.escalationThresholds.level3) return 3;
  if (percentConsumed >= rule.escalationThresholds.level2) return 2;
  if (percentConsumed >= rule.escalationThresholds.level1) return 1;

  return 0;
}

export default {
  SLA_RULES,
  ESCALATION_HIERARCHY,
  ASSIGNMENT_RULES,
  ESCALATION_TRIGGERS,
  getSLARule,
  calculateSLADueDate,
  getAssignmentRule,
  checkEscalationNeeded,
  getEscalationLevel,
};
