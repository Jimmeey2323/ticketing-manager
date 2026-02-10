/**
 * Email Scanner Service - Parse emails and auto-create tickets
 * Supports IMAP polling and webhook ingestion
 * Prevents duplicates, matches threads, extracts metadata
 */

import { notificationEngine, NotificationType } from "./notification-engine";

export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  receivedAt: Date;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  data: Buffer;
  size: number;
}

export interface EmailTicketMapping {
  emailId: string;
  ticketId: string;
  messageId: string;
  createdAt: string;
  threadMatch: boolean;
  confidence: number;
}

/**
 * EmailScannerService - Main email scanning and ingestion
 */
export class EmailScannerService {
  private messageCache: Map<string, EmailMessage> = new Map();
  private ticketMappings: Map<string, EmailTicketMapping> = new Map();
  private duplicateCheckWindow = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Process incoming email webhook
   */
  async processEmailWebhook(emailData: any): Promise<{ ticketId: string; created: boolean }> {
    try {
      // Parse email
      const email = this.parseEmailData(emailData);

      // Check for duplicates
      const duplicate = await this.checkForDuplicate(email);
      if (duplicate) {
        return { ticketId: duplicate, created: false };
      }

      // Check if reply to existing ticket
      const existingTicketId = await this.findThreadMatch(email);

      if (existingTicketId) {
        // Add as comment to existing ticket
        await this.addCommentToTicket(existingTicketId, email);

        return { ticketId: existingTicketId, created: false };
      }

      // Create new ticket
      const ticketId = await this.createTicketFromEmail(email);

      // Store mapping
      this.storeEmailMapping(email.id, ticketId, email.messageId, true, 0.95);

      // Send confirmation email
      await this.sendConfirmationEmail(email.from, ticketId);

      return { ticketId, created: true };
    } catch (error) {
      console.error("Error processing email:", error);
      throw error;
    }
  }

  /**
   * Parse raw email data into EmailMessage
   */
  private parseEmailData(rawEmail: any): EmailMessage {
    // This would use email parsing library (mailparser, nodemailer-parse-email, etc.)

    return {
      id: `email-${Date.now()}`,
      from: rawEmail.from || "unknown@example.com",
      to: rawEmail.to ? (Array.isArray(rawEmail.to) ? rawEmail.to : [rawEmail.to]) : [],
      cc: rawEmail.cc ? (Array.isArray(rawEmail.cc) ? rawEmail.cc : [rawEmail.cc]) : [],
      subject: rawEmail.subject || "(No Subject)",
      body: this.extractPlainText(rawEmail.text || rawEmail.body || ""),
      htmlBody: rawEmail.html,
      attachments: this.parseAttachments(rawEmail.attachments || []),
      receivedAt: new Date(rawEmail.date || Date.now()),
      messageId: rawEmail.messageId || rawEmail["message-id"],
      inReplyTo: rawEmail.inReplyTo || rawEmail["in-reply-to"],
      references: rawEmail.references || [],
    };
  }

  /**
   * Extract plain text from HTML or raw email body
   */
  private extractPlainText(html: string): string {
    // Remove HTML tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Remove email signatures and quoted text
    text = this.removeEmailSignature(text);
    text = this.removeQuotedText(text);

    return text.trim();
  }

  /**
   * Remove email signature
   */
  private removeEmailSignature(text: string): string {
    const signaturePatterns = [
      /--\s*[\s\S]*$/,
      /^-{3,}\s*[\s\S]*$/m,
      /Best (regards|wishes|regards|Regards),?[\s\S]*$/im,
      /Sent from.*$/im,
    ];

    let result = text;
    for (const pattern of signaturePatterns) {
      result = result.replace(pattern, "");
    }

    return result;
  }

  /**
   * Remove quoted/forwarded text
   */
  private removeQuotedText(text: string): string {
    const lines = text.split("\n");
    const cutoffIndex = lines.findIndex(
      (line) =>
        line.match(/^>+/) ||
        line.match(/^On.*wrote:/) ||
        line.match(/^From:.*\[.*\]$/)
    );

    if (cutoffIndex > 0) {
      return lines.slice(0, cutoffIndex).join("\n");
    }

    return text;
  }

  /**
   * Parse attachments
   */
  private parseAttachments(attachments: any[]): EmailAttachment[] {
    return attachments.map((att) => ({
      filename: att.filename || "unknown",
      contentType: att.contentType || "application/octet-stream",
      data: att.content || Buffer.from(""),
      size: att.size || 0,
    }));
  }

  /**
   * Check for duplicate emails in time window
   */
  private async checkForDuplicate(email: EmailMessage): Promise<string | null> {
    // Check if exact same message ID exists
    if (email.messageId) {
      const mapping = Array.from(this.ticketMappings.values()).find(
        (m) => m.messageId === email.messageId && !m.threadMatch
      );

      if (mapping) return mapping.ticketId;
    }

    // Check for similar subject and sender within time window
    const now = Date.now();
    const recent = Array.from(this.messageCache.values()).filter((m) => {
      const timeDiff = now - m.receivedAt.getTime();
      return (
        timeDiff < this.duplicateCheckWindow &&
        m.from === email.from &&
        this.normalizeText(m.subject) === this.normalizeText(email.subject)
      );
    });

    if (recent.length > 0) {
      // Found similar recent email
      const mapping = this.ticketMappings.get(recent[0].id);
      if (mapping) return mapping.ticketId;
    }

    return null;
  }

  /**
   * Find if email is reply to existing ticket
   */
  private async findThreadMatch(email: EmailMessage): Promise<string | null> {
    // Check message-id references
    if (email.inReplyTo || email.references) {
      const allRefs = [
        email.inReplyTo,
        ...(email.references || []),
      ].filter(Boolean);

      for (const ref of allRefs) {
        const mapping = Array.from(this.ticketMappings.values()).find(
          (m) => m.messageId === ref && m.threadMatch
        );

        if (mapping) return mapping.ticketId;
      }
    }

    // Check sender + subject matching
    const similar = Array.from(this.messageCache.values()).filter((m) => {
      const sameFrom = this.normalizeSender(m.from) === this.normalizeSender(email.from);
      const similarSubject = this.calculateSimilarity(m.subject, email.subject) > 0.7;

      return sameFrom && similarSubject;
    });

    if (similar.length > 0) {
      const mapping = this.ticketMappings.get(similar[0].id);
      if (mapping) return mapping.ticketId;
    }

    return null;
  }

  /**
   * Create ticket from email
   */
  private async createTicketFromEmail(email: EmailMessage): Promise<string> {
    // Extract metadata
    const { category, priority } = this.extractEmailMetadata(email);

    // Create ticket object
    const ticket = {
      title: email.subject,
      description: email.body,
      priority,
      category,
      studio_id: await this.inferStudioFromEmail(email),
      reported_by_email: email.from,
      reported_by_subject: this.extractSenderName(email.from),
      source: "email",
      attachments: email.attachments,
      email_metadata: {
        messageId: email.messageId,
        from: email.from,
        to: email.to,
        cc: email.cc,
        received_at: email.receivedAt.toISOString(),
      },
    };

    // In production, save to database
    const ticketId = `ticket-${Date.now()}`;

    console.log("Created ticket from email:", ticketId);
    console.log("Ticket data:", ticket);

    return ticketId;
  }

  /**
   * Extract email metadata for categorization
   */
  private extractEmailMetadata(
    email: EmailMessage
  ): { category: string; priority: string } {
    const subject = email.subject.toLowerCase();
    const body = (email.body + " " + (email.htmlBody || "")).toLowerCase();
    const fullContent = subject + " " + body;

    // Priority detection
    let priority = "medium";
    if (fullContent.match(/urgent|critical|asap|emergency|immediately/)) {
      priority = "high";
    }
    if (fullContent.match(/asap|critical|urgently|emergency|crisis/)) {
      priority = "critical";
    }
    if (fullContent.match(/low priority|can wait|whenever/)) {
      priority = "low";
    }

    // Category detection
    let category = "general-inquiry";
    if (fullContent.match(/billing|invoice|payment|charge|subscription/)) {
      category = "billing";
    } else if (fullContent.match(/technical|bug|error|crash|not working|api|integration/)) {
      category = "technical";
    } else if (fullContent.match(/class|session|trainer|schedule/)) {
      category = "class-related";
    } else if (fullContent.match(/feedback|suggestion|improvement|feature request/)) {
      category = "feature-request";
    }

    return { category, priority };
  }

  /**
   * Infer studio from email sender domain or content
   */
  private async inferStudioFromEmail(email: EmailMessage): Promise<string> {
    // Parse email domain
    const emailDomain = email.from.split("@")[1]?.toLowerCase();

    // In production, look up studio by domain
    // For now, return default
    return "studio-default";
  }

  /**
   * Add email as comment to existing ticket
   */
  private async addCommentToTicket(ticketId: string, email: EmailMessage): Promise<void> {
    const comment = {
      content: email.body,
      author: this.extractSenderName(email.from),
      authorEmail: email.from,
      source: "email",
      attachments: email.attachments,
    };

    // In production, save to database
    console.log(`Added comment to ticket ${ticketId}:`, comment);
  }

  /**
   * Send confirmation email to sender
   */
  private async sendConfirmationEmail(to: string, ticketId: string): Promise<void> {
    const message = {
      to,
      subject: `Ticket Created: ${ticketId}`,
      body: `Your email has been converted to ticket ${ticketId}. We'll get back to you soon.`,
    };

    // In production, use email service
    console.log("Sending confirmation email:", message);

    // Also notify via notification engine
    await notificationEngine.sendNotification(
      to,
      NotificationType.TICKET_CREATED,
      `Ticket ${ticketId} Created`,
      `Your email has been created as a support ticket`,
      { ticketId }
    );
  }

  /**
   * Store email-to-ticket mapping
   */
  private storeEmailMapping(
    emailId: string,
    ticketId: string,
    messageId: string | undefined,
    threadMatch: boolean,
    confidence: number
  ): void {
    const mapping: EmailTicketMapping = {
      emailId,
      ticketId,
      messageId: messageId || emailId,
      createdAt: new Date().toISOString(),
      threadMatch,
      confidence,
    };

    this.ticketMappings.set(emailId, mapping);
  }

  /**
   * Helper functions
   */

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  }

  private normalizeSender(email: string): string {
    return email.toLowerCase().split("+")[0];
  }

  private extractSenderName(email: string): string {
    const match = email.match(/^([^<]+)</);
    return match ? match[1].trim() : email.split("@")[0];
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeText(str1);
    const s2 = this.normalizeText(str2);

    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.includes(shorter)) return 0.9;

    // Simple Levenshtein distance approximation
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }

    return matches / longer.length;
  }
}

// Export singleton
export const emailScannerService = new EmailScannerService();
