/**
 * Assignment Engine - Intelligent ticket assignment with workload balancing
 * Assigns tickets to team members based on availability, workload, and expertise
 */

import { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];

export interface AssignmentStrategy {
  type: "round-robin" | "least-loaded" | "skill-based" | "balanced";
  metadata?: Record<string, any>;
}

export interface AssignmentResult {
  assignedUserId: string | null;
  strategy: AssignmentStrategy["type"];
  score: number;
  reasoning: string;
  alternatives?: Array<{ userId: string; score: number }>;
}

export interface TeamMemberMetrics {
  userId: string;
  activeTickets: number;
  avgResolutionTimeHours: number;
  skills: string[];
  availability: "available" | "busy" | "away" | "offline";
  workloadPercentage: number;
}

/**
 * AssignmentEngine - Handle intelligent ticket assignment
 */
export class AssignmentEngine {
  private userIndex: Map<string, TeamMemberMetrics> = new Map();
  private lastUpdateTime: Record<string, number> = {};
  private METRICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Assign a ticket to the best available team member
   */
  async assignTicket(
    teamId: string,
    ticketId: string,
    strategy: AssignmentStrategy = { type: "least-loaded" },
    requiredSkills?: string[]
  ): Promise<AssignmentResult> {
    try {
      // Get team members
      const teamMembers = await this.getTeamMembers(teamId);

      if (teamMembers.length === 0) {
        return {
          assignedUserId: null,
          strategy: strategy.type,
          score: 0,
          reasoning: "No available team members",
        };
      }

      // Get current metrics for team members
      const metrics = await this.updateMetrics(teamId, teamMembers);

      // Filter by availability and skills
      let candidates = metrics.filter((m) => m.availability !== "offline");

      if (requiredSkills && requiredSkills.length > 0) {
        candidates = candidates.filter((m) =>
          requiredSkills.some((skill) => m.skills.includes(skill))
        );
      }

      if (candidates.length === 0) {
        // Fallback to any available member
        candidates = metrics.filter((m) => m.availability !== "offline");
      }

      if (candidates.length === 0) {
        return {
          assignedUserId: null,
          strategy: strategy.type,
          score: 0,
          reasoning: "No qualified available team members",
        };
      }

      // Select based on strategy
      const result = this.selectAssignee(candidates, strategy);

      return result;
    } catch (error) {
      console.error("Assignment error:", error);
      return {
        assignedUserId: null,
        strategy: strategy.type,
        score: 0,
        reasoning: "Assignment failed due to error",
      };
    }
  }

  /**
   * Select assignee based on strategy
   */
  private selectAssignee(
    candidates: TeamMemberMetrics[],
    strategy: AssignmentStrategy
  ): AssignmentResult {
    switch (strategy.type) {
      case "round-robin":
        return this.roundRobinAssignment(candidates);

      case "least-loaded":
        return this.leastLoadedAssignment(candidates);

      case "skill-based":
        return this.skillBasedAssignment(
          candidates,
          strategy.metadata?.requiredSkills || []
        );

      case "balanced":
        return this.balancedAssignment(candidates);

      default:
        return this.leastLoadedAssignment(candidates);
    }
  }

  /**
   * Round-robin: Distribute evenly among all members
   */
  private roundRobinAssignment(candidates: TeamMemberMetrics[]): AssignmentResult {
    // Select member with least recent assignment
    const selected = candidates.sort((a, b) => a.activeTickets - b.activeTickets)[0];

    return {
      assignedUserId: selected.userId,
      strategy: "round-robin",
      score: 60,
      reasoning: `Assigned using round-robin distribution. Current queue: ${selected.activeTickets} tickets`,
      alternatives: candidates
        .slice(1, 3)
        .map((c) => ({
          userId: c.userId,
          score: 60 - (c.activeTickets - selected.activeTickets) * 5,
        })),
    };
  }

  /**
   * Least-loaded: Assign to person with fewest active tickets
   */
  private leastLoadedAssignment(candidates: TeamMemberMetrics[]): AssignmentResult {
    const selected = candidates.sort((a, b) => a.workloadPercentage - b.workloadPercentage)[0];

    const score = Math.max(0, 100 - selected.workloadPercentage);

    return {
      assignedUserId: selected.userId,
      strategy: "least-loaded",
      score,
      reasoning: `Assigned to least loaded member (${selected.workloadPercentage.toFixed(0)}% capacity)`,
      alternatives: candidates
        .slice(1, 3)
        .map((c, i) => ({
          userId: c.userId,
          score: Math.max(0, 100 - c.workloadPercentage - (i + 1) * 5),
        })),
    };
  }

  /**
   * Skill-based: Assign to person with matching skills
   */
  private skillBasedAssignment(
    candidates: TeamMemberMetrics[],
    requiredSkills: string[]
  ): AssignmentResult {
    // Score by skill match
    const scored = candidates.map((c) => {
      const matchedSkills = requiredSkills.filter((s) => c.skills.includes(s)).length;
      const skillScore = (matchedSkills / Math.max(requiredSkills.length, 1)) * 100;
      const loadScore = Math.max(0, 100 - c.workloadPercentage);

      return {
        member: c,
        score: skillScore * 0.6 + loadScore * 0.4,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0];

    return {
      assignedUserId: selected.member.userId,
      strategy: "skill-based",
      score: selected.score,
      reasoning: `Assigned based on skill match (${selected.member.skills.join(", ")})`,
      alternatives: scored
        .slice(1, 3)
        .map((s) => ({
          userId: s.member.userId,
          score: s.score,
        })),
    };
  }

  /**
   * Balanced: Balance between skill match and workload
   */
  private balancedAssignment(candidates: TeamMemberMetrics[]): AssignmentResult {
    const scored = candidates.map((c) => {
      const loadScore = Math.max(0, 100 - c.workloadPercentage);
      const availabilityBonus = c.availability === "available" ? 20 : 0;

      return {
        member: c,
        score: loadScore + availabilityBonus,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0];

    return {
      assignedUserId: selected.member.userId,
      strategy: "balanced",
      score: selected.score,
      reasoning: `Balanced assignment (${selected.member.workloadPercentage.toFixed(0)}% load, ${selected.member.availability})`,
      alternatives: scored
        .slice(1, 3)
        .map((s) => ({
          userId: s.member.userId,
          score: s.score,
        })),
    };
  }

  /**
   * Get team members
   */
  private async getTeamMembers(teamId: string): Promise<User[]> {
    // This would query the database in production
    // For now, return empty array - will be implemented when we add API
    return [];
  }

  /**
   * Update and cache metrics for team members
   */
  private async updateMetrics(
    teamId: string,
    members: User[]
  ): Promise<TeamMemberMetrics[]> {
    const cacheKey = `metrics-${teamId}`;

    // Check cache
    if (
      this.lastUpdateTime[cacheKey] &&
      Date.now() - this.lastUpdateTime[cacheKey] < this.METRICS_CACHE_TTL
    ) {
      return members.map((m) => this.userIndex.get(m.id)!).filter(Boolean);
    }

    // Calculate fresh metrics (in production, query from database)
    const metrics: TeamMemberMetrics[] = members.map((m) => ({
      userId: m.id,
      activeTickets: Math.floor(Math.random() * 10), // Placeholder
      avgResolutionTimeHours: 2 + Math.random() * 8,
      skills: ["general", "technical"],
      availability: "available",
      workloadPercentage: Math.random() * 80,
    }));

    // Update cache
    metrics.forEach((m) => this.userIndex.set(m.userId, m));
    this.lastUpdateTime[cacheKey] = Date.now();

    return metrics;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.userIndex.clear();
    this.lastUpdateTime = {};
  }

  /**
   * Get workload statistics for a team
   */
  async getTeamWorkloadStats(teamId: string): Promise<{
    totalActiveTickets: number;
    averageWorkloadPercentage: number;
    busyMembers: number;
    availableMembers: number;
  }> {
    const members = await this.getTeamMembers(teamId);
    const metrics = await this.updateMetrics(teamId, members);

    return {
      totalActiveTickets: metrics.reduce((sum, m) => sum + m.activeTickets, 0),
      averageWorkloadPercentage:
        metrics.reduce((sum, m) => sum + m.workloadPercentage, 0) / metrics.length,
      busyMembers: metrics.filter((m) => m.workloadPercentage > 80).length,
      availableMembers: metrics.filter(
        (m) => m.availability === "available" && m.workloadPercentage < 50
      ).length,
    };
  }
}

// Export singleton
export const assignmentEngine = new AssignmentEngine();
