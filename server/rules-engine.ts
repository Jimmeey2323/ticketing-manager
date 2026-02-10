/**
 * Rules Engine - Manage and configure routing rules
 */

import { RoutingRule, RoutingCondition, RoutingAction } from "./routing-engine";

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  conditions: RoutingCondition[];
  action: RoutingAction;
}

/**
 * Pre-configured rule templates for common scenarios
 */
export const ruleTemplates: Record<string, RuleTemplate> = {
  // High priority ticket - route to senior team
  highPriorityEscalation: {
    id: "tpl-high-priority",
    name: "High Priority Escalation",
    description: "Route critical/high priority tickets to senior support team",
    conditions: [
      {
        field: "priority",
        operator: "in",
        value: ["critical", "high"],
      },
    ],
    action: {
      type: "assignTeam",
      targetId: "team-senior-support",
    },
  },

  // Category-specific routing
  billingIssues: {
    id: "tpl-billing",
    name: "Billing Issues",
    description: "Route billing inquiries to accounting team",
    conditions: [
      {
        field: "category",
        operator: "equals",
        value: "billing",
      },
    ],
    action: {
      type: "assignTeam",
      targetId: "team-accounting",
    },
  },

  // Technical issues
  technicalSupport: {
    id: "tpl-technical",
    name: "Technical Support",
    description: "Route technical issues to engineering team",
    conditions: [
      {
        field: "category",
        operator: "in",
        value: ["technical", "bug-report"],
      },
    ],
    action: {
      type: "assignTeam",
      targetId: "team-engineering",
    },
  },

  // Keywords-based routing
  emergencyIncident: {
    id: "tpl-emergency",
    name: "Emergency Incident Detection",
    description: "Route crisis/emergency situations immediately",
    conditions: [
      {
        field: "keywords",
        operator: "contains",
        value: ["emergency", "urgent", "critical", "down"],
      },
    ],
    action: {
      type: "assignTeam",
      targetId: "team-crisis-management",
    },
  },

  // Volume-based load balancing
  generalInquiry: {
    id: "tpl-general",
    name: "General Inquiry Load Balancing",
    description: "Distribute general inquiries using round-robin",
    conditions: [
      {
        field: "category",
        operator: "equals",
        value: "general-inquiry",
      },
    ],
    action: {
      type: "autoAssign",
    },
  },
};

/**
 * RulesManager - Create, update, and manage routing rules
 */
export class RulesManager {
  private rules: Map<string, RoutingRule> = new Map();

  /**
   * Create a new routing rule from template
   */
  createRuleFromTemplate(
    templateId: string,
    overrides?: Partial<RoutingRule>
  ): RoutingRule | null {
    const template = ruleTemplates[templateId];
    if (!template) return null;

    return {
      id: `rule-${Date.now()}`,
      name: template.name,
      priority: 50,
      isActive: true,
      conditions: template.conditions,
      action: template.action,
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Create a custom rule
   */
  createCustomRule(
    name: string,
    conditions: RoutingCondition[],
    action: RoutingAction,
    priority: number = 50
  ): RoutingRule {
    const rule: RoutingRule = {
      id: `rule-${Date.now()}`,
      name,
      priority,
      isActive: true,
      conditions,
      action,
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.rules.set(rule.id, rule);
    return rule;
  }

  /**
   * Update a rule
   */
  updateRule(ruleId: string, updates: Partial<RoutingRule>): RoutingRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updated: RoutingRule = {
      ...rule,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.rules.set(ruleId, updated);
    return updated;
  }

  /**
   * Delete a rule
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): RoutingRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all active rules sorted by priority
   */
  getAllRules(activeOnly: boolean = true): RoutingRule[] {
    const rules = Array.from(this.rules.values());
    if (activeOnly) {
      return rules.filter((r) => r.isActive).sort((a, b) => b.priority - a.priority);
    }
    return rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Validate rule conditions
   */
  validateRule(rule: RoutingRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.name || rule.name.trim() === "") {
      errors.push("Rule name is required");
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push("At least one condition is required");
    }

    if (!rule.action || !rule.action.type) {
      errors.push("Action is required");
    }

    if (rule.priority < 0 || rule.priority > 100) {
      errors.push("Priority must be between 0 and 100");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Default rule configurations for new installations
 */
export function getDefaultRules(): RoutingRule[] {
  return [
    {
      id: "rule-critical-priority",
      name: "Critical Priority Auto-Escalate",
      priority: 100,
      isActive: true,
      conditions: [
        {
          field: "priority",
          operator: "equals",
          value: "critical",
        },
      ],
      action: {
        type: "assignTeam",
        targetId: "team-senior-support",
      },
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "rule-high-priority",
      name: "High Priority Routing",
      priority: 90,
      isActive: true,
      conditions: [
        {
          field: "priority",
          operator: "equals",
          value: "high",
        },
      ],
      action: {
        type: "assignTeam",
        targetId: "team-support",
      },
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "rule-default",
      name: "Default Load Balancing",
      priority: 1,
      isActive: true,
      conditions: [],
      action: {
        type: "autoAssign",
      },
      feedback: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// Export singleton
export const rulesManager = new RulesManager();
