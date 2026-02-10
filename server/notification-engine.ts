/**
 * Notification Engine - Comprehensive notification and communication system
 * Handles email, Slack, digests, scheduling, and user preferences
 */

import { Database } from "@/integrations/supabase/types";

export enum NotificationType {
  TICKET_CREATED = "ticket_created",
  TICKET_ASSIGNED = "ticket_assigned",
  TICKET_UPDATED = "ticket_updated",
  TICKET_COMMENTED = "ticket_commented",
  TICKET_RESOLVED = "ticket_resolved",
  TICKET_CLOSED = "ticket_closed",
  SLA_WARNING = "sla_warning",
  SLA_BREACHED = "sla_breached",
  MENTION = "mention",
  STATUS_CHANGE = "status_change",
}

export enum NotificationChannel {
  EMAIL = "email",
  SLACK = "slack",
  IN_APP = "in_app",
  SMS = "sms",
}

export enum DigestFrequency {
  IMMEDIATE = "immediate",
  HOURLY = "hourly",
  DAILY = "daily",
  WEEKLY = "weekly",
  NEVER = "never",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  channels: NotificationChannel[];
  priority: "low" | "medium" | "high" | "critical";
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: Partial<Record<NotificationChannel, boolean>>;
  digestFrequency: Record<NotificationType, DigestFrequency>;
  doNotDisturb?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  };
  unsubscribedTypes: NotificationType[];
}

interface EmailTemplate {
  subject: string;
  html: string;
  plainText: string;
}

/**
 * NotificationEngine - Main notification service
 */
export class NotificationEngine {
  private notificationQueue: Notification[] = [];
  private digestQueue: Map<string, Notification[]> = new Map();
  private preferences: Map<string, UserNotificationPreferences> = new Map();

  /**
   * Send notification to user(s)
   */
  async sendNotification(
    userId: string | string[],
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any> = {},
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
    priority: "low" | "medium" | "high" | "critical" = "medium"
  ): Promise<Notification[]> {
    const userIds = Array.isArray(userId) ? userId : [userId];
    const notifications: Notification[] = [];

    for (const id of userIds) {
      const notification = await this.createNotification(
        id,
        type,
        title,
        message,
        data,
        channels,
        priority
      );

      notifications.push(notification);

      // Route to appropriate channels
      await this.routeNotification(notification);
    }

    return notifications;
  }

  /**
   * Create notification object
   */
  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data: Record<string, any>,
    channels: NotificationChannel[],
    priority: "low" | "medium" | "high" | "critical"
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      data,
      channels,
      priority,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Check user preferences
    const prefs = await this.getUserPreferences(userId);
    if (prefs?.unsubscribedTypes.includes(type)) {
      console.log(`User ${userId} unsubscribed from ${type}`);
      return notification;
    }

    // Add to queue
    this.notificationQueue.push(notification);

    return notification;
  }

  /**
   * Route notification to appropriate channels
   */
  private async routeNotification(notification: Notification): Promise<void> {
    const prefs = await this.getUserPreferences(notification.userId);

    for (const channel of notification.channels) {
      // Check if user has disabled this channel
      if (prefs?.channels[channel] === false) {
        continue;
      }

      // Check digest preferences
      const digestType = prefs?.digestFrequency[notification.type];

      if (digestType && digestType !== DigestFrequency.IMMEDIATE) {
        // Queue for digest
        await this.queueForDigest(notification, digestType);
      } else {
        // Send immediately
        await this.deliverToChannel(notification, channel, prefs);
      }
    }
  }

  /**
   * Queue notification for digest
   */
  private async queueForDigest(
    notification: Notification,
    frequency: DigestFrequency
  ): Promise<void> {
    const key = `${notification.userId}-${frequency}`;
    const queue = this.digestQueue.get(key) || [];
    queue.push(notification);
    this.digestQueue.set(key, queue);

    console.log(`Queued notification for ${frequency} digest`);

    // Schedule digest delivery
    await this.scheduleDigestDelivery(notification.userId, frequency);
  }

  /**
   * Deliver notification to specific channel
   */
  private async deliverToChannel(
    notification: Notification,
    channel: NotificationChannel,
    prefs?: UserNotificationPreferences
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(notification);
        break;

      case NotificationChannel.SLACK:
        await this.sendSlackNotification(notification);
        break;

      case NotificationChannel.IN_APP:
        await this.saveInAppNotification(notification);
        break;

      case NotificationChannel.SMS:
        await this.sendSMSNotification(notification);
        break;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      const template = this.getEmailTemplate(notification.type, notification.data);

      // In production, use email service (SendGrid, AWS SES, etc.)
      console.log(`[EMAIL] To: ${notification.userId}`);
      console.log(`[EMAIL] Subject: ${template.subject}`);
      console.log(`[EMAIL] Message: ${notification.message}`);

      // Example: await emailService.send({
      //   to: userEmail,
      //   subject: template.subject,
      //   html: template.html,
      //   plainText: template.plainText,
      // });
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(notification: Notification): Promise<void> {
    try {
      // In production, use Slack SDK
      console.log(`[SLACK] User: ${notification.userId}`);
      console.log(`[SLACK] Title: ${notification.title}`);
      console.log(`[SLACK] Message: ${notification.message}`);

      // Example: await slack.chat.postMessage({
      //   channel: userSlackId,
      //   text: notification.title,
      //   blocks: [...]
      // });
    } catch (error) {
      console.error("Error sending Slack notification:", error);
    }
  }

  /**
   * Save in-app notification
   */
  private async saveInAppNotification(notification: Notification): Promise<void> {
    try {
      // In production, save to database
      console.log(`[IN_APP] Saving notification for ${notification.userId}`);

      // Example: await db.insert(notifications).values(notification);
    } catch (error) {
      console.error("Error saving in-app notification:", error);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(notification: Notification): Promise<void> {
    try {
      // In production, use SMS service (Twilio, AWS SNS, etc.)
      console.log(`[SMS] User: ${notification.userId}`);
      console.log(`[SMS] Message: ${notification.message}`);

      // Example: await twilio.messages.create({
      //   body: notification.message,
      //   to: userPhoneNumber,
      //   from: TWILIO_PHONE
      // });
    } catch (error) {
      console.error("Error sending SMS notification:", error);
    }
  }

  /**
   * Get email template for notification type
   */
  private getEmailTemplate(
    type: NotificationType,
    data: Record<string, any>
  ): EmailTemplate {
    const templates: Record<NotificationType, (data: any) => EmailTemplate> = {
      [NotificationType.TICKET_CREATED]: (data) => ({
        subject: `New Ticket #${data.ticketNumber} Created`,
        html: `<p>A new ticket has been created:</p><p><strong>${data.title}</strong></p>`,
        plainText: `New Ticket #${data.ticketNumber}: ${data.title}`,
      }),

      [NotificationType.TICKET_ASSIGNED]: (data) => ({
        subject: `Ticket #${data.ticketNumber} Assigned to You`,
        html: `<p>Ticket <strong>#${data.ticketNumber}</strong> has been assigned to you.</p>`,
        plainText: `Ticket #${data.ticketNumber} assigned to you`,
      }),

      [NotificationType.TICKET_UPDATED]: (data) => ({
        subject: `Ticket #${data.ticketNumber} Updated`,
        html: `<p>Ticket <strong>#${data.ticketNumber}</strong> has been updated.</p>`,
        plainText: `Ticket #${data.ticketNumber} updated`,
      }),

      [NotificationType.TICKET_COMMENTED]: (data) => ({
        subject: `New Comment on Ticket #${data.ticketNumber}`,
        html: `<p>New comment on <strong>#${data.ticketNumber}</strong>: ${data.comment}</p>`,
        plainText: `Comment on #${data.ticketNumber}: ${data.comment}`,
      }),

      [NotificationType.SLA_WARNING]: (data) => ({
        subject: `⚠️ SLA Warning: Ticket #${data.ticketNumber}`,
        html: `<p>Ticket <strong>#${data.ticketNumber}</strong> is approaching SLA deadline.</p>`,
        plainText: `SLA Warning for ticket #${data.ticketNumber}`,
      }),

      [NotificationType.SLA_BREACHED]: (data) => ({
        subject: `🚨 SLA Breach: Ticket #${data.ticketNumber}`,
        html: `<p>Ticket <strong>#${data.ticketNumber}</strong> has breached SLA!</p>`,
        plainText: `SLA BREACHED for ticket #${data.ticketNumber}`,
      }),

      [NotificationType.TICKET_RESOLVED]: (data) => ({
        subject: `Ticket #${data.ticketNumber} Resolved`,
        html: `<p>Ticket <strong>#${data.ticketNumber}</strong> has been resolved.</p>`,
        plainText: `Ticket #${data.ticketNumber} resolved`,
      }),

      [NotificationType.TICKET_CLOSED]: (data) => ({
        subject: `Ticket #${data.ticketNumber} Closed`,
        html: `<p>Ticket <strong>#${data.ticketNumber}</strong> has been closed.</p>`,
        plainText: `Ticket #${data.ticketNumber} closed`,
      }),

      [NotificationType.MENTION]: (data) => ({
        subject: `You were mentioned in ticket #${data.ticketNumber}`,
        html: `<p>You were mentioned: ${data.context}</p>`,
        plainText: `Mention in #${data.ticketNumber}`,
      }),

      [NotificationType.STATUS_CHANGE]: (data) => ({
        subject: `Ticket #${data.ticketNumber} Status Changed`,
        html: `<p>Status changed from <strong>${data.oldStatus}</strong> to <strong>${data.newStatus}</strong></p>`,
        plainText: `Status change: ${data.oldStatus} → ${data.newStatus}`,
      }),
    };

    return (templates[type] || templates[NotificationType.TICKET_UPDATED])(data);
  }

  /**
   * Schedule digest delivery
   */
  private async scheduleDigestDelivery(userId: string, frequency: DigestFrequency): Promise<void> {
    // In production, use job scheduler (Bull, node-cron, etc.)
    console.log(`Scheduled ${frequency} digest for user ${userId}`);
  }

  /**
   * Get user preferences
   */
  private async getUserPreferences(
    userId: string
  ): Promise<UserNotificationPreferences | undefined> {
    // Check cache first
    if (this.preferences.has(userId)) {
      return this.preferences.get(userId);
    }

    // In production, load from database
    const defaultPrefs: UserNotificationPreferences = {
      userId,
      channels: {
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.IN_APP]: true,
        [NotificationChannel.SLACK]: false,
        [NotificationChannel.SMS]: false,
      },
      digestFrequency: {
        [NotificationType.TICKET_CREATED]: DigestFrequency.IMMEDIATE,
        [NotificationType.TICKET_ASSIGNED]: DigestFrequency.IMMEDIATE,
        [NotificationType.TICKET_UPDATED]: DigestFrequency.HOURLY,
        [NotificationType.TICKET_COMMENTED]: DigestFrequency.DAILY,
        [NotificationType.TICKET_RESOLVED]: DigestFrequency.DAILY,
        [NotificationType.TICKET_CLOSED]: DigestFrequency.DAILY,
        [NotificationType.SLA_WARNING]: DigestFrequency.IMMEDIATE,
        [NotificationType.SLA_BREACHED]: DigestFrequency.IMMEDIATE,
        [NotificationType.MENTION]: DigestFrequency.IMMEDIATE,
        [NotificationType.STATUS_CHANGE]: DigestFrequency.HOURLY,
      },
      unsubscribedTypes: [],
    };

    this.preferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...updates };

    this.preferences.set(userId, updated);

    // In production, save to database
    console.log(`Updated notification preferences for ${userId}`);

    return updated;
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    let notifications = this.notificationQueue.filter((n) => n.userId === userId);

    if (unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    return notifications.slice(0, limit);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notificationQueue.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }
}

// Export singleton
export const notificationEngine = new NotificationEngine();
