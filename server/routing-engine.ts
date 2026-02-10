/**
 * Routing Engine - Smart ticket routing with rule-based logic
 * Determines which team/person should handle a ticket
 */

import { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type RoutingRule = {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  conditions: RoutingCondition[];
  action: RoutingAction;
  feedback?: RoutingFeedback[];
  createdAt: string;
  updatedAt: string;
};

interface RoutingCondition {
  field: "category" | "subcategory" | "priority" | "studio" | "keywords" | "sentiment";
  operator: "equals" | "contains" | "matches" | "in";
  value: string | string[];
}

interface RoutingAction {
  type: "assignTeam" | "assignUser" | "autoAssign";
  targetId?: string; // team or user ID
  metadata?: Record<string, any>;
}

interface RoutingFeedback {
  id: string;
  ruleId: string;
  ticketId: string;
  wasCorrect: boolean;
  actualTeamId?: string;
  score: number;
}

interface RoutingResult {
  suggestedTeamId?: string;
  suggestedUserId?: string;
  confidence: number;
  ruleId?: string;
  reasoning: string;
  alternativeOptions?: Array<{ teamId: string; score: number }>;
}

/**
 * RoutingEngine - Main routing logic
 */
export class RoutingEngine {
  private supabase: ReturnType<typeof createClient>;
  private rulesCache: Map<string, RoutingRule> = new Map();
  private lastCacheUpdate: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
  }

  /**
   * Route a ticket based on configured rules
   */
  async routeTicket(ticket: Ticket, ticketContent: string): Promise<RoutingResult> {
    try {
      // Load rules from cache or database
      const rules = await this.loadRules();

      // Evaluate all rules in priority order
      const evaluations: Array<{ rule: RoutingRule; score: number }> = [];

      for (const rule of rules) {
        const score = this.evaluateRule(rule, ticket, ticketContent);
        if (score > 0) {
          evaluations.push({ rule, score });
        }
      }

      // Sort by score (highest first)
      evaluations.sort((a, b) => b.score - a.score);

      if (evaluations.length === 0) {
        return this.getDefaultRouting(ticket);
      }

      const topRule = evaluations[0];
      const result = this.buildRoutingResult(topRule.rule, topRule.score);

      // Get alternative options
      const alternatives = evaluations.slice(1, 3).map((e) => ({
        teamId: e.rule.action.targetId || "unassigned",
        score: e.score,
      }));

      return {
        ...result,
        alternativeOptions: alternatives,
      };
    } catch (error) {
      console.error("Routing error:", error);
      return this.getDefaultRouting(ticket);
    }
  }

  /**
   * Evaluate a single rule against ticket data
   */
  private evaluateRule(rule: RoutingRule, ticket: Ticket, ticketContent: string): number {
    if (!rule.isActive) return 0;

    let score = 0;

    for (const condition of rule.conditions) {
      const condScore = this.evaluateCondition(condition, ticket, ticketContent);
      if (condScore === 0) {
        // All conditions must pass
        return 0;
      }
      score += condScore;
    }

    // Apply feedback-based scoring adjustment
    if (rule.feedback && rule.feedback.length > 0) {
      const feedbackScore = this.calculateFeedbackScore(rule.feedback);
      score *= (1 + feedbackScore);
    }

    return score;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: RoutingCondition,
    ticket: Ticket,
    ticketContent: string
  ): number {
    const { field, operator, value } = condition;

    switch (field) {
      case "category":
        return this.matchField(ticket.category as string, value, operator) ? 1 : 0;

      case "subcategory":
        return this.matchField(ticket.subcategory as string, value, operator) ? 1 : 0;

      case "priority":
        return this.matchField(ticket.priority, value, operator) ? 1 : 0;

      case "studio":
        return this.matchField(ticket.studio_id, value, operator) ? 1 : 0;

      case "keywords":
        return this.matchKeywords(ticketContent, value as string[]) ? 0.8 : 0;

      case "sentiment":
        // Would integrate with sentiment analyzer
        return 0.5;

      default:
        return 0;
    }
  }

  /**
   * Match field value based on operator
   */
  private matchField(
    fieldValue: string | null,
    condition: string | string[],
    operator: string
  ): boolean {
    if (!fieldValue) return false;

    switch (operator) {
      case "equals":
        return fieldValue === condition;

      case "contains":
        return fieldValue.includes(condition as string);

      case "in":
        return (condition as string[]).includes(fieldValue);

      case "matches":
        try {
          const regex = new RegExp(condition as string, "i");
          return regex.test(fieldValue);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Match keywords in content
   */
  private matchKeywords(content: string, keywords: string[]): boolean {
    const lowerContent = content.toLowerCase();
    return keywords.some((keyword) =>
      lowerContent.includes(keyword.toLowerCase())
    );
  }

  /**
   * Calculate feedback-based score adjustment
   */
  private calculateFeedbackScore(feedback: RoutingFeedback[]): number {
    if (feedback.length === 0) return 0;

    const correct = feedback.filter((f) => f.wasCorrect).length;
    const accuracy = correct / feedback.length;

    // Score ranges from -0.3 to +0.3
    return (accuracy * 0.6) - 0.3;
  }

  /**
   * Build routing result from rule
   */
  private buildRoutingResult(rule: RoutingRule, score: number): RoutingResult {
    const confidence = Math.min(score * 100, 100); // Cap at 100%

    return {
      suggestedTeamId: rule.action.targetId,
      confidence,
      ruleId: rule.id,
      reasoning: `Matched rule "${rule.name}" with ${confidence.toFixed(0)}% confidence`,
    };
  }

  /**
   * Get default routing when no rules match
   */
  private getDefaultRouting(ticket: Ticket): RoutingResult {
    return {
      suggestedTeamId: undefined, // Will use round-robin
      confidence: 0,
      reasoning: "No specific routing rule matched. Using default assignment.",
    };
  }

  /**
   * Load routing rules from database
   */
  private async loadRules(): Promise<RoutingRule[]> {
    const now = Date.now();

    // Check cache
    if (this.lastCacheUpdate + this.CACHE_TTL > now && this.rulesCache.size > 0) {
      return Array.from(this.rulesCache.values());
    }

    try {
      // In a real implementation, query the database
      // For now, return empty as we'll set up the table next
      const rules: RoutingRule[] = [];

      // Update cache
      this.rulesCache.clear();
      rules.forEach((rule) => this.rulesCache.set(rule.id, rule));
      this.lastCacheUpdate = now;

      return rules;
    } catch (error) {
      console.error("Error loading routing rules:", error);
      return Array.from(this.rulesCache.values());
    }
  }

  /**
   * Clear cache (useful for testing or after updates)
   */
  clearCache(): void {
    this.rulesCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Record feedback for rule accuracy
   */
  async recordFeedback(
    ruleId: string,
    ticketId: string,
    wasCorrect: boolean,
    actualTeamId?: string
  ): Promise<void> {
    try {
      // In production, save to feedback table
      const score = wasCorrect ? 1 : 0;

      console.log(`Recorded feedback: Rule ${ruleId}, Ticket ${ticketId}, Correct: ${wasCorrect}`);

      // Invalidate cache to reload updated rules
      this.clearCache();
    } catch (error) {
      console.error("Error recording feedback:", error);
    }
  }
}

// Export singleton instance
export const routingEngine = new RoutingEngine();
