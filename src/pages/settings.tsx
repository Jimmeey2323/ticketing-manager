import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  Palette,
  Layers,
  ListTree,
  Workflow,
  Users,
  Plug,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Mail,
  Webhook,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  applyUiPreferences,
  defaultUiPreferences,
  loadUiPreferences,
  saveUiPreferences,
  type UiPreferences,
} from "@/lib/ui-preferences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Priority = "low" | "medium" | "high" | "critical";

interface AppConfig {
  ui: {
    compactMode: boolean;
    animationsEnabled: boolean;
  };
  integrations: {
    mailtrap: {
      enabled: boolean;
      fromEmail: string;
      fromName: string;
    };
    webhooks: {
      enabled: boolean;
      rules: Array<{
        id: string;
        name: string;
        key: string;
        isActive: boolean;
        defaultStudioId: string | null;
        defaultCategoryId: string | null;
        defaultPriority: Priority;
        processAutomatically: boolean;
      }>;
    };
    gmail: {
      enabled: boolean;
      connectedAccounts: Array<{
        id: string;
        email: string;
        connectedAt: string;
      }>;
      rules: Array<{
        id: string;
        name: string;
        matchKeywords: string[];
        categoryId: string | null;
        subcategoryId: string | null;
        priority: Priority;
        autoProcess: boolean;
      }>;
    };
  };
}

const DEFAULT_APP_CONFIG: AppConfig = {
  ui: {
    compactMode: false,
    animationsEnabled: true,
  },
  integrations: {
    mailtrap: {
      enabled: true,
      fromEmail: "info@physique57india.com",
      fromName: "Physique 57 Support",
    },
    webhooks: {
      enabled: false,
      rules: [],
    },
    gmail: {
      enabled: false,
      connectedAccounts: [],
      rules: [],
    },
  },
};

const toCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

function parseCsvKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("interface");
  const [uiPreferences, setUiPreferences] = useState<UiPreferences>(loadUiPreferences());
  const [hierarchyDraft, setHierarchyDraft] = useState<string>("{}");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryCode, setNewSubcategoryCode] = useState("");

  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldUniqueId, setNewFieldUniqueId] = useState("");
  const [newFieldTypeId, setNewFieldTypeId] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldSubcategoryId, setNewFieldSubcategoryId] = useState<string>("none");

  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePriority, setNewRulePriority] = useState<Priority>("medium");
  const [newRuleResolutionHours, setNewRuleResolutionHours] = useState(24);

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDepartmentId, setNewTeamDepartmentId] = useState<string>("none");
  const [newTeamLeadUserId, setNewTeamLeadUserId] = useState<string>("none");

  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookPriority, setNewWebhookPriority] = useState<Priority>("medium");
  const [newWebhookCategoryId, setNewWebhookCategoryId] = useState<string>("none");
  const [newWebhookStudioId, setNewWebhookStudioId] = useState<string>("none");
  const [newWebhookAutoProcess, setNewWebhookAutoProcess] = useState(true);

  const [newGmailAccountEmail, setNewGmailAccountEmail] = useState("");
  const [newGmailRuleName, setNewGmailRuleName] = useState("");
  const [newGmailRuleKeywords, setNewGmailRuleKeywords] = useState("");
  const [newGmailRuleCategoryId, setNewGmailRuleCategoryId] = useState<string>("none");
  const [newGmailRuleSubcategoryId, setNewGmailRuleSubcategoryId] = useState<string>("none");
  const [newGmailRulePriority, setNewGmailRulePriority] = useState<Priority>("medium");
  const [newGmailRuleAutoProcess, setNewGmailRuleAutoProcess] = useState(true);

  const [gmailImportResult, setGmailImportResult] = useState<string>("");

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["settings-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, code, defaultPriority, slaHours, isActive")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: subcategories = [], refetch: refetchSubcategories } = useQuery({
    queryKey: ["settings-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id, name, code, categoryId, defaultPriority, slaHours, isActive")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fieldTypes = [] } = useQuery({
    queryKey: ["settings-field-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fieldTypes")
        .select("id, name, inputComponent")
        .eq("isActive", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: dynamicFields = [], refetch: refetchDynamicFields } = useQuery({
    queryKey: ["settings-dynamic-fields", selectedCategoryId],
    queryFn: async () => {
      let query = supabase
        .from("dynamicFields")
        .select("id, label, uniqueId, categoryId, subcategoryId, fieldTypeId, isRequired, isActive, options, sortOrder")
        .order("sortOrder", { ascending: true });
      if (selectedCategoryId !== "all") {
        query = query.eq("categoryId", selectedCategoryId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: slaRules = [], refetch: refetchSlaRules } = useQuery({
    queryKey: ["settings-sla-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slaRules")
        .select("id, name, priority, firstResponseHours, resolutionHours, escalationHours, categoryId, subcategoryId, isActive")
        .order("sortOrder", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: teams = [], refetch: refetchTeams } = useQuery({
    queryKey: ["settings-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, departmentId, leadUserId, isActive")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["settings-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, displayName, firstName, lastName, email")
        .eq("isActive", true)
        .order("displayName");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["settings-departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code")
        .eq("isActive", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: studios = [] } = useQuery({
    queryKey: ["settings-studios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studios")
        .select("id, name")
        .eq("isActive", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: hierarchyRule } = useQuery({
    queryKey: ["settings-team-hierarchy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflowRules")
        .select("id, actions")
        .eq("triggerEvent", "team_hierarchy")
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
  });

  const { data: appConfig = DEFAULT_APP_CONFIG, refetch: refetchAppConfig } = useQuery<AppConfig>({
    queryKey: ["settings-app-config"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings/app-config");
      return (await response.json()) as AppConfig;
    },
  });

  const filteredSubcategories = useMemo(() => {
    if (selectedCategoryId === "all") return subcategories;
    return subcategories.filter((sub: any) => sub.categoryId === selectedCategoryId);
  }, [subcategories, selectedCategoryId]);

  useEffect(() => {
    setTheme(uiPreferences.theme);
    applyUiPreferences(uiPreferences);
  }, [uiPreferences, setTheme]);

  useEffect(() => {
    if (hierarchyRule?.actions) {
      const hierarchy = (hierarchyRule.actions as any)?.hierarchy || {};
      setHierarchyDraft(JSON.stringify(hierarchy, null, 2));
    }
  }, [hierarchyRule]);

  const saveAppConfigMutation = useMutation({
    mutationFn: async (nextConfig: AppConfig) => {
      const response = await apiRequest("PUT", "/api/settings/app-config", nextConfig);
      return (await response.json()) as AppConfig;
    },
    onSuccess: (savedConfig) => {
      queryClient.setQueryData(["settings-app-config"], savedConfig);
      toast({ title: "Application settings saved" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save application settings",
        description: error?.message || "Please retry",
        variant: "destructive",
      });
    },
  });

  const saveUi = () => {
    saveUiPreferences(uiPreferences);
    applyUiPreferences(uiPreferences);
    setTheme(uiPreferences.theme);
    toast({ title: "Interface preferences applied globally" });
  };

  const refreshAll = async () => {
    await Promise.all([
      refetchCategories(),
      refetchSubcategories(),
      refetchDynamicFields(),
      refetchSlaRules(),
      refetchTeams(),
      refetchAppConfig(),
    ]);
    toast({ title: "Settings reloaded" });
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    const code = newCategoryCode.trim() || toCode(newCategoryName);
    const { error } = await supabase.from("categories").insert({
      name: newCategoryName.trim(),
      code,
      defaultPriority: "medium",
      isActive: true,
    });
    if (error) {
      toast({ title: "Failed to add category", description: error.message, variant: "destructive" });
      return;
    }
    setNewCategoryName("");
    setNewCategoryCode("");
    await refetchCategories();
    toast({ title: "Category added" });
  };

  const updateCategory = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from("categories").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Failed to update category", description: error.message, variant: "destructive" });
      return;
    }
    await refetchCategories();
    toast({ title: "Category updated" });
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete category", description: error.message, variant: "destructive" });
      return;
    }
    await Promise.all([refetchCategories(), refetchSubcategories(), refetchDynamicFields()]);
    toast({ title: "Category deleted" });
  };

  const createSubcategory = async () => {
    if (selectedCategoryId === "all" || !newSubcategoryName.trim()) {
      toast({
        title: "Select a category first",
        description: "Choose a category before adding subcategories",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("subcategories").insert({
      categoryId: selectedCategoryId,
      name: newSubcategoryName.trim(),
      code: newSubcategoryCode.trim() || toCode(newSubcategoryName),
      defaultPriority: "medium",
      isActive: true,
    });
    if (error) {
      toast({ title: "Failed to add subcategory", description: error.message, variant: "destructive" });
      return;
    }
    setNewSubcategoryName("");
    setNewSubcategoryCode("");
    await refetchSubcategories();
    toast({ title: "Subcategory added" });
  };

  const updateSubcategory = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from("subcategories").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Failed to update subcategory", description: error.message, variant: "destructive" });
      return;
    }
    await refetchSubcategories();
    toast({ title: "Subcategory updated" });
  };

  const deleteSubcategory = async (id: string) => {
    const { error } = await supabase.from("subcategories").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete subcategory", description: error.message, variant: "destructive" });
      return;
    }
    await Promise.all([refetchSubcategories(), refetchDynamicFields()]);
    toast({ title: "Subcategory deleted" });
  };

  const createField = async () => {
    if (selectedCategoryId === "all") {
      toast({ title: "Choose a category first", variant: "destructive" });
      return;
    }
    if (!newFieldLabel.trim() || !newFieldTypeId) {
      toast({ title: "Field label and type are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("dynamicFields").insert({
      label: newFieldLabel.trim(),
      uniqueId: newFieldUniqueId.trim() || toCode(newFieldLabel),
      categoryId: selectedCategoryId,
      subcategoryId: newFieldSubcategoryId === "none" ? null : newFieldSubcategoryId,
      fieldTypeId: newFieldTypeId,
      options: parseCsvKeywords(newFieldOptions),
      isRequired: newFieldRequired,
      isActive: true,
      sortOrder: dynamicFields.length + 1,
    });

    if (error) {
      toast({ title: "Failed to create field", description: error.message, variant: "destructive" });
      return;
    }

    setNewFieldLabel("");
    setNewFieldUniqueId("");
    setNewFieldTypeId("");
    setNewFieldOptions("");
    setNewFieldRequired(false);
    setNewFieldSubcategoryId("none");
    await refetchDynamicFields();
    toast({ title: "Custom field added" });
  };

  const updateField = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from("dynamicFields").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Failed to update field", description: error.message, variant: "destructive" });
      return;
    }
    await refetchDynamicFields();
    toast({ title: "Field updated" });
  };

  const deleteField = async (id: string) => {
    const { error } = await supabase.from("dynamicFields").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete field", description: error.message, variant: "destructive" });
      return;
    }
    await refetchDynamicFields();
    toast({ title: "Field deleted" });
  };

  const createSlaRule = async () => {
    if (!newRuleName.trim()) {
      toast({ title: "SLA rule name is required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("slaRules").insert({
      name: newRuleName.trim(),
      priority: newRulePriority,
      resolutionHours: newRuleResolutionHours,
      firstResponseHours: Math.max(1, Math.round(newRuleResolutionHours / 3)),
      escalationHours: Math.max(1, Math.round(newRuleResolutionHours / 2)),
      isActive: true,
    });
    if (error) {
      toast({ title: "Failed to create SLA rule", description: error.message, variant: "destructive" });
      return;
    }
    setNewRuleName("");
    setNewRuleResolutionHours(24);
    await refetchSlaRules();
    toast({ title: "SLA rule created" });
  };

  const updateSlaRule = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from("slaRules").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Failed to update SLA rule", description: error.message, variant: "destructive" });
      return;
    }
    await refetchSlaRules();
    toast({ title: "SLA rule updated" });
  };

  const deleteSlaRule = async (id: string) => {
    const { error } = await supabase.from("slaRules").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete SLA rule", description: error.message, variant: "destructive" });
      return;
    }
    await refetchSlaRules();
    toast({ title: "SLA rule deleted" });
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      toast({ title: "Team name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("teams").insert({
      name: newTeamName.trim(),
      departmentId: newTeamDepartmentId === "none" ? null : newTeamDepartmentId,
      leadUserId: newTeamLeadUserId === "none" ? null : newTeamLeadUserId,
      isActive: true,
    });

    if (error) {
      toast({ title: "Failed to create team", description: error.message, variant: "destructive" });
      return;
    }

    setNewTeamName("");
    setNewTeamDepartmentId("none");
    setNewTeamLeadUserId("none");
    await refetchTeams();
    toast({ title: "Team created" });
  };

  const updateTeam = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from("teams").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Failed to update team", description: error.message, variant: "destructive" });
      return;
    }
    await refetchTeams();
    toast({ title: "Team updated" });
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete team", description: error.message, variant: "destructive" });
      return;
    }
    await refetchTeams();
    toast({ title: "Team deleted" });
  };

  const saveHierarchy = async () => {
    try {
      const parsed = JSON.parse(hierarchyDraft);
      if (hierarchyRule?.id) {
        const { error } = await supabase
          .from("workflowRules")
          .update({ actions: { hierarchy: parsed } })
          .eq("id", hierarchyRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("workflowRules").insert({
          name: "Team Hierarchy",
          description: "Global team composition and escalation hierarchy",
          triggerEvent: "team_hierarchy",
          runOrder: 0,
          isActive: true,
          conditions: {},
          actions: { hierarchy: parsed },
        });
        if (error) throw error;
      }
      toast({ title: "Team hierarchy saved" });
      queryClient.invalidateQueries({ queryKey: ["settings-team-hierarchy"] });
    } catch (error: any) {
      toast({
        title: "Invalid hierarchy JSON",
        description: error?.message || "Please provide valid JSON",
        variant: "destructive",
      });
    }
  };

  const saveIntegrations = (nextConfig: AppConfig) => {
    saveAppConfigMutation.mutate(nextConfig);
  };

  const createWebhookRule = async () => {
    if (!newWebhookName.trim()) {
      toast({ title: "Webhook name is required", variant: "destructive" });
      return;
    }

    try {
      await apiRequest("POST", "/api/integrations/webhooks", {
        name: newWebhookName.trim(),
        defaultPriority: newWebhookPriority,
        defaultCategoryId: newWebhookCategoryId === "none" ? null : newWebhookCategoryId,
        defaultStudioId: newWebhookStudioId === "none" ? null : newWebhookStudioId,
        processAutomatically: newWebhookAutoProcess,
      });
      setNewWebhookName("");
      setNewWebhookPriority("medium");
      setNewWebhookCategoryId("none");
      setNewWebhookStudioId("none");
      setNewWebhookAutoProcess(true);
      await refetchAppConfig();
      toast({ title: "Webhook rule created" });
    } catch (error: any) {
      toast({
        title: "Failed to create webhook rule",
        description: error?.message || "Please retry",
        variant: "destructive",
      });
    }
  };

  const updateWebhookRule = async (id: string, updates: Record<string, any>) => {
    try {
      await apiRequest("PATCH", `/api/integrations/webhooks/${id}`, updates);
      await refetchAppConfig();
      toast({ title: "Webhook rule updated" });
    } catch (error: any) {
      toast({
        title: "Failed to update webhook rule",
        description: error?.message || "Please retry",
        variant: "destructive",
      });
    }
  };

  const deleteWebhookRule = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/integrations/webhooks/${id}`);
      await refetchAppConfig();
      toast({ title: "Webhook rule deleted" });
    } catch (error: any) {
      toast({
        title: "Failed to delete webhook rule",
        description: error?.message || "Please retry",
        variant: "destructive",
      });
    }
  };

  const addGmailAccount = () => {
    const email = newGmailAccountEmail.trim();
    if (!email) return;
    const nextConfig: AppConfig = {
      ...appConfig,
      integrations: {
        ...appConfig.integrations,
        gmail: {
          ...appConfig.integrations.gmail,
          connectedAccounts: [
            ...appConfig.integrations.gmail.connectedAccounts,
            {
              id: crypto.randomUUID(),
              email,
              connectedAt: new Date().toISOString(),
            },
          ],
        },
      },
    };
    setNewGmailAccountEmail("");
    saveIntegrations(nextConfig);
  };

  const removeGmailAccount = (id: string) => {
    const nextConfig: AppConfig = {
      ...appConfig,
      integrations: {
        ...appConfig.integrations,
        gmail: {
          ...appConfig.integrations.gmail,
          connectedAccounts: appConfig.integrations.gmail.connectedAccounts.filter((account) => account.id !== id),
        },
      },
    };
    saveIntegrations(nextConfig);
  };

  const addGmailRule = () => {
    if (!newGmailRuleName.trim()) {
      toast({ title: "Gmail automation rule name is required", variant: "destructive" });
      return;
    }
    const nextConfig: AppConfig = {
      ...appConfig,
      integrations: {
        ...appConfig.integrations,
        gmail: {
          ...appConfig.integrations.gmail,
          rules: [
            ...appConfig.integrations.gmail.rules,
            {
              id: crypto.randomUUID(),
              name: newGmailRuleName.trim(),
              matchKeywords: parseCsvKeywords(newGmailRuleKeywords),
              categoryId: newGmailRuleCategoryId === "none" ? null : newGmailRuleCategoryId,
              subcategoryId: newGmailRuleSubcategoryId === "none" ? null : newGmailRuleSubcategoryId,
              priority: newGmailRulePriority,
              autoProcess: newGmailRuleAutoProcess,
            },
          ],
        },
      },
    };

    setNewGmailRuleName("");
    setNewGmailRuleKeywords("");
    setNewGmailRuleCategoryId("none");
    setNewGmailRuleSubcategoryId("none");
    setNewGmailRulePriority("medium");
    setNewGmailRuleAutoProcess(true);
    saveIntegrations(nextConfig);
  };

  const deleteGmailRule = (id: string) => {
    const nextConfig: AppConfig = {
      ...appConfig,
      integrations: {
        ...appConfig.integrations,
        gmail: {
          ...appConfig.integrations.gmail,
          rules: appConfig.integrations.gmail.rules.filter((rule) => rule.id !== id),
        },
      },
    };
    saveIntegrations(nextConfig);
  };

  const handleGmailImportFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error("File must contain an array of message objects");
      }
      const response = await apiRequest("POST", "/api/integrations/gmail/import", {
        messages: parsed,
      });
      const payload = await response.json();
      setGmailImportResult(`Imported ${payload.importedCount || 0} messages into tickets.`);
      toast({ title: "Gmail historical import completed" });
    } catch (error: any) {
      setGmailImportResult("");
      toast({
        title: "Failed to import Gmail history",
        description: error?.message || "Invalid file format",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Global Settings Console</h1>
            <p className="text-sm text-muted-foreground">
              Configure platform-wide taxonomy, workflow rules, integrations, and UI behavior
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={refreshAll} className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Alert className="border-primary/30 bg-primary/5">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertDescription>
          Changes made here are applied globally and synced to Supabase-backed entities.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 h-auto p-1">
          <TabsTrigger value="interface" className="gap-2"><Palette className="h-4 w-4" />Interface</TabsTrigger>
          <TabsTrigger value="taxonomy" className="gap-2"><Layers className="h-4 w-4" />Categories</TabsTrigger>
          <TabsTrigger value="fields" className="gap-2"><ListTree className="h-4 w-4" />Custom Fields</TabsTrigger>
          <TabsTrigger value="sla" className="gap-2"><Workflow className="h-4 w-4" />SLA Rules</TabsTrigger>
          <TabsTrigger value="teams" className="gap-2"><Users className="h-4 w-4" />Teams</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Plug className="h-4 w-4" />Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="interface" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Global Interface Preferences</CardTitle>
              <CardDescription>
                These settings are applied across the entire application interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={uiPreferences.theme}
                    onValueChange={(value: any) => setUiPreferences((prev) => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">Compact Mode</p>
                    <p className="text-xs text-muted-foreground">Reduce spacing in layout blocks</p>
                  </div>
                  <Switch
                    checked={uiPreferences.compactMode}
                    onCheckedChange={(checked) =>
                      setUiPreferences((prev) => ({ ...prev, compactMode: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">Enable Animations</p>
                    <p className="text-xs text-muted-foreground">Controls motion system-wide</p>
                  </div>
                  <Switch
                    checked={uiPreferences.animationsEnabled}
                    onCheckedChange={(checked) =>
                      setUiPreferences((prev) => ({ ...prev, animationsEnabled: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUiPreferences(defaultUiPreferences);
                    saveUiPreferences(defaultUiPreferences);
                    applyUiPreferences(defaultUiPreferences);
                    setTheme(defaultUiPreferences.theme);
                  }}
                >
                  Reset
                </Button>
                <Button onClick={saveUi} className="rounded-xl">
                  <Save className="h-4 w-4 mr-2" />
                  Apply Globally
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Settings Backend Sync</CardTitle>
              <CardDescription>
                Persist UI defaults in backend app config as a global baseline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Default Compact Mode</p>
                  <p className="text-xs text-muted-foreground">Used for global defaults and onboarding</p>
                </div>
                <Switch
                  checked={appConfig.ui.compactMode}
                  onCheckedChange={(checked) =>
                    saveIntegrations({
                      ...appConfig,
                      ui: { ...appConfig.ui, compactMode: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Default Animations Enabled</p>
                  <p className="text-xs text-muted-foreground">Global animation baseline for the workspace</p>
                </div>
                <Switch
                  checked={appConfig.ui.animationsEnabled}
                  onCheckedChange={(checked) =>
                    saveIntegrations({
                      ...appConfig,
                      ui: { ...appConfig.ui, animationsEnabled: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxonomy" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Add, update, and remove categories that drive routing and classification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="New category" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                <Input placeholder="Code (optional)" value={newCategoryCode} onChange={(e) => setNewCategoryCode(e.target.value)} />
                <div className="md:col-span-2">
                  <Button onClick={createCategory} className="w-full rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {categories.map((category: any) => (
                  <div key={category.id} className="rounded-xl border p-3">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                      <Input
                        defaultValue={category.name}
                        onBlur={(e) => {
                          if (e.target.value !== category.name) {
                            updateCategory(category.id, { name: e.target.value.trim() });
                          }
                        }}
                      />
                      <Input
                        defaultValue={category.code}
                        onBlur={(e) => {
                          if (e.target.value !== category.code) {
                            updateCategory(category.id, { code: e.target.value.trim() || toCode(category.name) });
                          }
                        }}
                      />
                      <Select
                        defaultValue={category.defaultPriority || "medium"}
                        onValueChange={(value) => updateCategory(category.id, { defaultPriority: value })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">low</SelectItem>
                          <SelectItem value="medium">medium</SelectItem>
                          <SelectItem value="high">high</SelectItem>
                          <SelectItem value="critical">critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        defaultValue={category.slaHours || 24}
                        onBlur={(e) => updateCategory(category.id, { slaHours: Number(e.target.value || 24) })}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive !== false}
                          onCheckedChange={(checked) => updateCategory(category.id, { isActive: checked })}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Subcategory Management</CardTitle>
              <CardDescription>
                Maintain subcategories by parent category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="New subcategory" value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)} />
                <Input placeholder="Code (optional)" value={newSubcategoryCode} onChange={(e) => setNewSubcategoryCode(e.target.value)} />
                <div className="md:col-span-2">
                  <Button onClick={createSubcategory} className="w-full rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredSubcategories.map((subcategory: any) => (
                  <div key={subcategory.id} className="rounded-xl border p-3">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                      <Input
                        defaultValue={subcategory.name}
                        onBlur={(e) => {
                          if (e.target.value !== subcategory.name) {
                            updateSubcategory(subcategory.id, { name: e.target.value.trim() });
                          }
                        }}
                      />
                      <Input
                        defaultValue={subcategory.code}
                        onBlur={(e) => {
                          if (e.target.value !== subcategory.code) {
                            updateSubcategory(subcategory.id, { code: e.target.value.trim() || toCode(subcategory.name) });
                          }
                        }}
                      />
                      <Select
                        defaultValue={subcategory.defaultPriority || "medium"}
                        onValueChange={(value) => updateSubcategory(subcategory.id, { defaultPriority: value })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">low</SelectItem>
                          <SelectItem value="medium">medium</SelectItem>
                          <SelectItem value="high">high</SelectItem>
                          <SelectItem value="critical">critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        defaultValue={subcategory.slaHours || 24}
                        onBlur={(e) => updateSubcategory(subcategory.id, { slaHours: Number(e.target.value || 24) })}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subcategory.isActive !== false}
                          onCheckedChange={(checked) => updateSubcategory(subcategory.id, { isActive: checked })}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteSubcategory(subcategory.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Custom Field Definitions</CardTitle>
              <CardDescription>
                Define category/subcategory field models used by new ticket flow globally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Field Label" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} />
                <Input placeholder="Unique ID" value={newFieldUniqueId} onChange={(e) => setNewFieldUniqueId(e.target.value)} />
                <Select value={newFieldTypeId || undefined} onValueChange={setNewFieldTypeId}>
                  <SelectTrigger><SelectValue placeholder="Field Type" /></SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newFieldSubcategoryId} onValueChange={setNewFieldSubcategoryId}>
                  <SelectTrigger><SelectValue placeholder="Subcategory" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Category-level</SelectItem>
                    {filteredSubcategories.map((subcategory: any) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>{subcategory.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between gap-3 rounded-xl border px-3">
                  <Label className="mb-0 text-xs">Required</Label>
                  <Switch checked={newFieldRequired} onCheckedChange={setNewFieldRequired} />
                </div>
              </div>

              <Input
                placeholder="Options (comma-separated for dropdown/checkbox groups)"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
              />

              <div className="flex justify-end">
                <Button onClick={createField} className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Field
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                {dynamicFields.map((field: any) => (
                  <div key={field.id} className="rounded-xl border p-3">
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-center">
                      <Input
                        defaultValue={field.label}
                        onBlur={(e) => {
                          if (e.target.value !== field.label) {
                            updateField(field.id, { label: e.target.value.trim() });
                          }
                        }}
                      />
                      <Input
                        defaultValue={field.uniqueId}
                        onBlur={(e) => {
                          if (e.target.value !== field.uniqueId) {
                            updateField(field.id, { uniqueId: e.target.value.trim() });
                          }
                        }}
                      />
                      <Select
                        defaultValue={field.fieldTypeId}
                        onValueChange={(value) => updateField(field.id, { fieldTypeId: value })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        defaultValue={(field.options || []).join(",")}
                        onBlur={(e) => updateField(field.id, { options: parseCsvKeywords(e.target.value) })}
                      />
                      <Input
                        type="number"
                        defaultValue={field.sortOrder || 0}
                        onBlur={(e) => updateField(field.id, { sortOrder: Number(e.target.value || 0) })}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.isRequired === true}
                          onCheckedChange={(checked) => updateField(field.id, { isRequired: checked })}
                        />
                        <span className="text-xs">Required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.isActive !== false}
                          onCheckedChange={(checked) => updateField(field.id, { isActive: checked })}
                        />
                        <span className="text-xs">Active</span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteField(field.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Global SLA Rules</CardTitle>
              <CardDescription>
                Define response and resolution windows used in ticket lifecycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="Rule Name" value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} />
                <Select value={newRulePriority} onValueChange={(value: Priority) => setNewRulePriority(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="critical">critical</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={newRuleResolutionHours}
                  onChange={(e) => setNewRuleResolutionHours(Number(e.target.value || 24))}
                  min={1}
                />
                <Button onClick={createSlaRule} className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              <div className="space-y-3">
                {slaRules.map((rule: any) => (
                  <div key={rule.id} className="rounded-xl border p-3">
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-center">
                      <Input
                        defaultValue={rule.name}
                        onBlur={(e) => {
                          if (e.target.value !== rule.name) {
                            updateSlaRule(rule.id, { name: e.target.value.trim() });
                          }
                        }}
                      />
                      <Select defaultValue={rule.priority || "medium"} onValueChange={(value) => updateSlaRule(rule.id, { priority: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">low</SelectItem>
                          <SelectItem value="medium">medium</SelectItem>
                          <SelectItem value="high">high</SelectItem>
                          <SelectItem value="critical">critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        defaultValue={rule.firstResponseHours || 2}
                        onBlur={(e) => updateSlaRule(rule.id, { firstResponseHours: Number(e.target.value || 2) })}
                      />
                      <Input
                        type="number"
                        defaultValue={rule.resolutionHours || 24}
                        onBlur={(e) => updateSlaRule(rule.id, { resolutionHours: Number(e.target.value || 24) })}
                      />
                      <Input
                        type="number"
                        defaultValue={rule.escalationHours || 12}
                        onBlur={(e) => updateSlaRule(rule.id, { escalationHours: Number(e.target.value || 12) })}
                      />
                      <Badge variant="outline">{rule.categoryId ? "Category scoped" : "Global"}</Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive !== false}
                          onCheckedChange={(checked) => updateSlaRule(rule.id, { isActive: checked })}
                        />
                        <span className="text-xs">Active</span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteSlaRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Team Composition</CardTitle>
              <CardDescription>
                Manage support teams, leads, and departmental mapping.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input placeholder="New team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                <Select value={newTeamDepartmentId} onValueChange={setNewTeamDepartmentId}>
                  <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments.map((department: any) => (
                      <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTeamLeadUserId} onValueChange={setNewTeamLeadUserId}>
                  <SelectTrigger><SelectValue placeholder="Team lead" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Lead</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.displayName || user.email || user.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={createTeam} className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </div>

              <div className="space-y-3">
                {teams.map((team: any) => (
                  <div key={team.id} className="rounded-xl border p-3">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                      <Input
                        defaultValue={team.name}
                        onBlur={(e) => {
                          if (e.target.value !== team.name) {
                            updateTeam(team.id, { name: e.target.value.trim() });
                          }
                        }}
                      />
                      <Select
                        defaultValue={team.departmentId || "none"}
                        onValueChange={(value) => updateTeam(team.id, { departmentId: value === "none" ? null : value })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {departments.map((department: any) => (
                            <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        defaultValue={team.leadUserId || "none"}
                        onValueChange={(value) => updateTeam(team.id, { leadUserId: value === "none" ? null : value })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Lead</SelectItem>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>{user.displayName || user.email || user.id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={team.isActive !== false}
                          onCheckedChange={(checked) => updateTeam(team.id, { isActive: checked })}
                        />
                        <span className="text-xs">Active</span>
                      </div>
                      <Badge variant="outline">Team</Badge>
                      <Button variant="destructive" size="sm" onClick={() => deleteTeam(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Team Hierarchy Definition</CardTitle>
              <CardDescription>
                Configure manager-team hierarchy JSON. Example: {`{"operations":["support","field"]}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                className="min-h-52 font-mono text-xs"
                value={hierarchyDraft}
                onChange={(e) => setHierarchyDraft(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={saveHierarchy} className="rounded-xl">
                  <Save className="h-4 w-4 mr-2" />
                  Save Hierarchy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Mailtrap Notification Automation</CardTitle>
              <CardDescription>
                Configure assignment/status notification automation transport.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  value={appConfig.integrations.mailtrap.fromEmail}
                  onChange={(e) =>
                    saveIntegrations({
                      ...appConfig,
                      integrations: {
                        ...appConfig.integrations,
                        mailtrap: { ...appConfig.integrations.mailtrap, fromEmail: e.target.value },
                      },
                    })
                  }
                />
                <Input
                  value={appConfig.integrations.mailtrap.fromName}
                  onChange={(e) =>
                    saveIntegrations({
                      ...appConfig,
                      integrations: {
                        ...appConfig.integrations,
                        mailtrap: { ...appConfig.integrations.mailtrap, fromName: e.target.value },
                      },
                    })
                  }
                />
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <Label className="mb-0">Enabled</Label>
                  <Switch
                    checked={appConfig.integrations.mailtrap.enabled}
                    onCheckedChange={(checked) =>
                      saveIntegrations({
                        ...appConfig,
                        integrations: {
                          ...appConfig.integrations,
                          mailtrap: { ...appConfig.integrations.mailtrap, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5 text-primary" />Advanced Webhook Ingestion</CardTitle>
              <CardDescription>
                Auto-create tickets from webhook payloads using per-rule mappings and processing mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Webhook ingestion service</p>
                  <p className="text-xs text-muted-foreground">Endpoint: /api/integrations/webhooks/:key</p>
                </div>
                <Switch
                  checked={appConfig.integrations.webhooks.enabled}
                  onCheckedChange={(checked) =>
                    saveIntegrations({
                      ...appConfig,
                      integrations: {
                        ...appConfig.integrations,
                        webhooks: {
                          ...appConfig.integrations.webhooks,
                          enabled: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <Input placeholder="Rule name" value={newWebhookName} onChange={(e) => setNewWebhookName(e.target.value)} />
                <Select value={newWebhookPriority} onValueChange={(value: Priority) => setNewWebhookPriority(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="critical">critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newWebhookCategoryId} onValueChange={setNewWebhookCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Default category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any Category</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newWebhookStudioId} onValueChange={setNewWebhookStudioId}>
                  <SelectTrigger><SelectValue placeholder="Default studio" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any Studio</SelectItem>
                    {studios.map((studio: any) => (
                      <SelectItem key={studio.id} value={studio.id}>{studio.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between rounded-xl border px-3">
                  <Label className="mb-0 text-xs">Auto-process</Label>
                  <Switch checked={newWebhookAutoProcess} onCheckedChange={setNewWebhookAutoProcess} />
                </div>
                <Button onClick={createWebhookRule} className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>

              <div className="space-y-3">
                {appConfig.integrations.webhooks.rules.map((rule) => (
                  <div key={rule.id} className="rounded-xl border p-3">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                      <div>
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">/api/integrations/webhooks/{rule.key}</p>
                      </div>
                      <Badge className="w-fit" variant="outline">{rule.defaultPriority}</Badge>
                      <Badge className="w-fit" variant="secondary">{rule.processAutomatically ? "Auto" : "Manual"}</Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => updateWebhookRule(rule.id, { isActive: checked })}
                        />
                        <span className="text-xs">Active</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateWebhookRule(rule.id, { processAutomatically: !rule.processAutomatically })}
                      >
                        Toggle Process
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/integrations/webhooks/${rule.key}`)}
                      >
                        Copy URL
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteWebhookRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Gmail Ticket Automation</CardTitle>
              <CardDescription>
                Connect mailbox identities, define classification rules, and bulk-import historical messages as tickets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Gmail automation enabled</p>
                  <p className="text-xs text-muted-foreground">Applies rule-based classification and import processing</p>
                </div>
                <Switch
                  checked={appConfig.integrations.gmail.enabled}
                  onCheckedChange={(checked) =>
                    saveIntegrations({
                      ...appConfig,
                      integrations: {
                        ...appConfig.integrations,
                        gmail: {
                          ...appConfig.integrations.gmail,
                          enabled: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Connected Gmail Accounts (metadata)</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="support@company.com"
                    value={newGmailAccountEmail}
                    onChange={(e) => setNewGmailAccountEmail(e.target.value)}
                  />
                  <Button onClick={addGmailAccount} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                  <div className="md:col-span-2 text-xs text-muted-foreground flex items-center">
                    Store mailbox identities used for ingestion workflows.
                  </div>
                </div>
                <div className="space-y-2">
                  {appConfig.integrations.gmail.connectedAccounts.map((account) => (
                    <div key={account.id} className="rounded-lg border p-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{account.email}</p>
                        <p className="text-xs text-muted-foreground">Connected {new Date(account.connectedAt).toLocaleString()}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => removeGmailAccount(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Gmail Classification Rules</Label>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  <Input placeholder="Rule name" value={newGmailRuleName} onChange={(e) => setNewGmailRuleName(e.target.value)} />
                  <Input
                    placeholder="Keywords (comma separated)"
                    value={newGmailRuleKeywords}
                    onChange={(e) => setNewGmailRuleKeywords(e.target.value)}
                  />
                  <Select value={newGmailRuleCategoryId} onValueChange={setNewGmailRuleCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any Category</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newGmailRuleSubcategoryId} onValueChange={setNewGmailRuleSubcategoryId}>
                    <SelectTrigger><SelectValue placeholder="Subcategory" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any Subcategory</SelectItem>
                      {subcategories.map((subcategory: any) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>{subcategory.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newGmailRulePriority} onValueChange={(value: Priority) => setNewGmailRulePriority(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">low</SelectItem>
                      <SelectItem value="medium">medium</SelectItem>
                      <SelectItem value="high">high</SelectItem>
                      <SelectItem value="critical">critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between rounded-xl border px-3">
                    <Label className="mb-0 text-xs">Auto-process</Label>
                    <Switch checked={newGmailRuleAutoProcess} onCheckedChange={setNewGmailRuleAutoProcess} />
                  </div>
                  <Button onClick={addGmailRule} className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-2">
                  {appConfig.integrations.gmail.rules.map((rule) => (
                    <div key={rule.id} className="rounded-lg border p-2 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">Keywords: {rule.matchKeywords.join(", ") || "none"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rule.priority}</Badge>
                        <Badge variant={rule.autoProcess ? "default" : "secondary"}>{rule.autoProcess ? "Auto" : "Manual"}</Badge>
                        <Button variant="destructive" size="sm" onClick={() => deleteGmailRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Import Past Gmail Tickets</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer hover:bg-muted/30")}>
                    <Upload className="h-4 w-4" />
                    Upload JSON Export
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(e) => handleGmailImportFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Expected format: [{`{ id, subject, body, fromEmail, fromName }`}]
                  </span>
                </div>

                {gmailImportResult && (
                  <Alert className="border-emerald-500/40 bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription>{gmailImportResult}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {saveAppConfigMutation.isPending && (
            <Alert className="border-amber-500/40 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription>Saving integration configuration...</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
