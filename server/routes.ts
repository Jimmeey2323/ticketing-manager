import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs/promises";
import path from "path";
import { setupAuth, isAuthenticated } from "./supabaseAuth";
import { createClient } from "@supabase/supabase-js";
import { insertTicketSchema, insertTicketCommentSchema, insertTeamSchema, insertStudioSchema, insertCategorySchema, insertNotificationSchema, updateTicketSchema, updateTeamSchema, updateStudioSchema } from "@shared/schema";
import { storage } from "./storage";
import { readAppConfig, writeAppConfig, type GmailRule, type WebhookRule } from "./appConfig";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

function generateTicketNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `TKT-${year}${month}${day}-${random}`;
}

function inferGmailRule(subject: string, body: string, rules: GmailRule[]) {
  const haystack = `${subject} ${body}`.toLowerCase();
  return (
    rules.find((rule) =>
      rule.matchKeywords.some((keyword) => haystack.includes(keyword.toLowerCase())),
    ) || null
  );
}

async function resolveFallbackIds() {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const [{ data: studio }, { data: category }] = await Promise.all([
    supabase.from("studios").select("id").eq("isActive", true).order("createdAt", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("categories").select("id").eq("isActive", true).order("createdAt", { ascending: true }).limit(1).maybeSingle(),
  ]);

  return {
    fallbackStudioId: studio?.id || null,
    fallbackCategoryId: category?.id || null,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Since we're skipping database operations for now, return user from token
      const user = req.user?.profile || {
        id: req.user.claims.sub,
        email: req.user.claims.email,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      // Return empty array for now since database is not connected
      res.json([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/teams', isAuthenticated, async (req, res) => {
    try {
      // Return empty array for now since database is not connected
      res.json([]);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      // For now, just return a mock team object
      const team = {
        id: crypto.randomUUID(),
        ...teamData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: "Failed to create team" });
    }
  });

  app.patch('/api/teams/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = updateTeamSchema.parse(req.body);
      // For now, just return a mock updated team
      const team = {
        id: req.params.id,
        ...updates,
        updatedAt: new Date()
      };
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(400).json({ message: "Failed to update team" });
    }
  });

  app.get('/api/studios', isAuthenticated, async (req, res) => {
    try {
      const studios = await storage.getStudios();
      res.json(studios);
    } catch (error) {
      console.error("Error fetching studios:", error);
      // Fallback to hardcoded studios if database fails
      const fallbackStudios = [
        { id: "bb4c3259-d990-4f37-ba3d-fa5df1002f73", name: "Kwality House Kemps Corner", code: "KH-KC", city: "Mumbai" },
        { id: "ffa43ab8-f8d4-4bd2-bfce-3d1975ed7a12", name: "Kenkre House", code: "KENKRE", city: "Mumbai" },
        { id: "b9fbcb4c-7ab9-460d-bdba-9d7f7e376281", name: "South United Football Club", code: "SUFC", city: "Mumbai" },
        { id: "848980b2-098a-4719-9d1f-52f3f5201a08", name: "Supreme HQ Bandra", code: "SHQ-BDR", city: "Mumbai" },
        { id: "426ab626-5e56-4cae-a87c-fceb9a7b5cbc", name: "WeWork Prestige Central", code: "WW-PC", city: "Bangalore" },
        { id: "91ba5ee9-fa33-424c-b90a-143ada8ef68e", name: "WeWork Galaxy", code: "WW-GAL", city: "Delhi" },
        { id: "83b2da09-d557-4aa4-8200-7f0bd7e70239", name: "The Studio by Copper + Cloves", code: "CC-STU", city: "Gurgaon" },
      ];
      res.json(fallbackStudios);
    }
  });

  app.post('/api/studios', isAuthenticated, async (req, res) => {
    try {
      const studioData = insertStudioSchema.parse(req.body);
      // For now, just return a mock studio object
      const studio = {
        id: crypto.randomUUID(),
        ...studioData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      res.status(201).json(studio);
    } catch (error) {
      console.error("Error creating studio:", error);
      res.status(400).json({ message: "Failed to create studio" });
    }
  });

  app.patch('/api/studios/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = updateStudioSchema.parse(req.body);
      // For now, just return a mock updated studio
      const studio = {
        id: req.params.id,
        ...updates,
        updatedAt: new Date()
      };
      res.json(studio);
    } catch (error) {
      console.error("Error updating studio:", error);
      res.status(400).json({ message: "Failed to update studio" });
    }
  });

  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      if (!supabase) return res.status(500).json({ message: 'Supabase not configured' });
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('isActive', true)
        .order('name');
      
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
      if (!supabase) return res.status(500).json({ message: 'Supabase not configured' });
      
      const categoryData = insertCategorySchema.parse(req.body);
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  app.get('/api/subcategories', isAuthenticated, async (req, res) => {
    try {
      if (!supabase) return res.status(500).json({ message: 'Supabase not configured' });
      
      const categoryId = req.query.categoryId as string | undefined;
      let query = supabase.from('subcategories').select('*').eq('isActive', true);
      
      if (categoryId) {
        query = query.eq('categoryId', categoryId);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  app.get('/api/tickets', isAuthenticated, async (req, res) => {
    try {
      if (!supabase) return res.status(500).json({ message: 'Supabase not configured' });
      
      const filters = {
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        category: req.query.category as string | undefined,
        studioId: (req.query.studioId || req.query.studio) as string | undefined,
        assignedToUserId: req.query.assignedToUserId as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      let query = supabase.from('tickets').select('*');
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.studioId) query = query.eq('studioId', filters.studioId);
      if (filters.assignedToUserId) query = query.eq('assignedToUserId', filters.assignedToUserId);
      if (filters.search) query = query.ilike('title', `%${filters.search}%`);
      
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      
      const { data, error } = await query.order('createdAt', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/tickets/:id', isAuthenticated, async (req, res) => {
    try {
      // Prefer Supabase (consistent with list endpoint), fall back to storage if needed
      if (supabase) {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            category:categories(id, name, code, icon, color),
            subcategory:subcategories(id, name, code),
            studio:studios(id, name, code),
            assignedTo:users!tickets_assignedToUserId_fkey(id, firstName, lastName, displayName, email),
            reportedBy:users!tickets_reportedByUserId_fkey(id, firstName, lastName, displayName)
          `)
          .eq('id', req.params.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116: No rows found
        if (data) return res.json(data);
        // If not found by id, try by ticket number
        const { data: byNumber, error: numberErr } = await supabase
          .from('tickets')
          .select(`
            *,
            category:categories(id, name, code, icon, color),
            subcategory:subcategories(id, name, code),
            studio:studios(id, name, code),
            assignedTo:users!tickets_assignedToUserId_fkey(id, firstName, lastName, displayName, email),
            reportedBy:users!tickets_reportedByUserId_fkey(id, firstName, lastName, displayName)
          `)
          .eq('ticketNumber', req.params.id)
          .single();
        if (numberErr && numberErr.code !== 'PGRST116') throw numberErr;
        if (byNumber) return res.json(byNumber);
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Fallback: use storage (drizzle)
      let ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        ticket = await storage.getTicketByNumber(req.params.id);
      }
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  app.post('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      // Transform incidentDateTime string to Date object if present
      if (req.body.incidentDateTime && typeof req.body.incidentDateTime === 'string') {
        req.body.incidentDateTime = new Date(req.body.incidentDateTime);
      }
      
      const ticketData = insertTicketSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const ticket = await storage.createTicket({
        ...ticketData,
        reportedByUserId: userId,
      });
      
      await storage.createTicketHistory({
        ticketId: ticket.id,
        changedByUserId: userId,
        action: 'created',
        fieldChanged: 'status',
        newValue: 'Ticket created',
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(400).json({ message: "Failed to create ticket" });
    }
  });

  app.patch('/api/tickets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const existingTicket = await storage.getTicket(req.params.id);
      if (!existingTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const userId = req.user.claims.sub;
      const updates = updateTicketSchema.parse(req.body);

      for (const [key, value] of Object.entries(updates)) {
        const oldValue = (existingTicket as any)[key];
        if (oldValue !== value) {
          await storage.createTicketHistory({
            ticketId: req.params.id,
            changedByUserId: userId,
            action: 'updated',
            fieldChanged: key,
            oldValue: String(oldValue ?? ''),
            newValue: String(value ?? ''),
          });
        }
      }

      if (updates.status === 'resolved' && !updates.resolvedAt) {
        (updates as any).resolvedAt = new Date();
      }
      if (updates.status === 'closed' && !updates.closedAt) {
        (updates as any).closedAt = new Date();
      }

      const ticket = await storage.updateTicket(req.params.id, updates);
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(400).json({ message: "Failed to update ticket" });
    }
  });

  // Owner-enforced status update endpoint
  app.patch('/api/tickets/:id/status-owner', isAuthenticated, async (req: any, res) => {
    try {
      if (!supabase) return res.status(500).json({ message: 'Supabase not configured' });
      const userId = req.user.claims.sub;
      const { status } = req.body || {};

      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: 'Status is required' });
      }

      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('id, assignedToUserId')
        .eq('id', req.params.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      if (ticket.assignedToUserId !== userId) {
        return res.status(403).json({ message: 'Only the ticket owner can update status' });
      }

      const { data: updated, error: updateError } = await supabase
        .from('tickets')
        .update({ status, updatedAt: new Date().toISOString() })
        .eq('id', req.params.id)
        .select('id, status')
        .single();

      if (updateError) throw updateError;
      res.json(updated);
    } catch (error) {
      console.error('Error updating owner status:', error);
      res.status(500).json({ message: 'Failed to update ticket status' });
    }
  });

  // Owner-enforced closure endpoint
  app.post('/api/tickets/:id/close-owner', isAuthenticated, async (req: any, res) => {
    try {
      if (!supabase) return res.status(500).json({ message: 'Supabase not configured' });
      const userId = req.user.claims.sub;
      const { resolutionSummary } = req.body || {};

      if (!resolutionSummary || typeof resolutionSummary !== 'string') {
        return res.status(400).json({ message: 'Resolution summary is required' });
      }

      const { data: ticket, error: fetchError } = await supabase
        .from('tickets')
        .select('id, assignedToUserId')
        .eq('id', req.params.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      if (ticket.assignedToUserId !== userId) {
        return res.status(403).json({ message: 'Only the ticket owner can close this ticket' });
      }

      const now = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'closed',
          resolutionSummary,
          closedAt: now,
          resolvedAt: now,
          updatedAt: now,
        })
        .eq('id', req.params.id)
        .select('id, status, resolutionSummary, closedAt')
        .single();

      if (updateError) throw updateError;
      res.json(updated);
    } catch (error) {
      console.error('Error closing owner ticket:', error);
      res.status(500).json({ message: 'Failed to close ticket' });
    }
  });

  // Dev-only test endpoint to create a minimal ticket and history (no auth)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/_test/create-ticket', async (req: any, res) => {
      try {
        const ticket = await storage.createTicket({
          title: 'Dev Test Ticket',
          description: 'Created by test endpoint',
          // use a real studio UUID from your DB so the insert doesn't violate NOT NULL
          studioId: 'bb4c3259-d990-4f37-ba3d-fa5df1002f73',
        } as any);

        await storage.createTicketHistory({
          ticketId: ticket.id,
          changedByUserId: 'dev-test',
          action: 'created',
          fieldChanged: 'status',
          newValue: 'Ticket created via test endpoint',
        });

        res.json({ ticket });
      } catch (error: any) {
        console.error('Dev test create ticket error:', error);
        res.status(500).json({ message: 'Dev test create failed', error: String(error) });
      }
    });
  }

  app.delete('/api/tickets/:id', isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteTicket(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  app.get('/api/tickets/:id/comments', isAuthenticated, async (req, res) => {
    try {
      const comments = await storage.getTicketComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/tickets/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertTicketCommentSchema.parse({
        ...req.body,
        ticketId: req.params.id,
        userId,
      });
      const comment = await storage.createTicketComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/tickets/:id/attachments', isAuthenticated, async (req, res) => {
    try {
      const attachments = await storage.getTicketAttachments(req.params.id);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  app.get('/api/tickets/:id/history', isAuthenticated, async (req, res) => {
    try {
      const history = await storage.getTicketHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Graceful degrade: return empty list when DB is unreachable
      res.json([]);
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(400).json({ message: "Failed to mark notification read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Safe defaults to avoid frontend errors when DB is down
      res.json({
        totalOpen: 0,
        totalNew: 0,
        resolvedToday: 0,
        slaBreached: 0,
        avgResolutionHours: 0,
        byStatus: [],
        byPriority: [],
        byCategory: []
      });
    }
  });

  app.get('/api/analytics', isAuthenticated, async (req, res) => {
    try {
      const analytics = await storage.getAnalyticsData();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Safe defaults
      res.json({
        ticketsByCategory: [],
        ticketsByStudio: [],
        ticketsByTeam: [],
        ticketTrend: [],
        resolutionTimeByPriority: [],
        topCategories: []
      });
    }
  });

  // Proxy endpoints for Momence to avoid exposing API token in the browser and bypass CORS
  app.get('/api/momence/search', isAuthenticated, async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) return res.json({ payload: [] });

      const baseURL = process.env.MOMENCE_API_BASE_URL || 'https://api.momence.com/api/v2';
      const token = process.env.MOMENCE_AUTH_TOKEN || '';

      const url = `${baseURL}/host/members?page=0&pageSize=100&sortOrder=ASC&sortBy=firstName&query=${encodeURIComponent(q)}`;

      const doFetch = async (useBasic: boolean) => {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (useBasic) headers['Authorization'] = `Basic ${token}`;
        else headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { method: 'GET', headers });
      };

      let response = await doFetch(true);
      if (response.status === 401) response = await doFetch(false);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return res.status(response.status).json({ message: `Momence search failed: ${text}` });
      }

      const json = await response.json().catch(() => null);
      res.json(json || { payload: [] });
    } catch (error) {
      console.error('Error proxying Momence search', error);
      res.status(500).json({ message: 'Failed to proxy Momence search' });
    }
  });

  app.get('/api/momence/members/:id', isAuthenticated, async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ message: 'Missing member id' });

      const baseURL = process.env.MOMENCE_API_BASE_URL || 'https://api.momence.com/api/v2';
      const token = process.env.MOMENCE_AUTH_TOKEN || '';

      const url = `${baseURL}/host/members/${encodeURIComponent(id)}`;

      const doFetch = async (useBasic: boolean) => {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (useBasic) headers['Authorization'] = `Basic ${token}`;
        else headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { method: 'GET', headers });
      };

      let response = await doFetch(true);
      if (response.status === 401) response = await doFetch(false);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return res.status(response.status).json({ message: `Momence get member failed: ${text}` });
      }

      const json = await response.json().catch(() => null);
      res.json(json || {});
    } catch (error) {
      console.error('Error proxying Momence member fetch', error);
      res.status(500).json({ message: 'Failed to proxy Momence member fetch' });
    }
  });

  // Get all categories with their subcategories
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ message: 'Supabase client not initialized' });
      }
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, code, defaultPriority, sortOrder, isActive')
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Get subcategories for a specific category (accepts category name or ID)
  app.get('/api/categories/:categoryId/subcategories', isAuthenticated, async (req, res) => {
    try {
      const { categoryId } = req.params;

      if (!supabase) {
        return res.status(500).json({ message: 'Supabase client not initialized' });
      }

      // Try to find by name or code if it's not a UUID
      let actualCategoryId = categoryId;
      
      if (!categoryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .or(`name.eq.${categoryId},code.eq.${categoryId}`)
          .single();
        
        if (category) {
          actualCategoryId = category.id;
        } else {
          return res.json([]);
        }
      }

      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, description, code, defaultPriority, sortOrder, isActive')
        .eq('categoryId', actualCategoryId)
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ message: 'Failed to fetch subcategories' });
    }
  });

  // Get dynamic fields for a category and subcategory (accepts category name or ID)
  app.get('/api/categories/:categoryId/fields', isAuthenticated, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { subcategoryId } = req.query;

      if (!supabase) {
        return res.status(500).json({ message: 'Supabase client not initialized' });
      }

      // First, get the actual category ID if they passed a name/code
      let actualCategoryId = categoryId;
      
      // Try to find by name or code if it's not a UUID
      if (!categoryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: categories, error: catError } = await supabase
          .from('categories')
          .select('id, name, code')
          .or(`name.eq.${categoryId},code.eq.${categoryId}`);
        
        const category = categories?.[0];
        
        if (category) {
          actualCategoryId = category.id;
        } else {
          console.log(`Category not found for: ${categoryId}`);
          return res.json([]);
        }
      }

      // If no subcategoryId provided, return empty array - subcategory selection is required
      if (!subcategoryId) {
        return res.json([]);
      }

      // Validate that subcategoryId is a proper UUID
      if (!String(subcategoryId).match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log(`Invalid subcategoryId format: ${subcategoryId}`);
        return res.status(400).json({ message: 'Invalid subcategory ID format' });
      }

      let query = supabase
        .from('dynamicFields')
        .select(`
          id,
          label,
          uniqueId,
          description,
          fieldType:fieldTypeId (id, name),
          options,
          validationRules,
          defaultValue,
          isRequired,
          isHidden,
          sortOrder,
          categoryId,
          subcategoryId
        `)
        .eq('categoryId', actualCategoryId)
        .eq('isActive', true)
        .or(`subcategoryId.eq.${subcategoryId},subcategoryId.is.null`);

      const { data, error } = await query.order('sortOrder', { ascending: true });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error fetching dynamic fields:', error);
      res.status(500).json({ message: 'Failed to fetch dynamic fields' });
    }
  });

  // Fallback: Get all fields mapping (for compatibility)
  app.get('/api/field-mapping', isAuthenticated, async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ message: 'Supabase client not initialized' });
      }
      const sb = supabase;
      const { data: categories, error: catError } = await sb
        .from('categories')
        .select('id, name')
        .eq('isActive', true);

      if (catError) throw catError;

      const mapping: Record<string, Record<string, any[]>> = {};

      for (const category of categories || []) {
        mapping[category.name] = {};

        // Get global fields for this category
        const { data: globalFields, error: globalError } = await sb
          .from('dynamicFields')
          .select(`id, label, uniqueId, description, fieldType:fieldTypeId (name), options, isRequired, isHidden, sortOrder`)
          .eq('categoryId', category.id)
          .is('subcategoryId', null)
          .eq('isActive', true)
          .order('sortOrder', { ascending: true });

        if (globalError) throw globalError;

        mapping[category.name]['Global'] = globalFields || [];

        // Get subcategories for this category
        const { data: subcategories, error: subError } = await sb
          .from('subcategories')
          .select('id, name')
          .eq('categoryId', category.id)
          .eq('isActive', true);

        if (subError) throw subError;

        // Get fields for each subcategory
        for (const sub of subcategories || []) {
          const { data: subFields, error: subFieldError } = await sb
            .from('dynamicFields')
            .select(`id, label, uniqueId, description, fieldType:fieldTypeId (name), options, isRequired, isHidden, sortOrder`)
            .eq('subcategoryId', sub.id)
            .eq('isActive', true)
            .order('sortOrder', { ascending: true });

          if (subFieldError) throw subFieldError;

          mapping[category.name][sub.name] = subFields || [];
        }
      }

      res.json(mapping);
    } catch (error) {
      console.error('Error reading field mapping:', error);
      res.status(500).json({ message: 'Failed to read field mapping' });
    }
  });

  // Global application settings and integrations configuration
  app.get("/api/settings/app-config", isAuthenticated, async (_req, res) => {
    try {
      let config = await readAppConfig();
      if (supabase) {
        const { data: configRule } = await supabase
          .from("workflowRules")
          .select("id, actions")
          .eq("triggerEvent", "app_config")
          .maybeSingle();

        const supabaseConfig = (configRule?.actions as any)?.config;
        if (supabaseConfig) {
          config = {
            ...config,
            ...supabaseConfig,
            ui: {
              ...config.ui,
              ...(supabaseConfig.ui || {}),
            },
            integrations: {
              ...config.integrations,
              ...(supabaseConfig.integrations || {}),
            },
          };
        }
      }
      res.json(config);
    } catch (error) {
      console.error("Error loading app config:", error);
      res.status(500).json({ message: "Failed to load app config" });
    }
  });

  app.put("/api/settings/app-config", isAuthenticated, async (req, res) => {
    try {
      const current = await readAppConfig();
      const nextConfig = {
        ...current,
        ...req.body,
        ui: {
          ...current.ui,
          ...(req.body?.ui || {}),
        },
        integrations: {
          ...current.integrations,
          ...(req.body?.integrations || {}),
          mailtrap: {
            ...current.integrations.mailtrap,
            ...(req.body?.integrations?.mailtrap || {}),
          },
          webhooks: {
            ...current.integrations.webhooks,
            ...(req.body?.integrations?.webhooks || {}),
          },
          gmail: {
            ...current.integrations.gmail,
            ...(req.body?.integrations?.gmail || {}),
          },
        },
      };
      await writeAppConfig(nextConfig);
      if (supabase) {
        const { data: existingRule } = await supabase
          .from("workflowRules")
          .select("id")
          .eq("triggerEvent", "app_config")
          .maybeSingle();

        if (existingRule?.id) {
          await supabase
            .from("workflowRules")
            .update({
              actions: { config: nextConfig },
              updatedAt: new Date().toISOString(),
            })
            .eq("id", existingRule.id);
        } else {
          await supabase.from("workflowRules").insert({
            name: "Application Configuration",
            description: "Global interface and integration settings",
            triggerEvent: "app_config",
            conditions: {},
            actions: { config: nextConfig },
            runOrder: 0,
            isActive: true,
          });
        }
      }
      res.json(nextConfig);
    } catch (error) {
      console.error("Error saving app config:", error);
      res.status(500).json({ message: "Failed to save app config" });
    }
  });

  // Webhook rules management
  app.get("/api/integrations/webhooks", isAuthenticated, async (_req, res) => {
    try {
      const config = await readAppConfig();
      res.json(config.integrations.webhooks);
    } catch (error) {
      console.error("Error loading webhook config:", error);
      res.status(500).json({ message: "Failed to load webhook config" });
    }
  });

  app.post("/api/integrations/webhooks", isAuthenticated, async (req, res) => {
    try {
      const config = await readAppConfig();
      const rule: WebhookRule = {
        id: crypto.randomUUID(),
        name: String(req.body?.name || "Automation webhook").trim(),
        key: String(req.body?.key || crypto.randomUUID().replaceAll("-", "")),
        isActive: req.body?.isActive !== false,
        defaultStudioId: req.body?.defaultStudioId || null,
        defaultCategoryId: req.body?.defaultCategoryId || null,
        defaultPriority: req.body?.defaultPriority || "medium",
        processAutomatically: req.body?.processAutomatically !== false,
      };
      config.integrations.webhooks.rules.push(rule);
      await writeAppConfig(config);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating webhook rule:", error);
      res.status(500).json({ message: "Failed to create webhook rule" });
    }
  });

  app.patch("/api/integrations/webhooks/:id", isAuthenticated, async (req, res) => {
    try {
      const config = await readAppConfig();
      const index = config.integrations.webhooks.rules.findIndex((r) => r.id === req.params.id);
      if (index < 0) {
        return res.status(404).json({ message: "Webhook rule not found" });
      }
      const existing = config.integrations.webhooks.rules[index];
      config.integrations.webhooks.rules[index] = {
        ...existing,
        ...req.body,
      };
      await writeAppConfig(config);
      res.json(config.integrations.webhooks.rules[index]);
    } catch (error) {
      console.error("Error updating webhook rule:", error);
      res.status(500).json({ message: "Failed to update webhook rule" });
    }
  });

  app.delete("/api/integrations/webhooks/:id", isAuthenticated, async (req, res) => {
    try {
      const config = await readAppConfig();
      config.integrations.webhooks.rules = config.integrations.webhooks.rules.filter(
        (rule) => rule.id !== req.params.id,
      );
      await writeAppConfig(config);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting webhook rule:", error);
      res.status(500).json({ message: "Failed to delete webhook rule" });
    }
  });

  // Public webhook endpoint for automatic ticket creation
  app.post("/api/integrations/webhooks/:key", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ message: "Supabase not configured" });
      }

      const config = await readAppConfig();
      if (!config.integrations.webhooks.enabled) {
        return res.status(403).json({ message: "Webhook ingestion is disabled" });
      }

      const rule = config.integrations.webhooks.rules.find(
        (candidate) => candidate.key === req.params.key && candidate.isActive,
      );

      if (!rule) {
        return res.status(404).json({ message: "Webhook rule not found or inactive" });
      }
      if (!rule.processAutomatically) {
        return res.status(202).json({ message: "Webhook accepted but auto-processing is disabled for this rule" });
      }

      const payload = req.body || {};
      const title = String(payload.title || payload.subject || "Inbound webhook ticket");
      const description = String(
        payload.description || payload.body || payload.message || "Ticket created by webhook integration.",
      );
      const customerEmail = payload.customerEmail || payload.email || null;
      const customerName = payload.customerName || payload.name || null;

      const { fallbackStudioId, fallbackCategoryId } = await resolveFallbackIds();
      const studioId = rule.defaultStudioId || fallbackStudioId;
      const categoryId = rule.defaultCategoryId || fallbackCategoryId;

      if (!studioId || !categoryId) {
        return res.status(400).json({
          message: "Webhook rule is missing fallback mappings. Configure default studio and category.",
        });
      }

      const ticketNumber = generateTicketNumber();
      const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: createdTicket, error } = await supabase
        .from("tickets")
        .insert({
          ticketNumber,
          title,
          description,
          studioId,
          categoryId,
          priority: rule.defaultPriority || "medium",
          status: "new",
          source: "webhook",
          customerEmail,
          customerName,
          dynamicFieldData: {
            webhookPayload: payload,
            webhookRuleId: rule.id,
          },
          slaDueAt: dueAt,
        })
        .select("id, ticketNumber, title")
        .single();

      if (error) throw error;

      res.status(201).json({
        message: "Ticket created from webhook",
        ticket: createdTicket,
      });
    } catch (error) {
      console.error("Error processing webhook ticket ingestion:", error);
      res.status(500).json({ message: "Failed to process webhook payload" });
    }
  });

  // Gmail automation helpers
  app.post("/api/integrations/gmail/classify", isAuthenticated, async (req, res) => {
    try {
      const config = await readAppConfig();
      const subject = String(req.body?.subject || "");
      const body = String(req.body?.body || "");
      const matchedRule = inferGmailRule(subject, body, config.integrations.gmail.rules);
      res.json({
        matched: !!matchedRule,
        rule: matchedRule,
      });
    } catch (error) {
      console.error("Error classifying Gmail message:", error);
      res.status(500).json({ message: "Failed to classify Gmail message" });
    }
  });

  app.post("/api/integrations/gmail/import", isAuthenticated, async (req: any, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ message: "Supabase not configured" });
      }
      const config = await readAppConfig();
      const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
      if (messages.length === 0) {
        return res.status(400).json({ message: "No Gmail messages provided" });
      }

      const { fallbackStudioId, fallbackCategoryId } = await resolveFallbackIds();
      if (!fallbackStudioId || !fallbackCategoryId) {
        return res.status(400).json({
          message: "Missing default studio/category in database. Add baseline data first.",
        });
      }

      const imported: any[] = [];
      for (const msg of messages) {
        const subject = String(msg.subject || "Imported Gmail ticket");
        const body = String(msg.body || msg.snippet || "");
        const matchedRule = inferGmailRule(subject, body, config.integrations.gmail.rules);
        const shouldAutoProcess = matchedRule?.autoProcess ?? false;
        const priority = matchedRule?.priority || "medium";
        const categoryId = matchedRule?.categoryId || fallbackCategoryId;
        const subcategoryId = matchedRule?.subcategoryId || null;
        const ticketNumber = generateTicketNumber();

        const { data: createdTicket, error } = await supabase
          .from("tickets")
          .insert({
            ticketNumber,
            title: subject,
            description: body || "Imported from Gmail integration",
            studioId: fallbackStudioId,
            categoryId,
            subcategoryId,
            priority,
            status: shouldAutoProcess ? "assigned" : "new",
            source: "email",
            customerEmail: msg.fromEmail || null,
            customerName: msg.fromName || null,
            dynamicFieldData: {
              gmailImport: true,
              gmailMessageId: msg.id || null,
              matchedRuleId: matchedRule?.id || null,
              autoProcessed: shouldAutoProcess,
            },
          })
          .select("id, ticketNumber, title, status")
          .single();

        if (error) throw error;
        imported.push(createdTicket);
      }

      res.json({
        message: "Gmail messages imported into tickets",
        importedCount: imported.length,
        tickets: imported,
      });
    } catch (error) {
      console.error("Error importing Gmail tickets:", error);
      res.status(500).json({ message: "Failed to import Gmail messages" });
    }
  });

  // Momence Sessions endpoints
  app.get('/api/momence/sessions', isAuthenticated, async (req, res) => {
    try {
      const locationId = req.query.locationId ? String(req.query.locationId).trim() : undefined;
      const page = req.query.page ? parseInt(String(req.query.page)) : 0;
      const pageSize = req.query.pageSize ? parseInt(String(req.query.pageSize)) : 200;

      const baseURL = process.env.MOMENCE_API_BASE_URL || 'https://api.momence.com/api/v2';
      const token = process.env.MOMENCE_AUTH_TOKEN || '';

      // Build URL with optional locationId
      let url = `${baseURL}/host/sessions?page=${page}&pageSize=${pageSize}&sortOrder=DESC&sortBy=startsAt&includeCancelled=false`;
      
      if (locationId) {
        url += `&locationId=${encodeURIComponent(locationId)}`;
      }

      // Get today's date for startsBefore parameter
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const startsBeforeParam = `${today.toISOString().split('.')[0]}Z`;
      url += `&startsBefore=${encodeURIComponent(startsBeforeParam)}`;

      const doFetch = async (useBasic: boolean) => {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (useBasic) headers['Authorization'] = `Basic ${token}`;
        else headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { method: 'GET', headers });
      };

      let response = await doFetch(true);
      if (response.status === 401) response = await doFetch(false);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return res.status(response.status).json({ message: `Momence sessions fetch failed: ${text}` });
      }

      const json = await response.json().catch(() => null);
      res.json(json || { payload: [] });
    } catch (error) {
      console.error('Error proxying Momence sessions', error);
      res.status(500).json({ message: 'Failed to proxy Momence sessions' });
    }
  });

  app.get('/api/momence/sessions/:id', isAuthenticated, async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ message: 'Missing session id' });

      const baseURL = process.env.MOMENCE_API_BASE_URL || 'https://api.momence.com/api/v2';
      const token = process.env.MOMENCE_AUTH_TOKEN || '';

      const url = `${baseURL}/host/sessions/${encodeURIComponent(id)}`;

      const doFetch = async (useBasic: boolean) => {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (useBasic) headers['Authorization'] = `Basic ${token}`;
        else headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { method: 'GET', headers });
      };

      let response = await doFetch(true);
      if (response.status === 401) response = await doFetch(false);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return res.status(response.status).json({ message: `Momence get session failed: ${text}` });
      }

      const json = await response.json().catch(() => null);
      res.json(json || {});
    } catch (error) {
      console.error('Error proxying Momence session fetch', error);
      res.status(500).json({ message: 'Failed to proxy Momence session fetch' });
    }
  });

  // Sentiment Analysis endpoint
  app.post('/api/analyze-sentiment', isAuthenticated, async (req, res) => {
    try {
      const { title, description, clientMood } = req.body;

      if (!title || !description) {
        return res.status(400).json({ message: 'Missing required fields: title and description' });
      }

      const { sentimentAnalyzer } = await import('./sentimentAnalyzer.js');

      if (!sentimentAnalyzer.isConfigured()) {
        return res.status(503).json({ 
          message: 'Sentiment analysis is not configured',
          sentiment: 'neutral',
          confidence: 0,
          tags: ['support', 'ticket'],
          summary: 'Support ticket'
        });
      }

      const result = await sentimentAnalyzer.analyzeSentiment(title, description, clientMood);
      res.json(result);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      res.status(500).json({ message: 'Failed to analyze sentiment' });
    }
  });

  // Add sample fields for testing (temporary endpoint)
  app.post('/api/admin/add-sample-fields', isAuthenticated, async (req, res) => {
    try {
      if (!supabase) return res.status(500).json({ message: 'Supabase not configured' });

      // Get category and field types
      const { data: categories } = await supabase
        .from('categories')
        .select('id, code')
        .in('code', ['booking-tech', 'class-experience', 'customer-service']);

      const { data: fieldTypes } = await supabase
        .from('fieldTypes')
        .select('id, name');

      const categoryMap = Object.fromEntries(categories?.map((c: any) => [c.code, c.id]) || []);
      const fieldTypeMap = Object.fromEntries(fieldTypes?.map((f: any) => [f.name, f.id]) || []);

      // Sample fields for booking-tech
      const sampleFields = [
        {
          label: 'Issue Type',
          uniqueId: 'BT-ISSUE-TYPE',
          categoryId: categoryMap['booking-tech'],
          fieldTypeId: fieldTypeMap['Dropdown'],
          options: ['App Crash', 'Slow Loading', 'Login Problems', 'Feature Not Working', 'UI/UX Confusion'],
          isRequired: true,
          sortOrder: 1,
          description: 'Type of technical issue'
        },
        {
          label: 'Platform',
          uniqueId: 'BT-PLATFORM',
          categoryId: categoryMap['booking-tech'],
          fieldTypeId: fieldTypeMap['Dropdown'],
          options: ['iOS App', 'Android App', 'Website (Desktop)', 'Website (Mobile)'],
          isRequired: true,
          sortOrder: 2,
          description: 'Which platform had the issue'
        },
        {
          label: 'Browser/Device',
          uniqueId: 'BT-DEVICE',
          categoryId: categoryMap['booking-tech'],
          fieldTypeId: fieldTypeMap['Text'],
          isRequired: false,
          sortOrder: 3,
          description: 'Device model or browser used'
        }
      ];

      // Insert sample fields
      const { data, error } = await supabase
        .from('dynamicFields')
        .insert(sampleFields)
        .select();

      if (error) throw error;

      res.json({
        message: 'Sample fields added successfully',
        count: data?.length || 0
      });
    } catch (error) {
      console.error('Error adding sample fields:', error);
      res.status(500).json({ message: 'Failed to add sample fields', error: String(error) });
    }
  });

  // Migrate CSV fields to database (Run once)
  app.post('/api/admin/migrate-fields', isAuthenticated, async (req, res) => {
    try {
      // Ensure field types exist
      const fieldTypes = [
        { name: 'Dropdown' },
        { name: 'Text' },
        { name: 'Textarea' },
        { name: 'DateTime' },
        { name: 'Date' },
        { name: 'Email' },
        { name: 'Phone' },
        { name: 'Checkbox' },
        { name: 'File Upload' }
      ];

      if (!supabase) {
        return res.status(500).json({ message: 'Supabase client not initialized' });
      }
      const sb = supabase;

      for (const ft of fieldTypes) {
        await sb
          .from('fieldTypes')
          .upsert({ name: ft.name }, { onConflict: 'name' });
      }

      // Read and parse CSV
      const csvPath = path.resolve(process.cwd(), 'attached_assets', 'fields_1765795119065.csv');
      const content = await fs.readFile(csvPath, 'utf8');

      const parseCsv = (text: string) => {
        const rows: string[][] = [];
        let cur = '';
        let row: string[] = [];
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === '"') {
            inQuotes = !inQuotes;
            continue;
          }
          if (ch === ',' && !inQuotes) {
            row.push(cur);
            cur = '';
            continue;
          }
          if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(cur);
            cur = '';
            rows.push(row);
            row = [];
            continue;
          }
          cur += ch;
        }
        if (cur !== '' || row.length > 0) {
          row.push(cur);
          rows.push(row);
        }
        return rows.map(r => r.map(s => s.trim()));
      };

      const rows = parseCsv(content);
      if (rows.length < 2) {
        return res.json({ message: 'CSV is empty', count: 0 });
      }

      const headers = rows[0];
      const dataRows = rows.slice(1).filter(r => r.length >= 1 && r.some(c => c !== ''));

      let migrated = 0;

      for (const r of dataRows) {
        const obj: Record<string, string> = {};
        for (let i = 0; i < headers.length; i++) {
          obj[headers[i] || `col${i}`] = (r[i] || '').trim();
        }

        const categoryName = obj['Category'] || 'Global';
        const subcategoryName = obj['Sub Category'] || null;
        const label = obj['Label'] || '';
        const fieldType = obj['Field Type'] || 'Text';
        const options = obj['Options/Other Details'] || '';
        const uniqueId = obj['Unique ID'] || label;

        if (!label) continue;

        // Get category ID
        let { data: categoryData, error: catError } = await sb
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .single();

        if (catError || !categoryData) {
          console.warn(`Category "${categoryName}" not found, creating it...`);
          const { data: newCat } = await sb
            .from('categories')
            .insert({
              name: categoryName,
              description: `Auto-imported from CSV`,
              code: categoryName.toLowerCase().replace(/\s+/g, '_'),
              isActive: true
            })
            .select()
            .single();
          categoryData = newCat;
        }

        let subcategoryId = null;
        if (subcategoryName && categoryData) {
          let { data: subcatData, error: subcatError } = await sb
            .from('subcategories')
            .select('id')
            .eq('categoryId', categoryData.id)
            .eq('name', subcategoryName)
            .single();

          if (subcatError || !subcatData) {
            const { data: newSubcat } = await sb
              .from('subcategories')
              .insert({
                categoryId: categoryData.id,
                name: subcategoryName,
                code: subcategoryName.toLowerCase().replace(/\s+/g, '_'),
                isActive: true
              })
              .select()
              .single();
            subcatData = newSubcat;
          }

          subcategoryId = subcatData?.id;
        }

        // Get field type ID
        const { data: fieldTypeData } = await sb
          .from('fieldTypes')
          .select('id')
          .eq('name', fieldType)
          .single();

        if (!fieldTypeData) {
          console.warn(`Field type "${fieldType}" not found, skipping...`);
          continue;
        }

        // Upsert dynamic field
        const optionsArray = options.split('|').map(o => o.trim()).filter(o => o.length > 0);
        
        await sb
          .from('dynamicFields')
          .upsert({
            label,
            uniqueId,
            fieldTypeId: fieldTypeData.id,
            categoryId: categoryData?.id,
            subcategoryId,
            options: optionsArray.length > 0 ? optionsArray : null,
            description: obj['Description'] || '',
            isRequired: (obj['Is Required'] || '').toLowerCase() === 'yes',
            isHidden: (obj['Is Hidden'] || '').toLowerCase() === 'yes',
            isActive: true
          }, { onConflict: 'uniqueId' });

        migrated++;
      }

      res.json({
        message: `Successfully migrated ${migrated} fields to database`,
        count: migrated
      });
    } catch (error) {
      console.error('Error migrating fields:', error);
      res.status(500).json({ message: 'Failed to migrate fields', error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
