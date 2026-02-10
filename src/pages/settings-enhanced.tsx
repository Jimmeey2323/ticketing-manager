/**
 * Functional Settings System - Persists and applies user preferences
 * Features: Profile management, notification preferences, appearance settings, SLA config
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Check,
  X,
  Loader2,
  AlertCircle,
  Building2,
  Tag,
  Users,
  Clock,
  Mail,
  Smartphone,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Settings State Interface
 */
interface UserSettings {
  id?: string;
  userId: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    team: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    newAssignments: boolean;
    ticketUpdates: boolean;
    slaWarnings: boolean;
    dailyDigest: boolean;
    digestFrequency: "immediate" | "hourly" | "daily" | "weekly";
  };
  appearance: {
    theme: "light" | "dark" | "system";
    compactMode: boolean;
    animationsEnabled: boolean;
    colorScheme: "default" | "cool" | "warm" | "vibrant";
  };
  sla: {
    criticalSlaHours: number;
    highSlaHours: number;
    mediumSlaHours: number;
    lowSlaHours: number;
    enableSlaAlerts: boolean;
    slaAlertThresholdPercentage: number;
  };
  workflow: {
    autoAssignEnabled: boolean;
    autoRoutingEnabled: boolean;
    defaultPriority: string;
    defaultCategory: string;
  };
}

/**
 * API Service for Settings
 */
class SettingsService {
  async fetchSettings(userId: string): Promise<UserSettings> {
    // Simulated API call - replace with actual API
    return new Promise((resolve) => {
      setTimeout(() => {
        const savedSettings = localStorage.getItem(`settings-${userId}`);
        if (savedSettings) {
          resolve(JSON.parse(savedSettings));
        } else {
          resolve(getDefaultSettings(userId));
        }
      }, 500);
    });
  }

  async saveSettings(settings: UserSettings): Promise<UserSettings> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          localStorage.setItem(`settings-${settings.userId}`, JSON.stringify(settings));
          resolve(settings);
        } catch (err) {
          reject(err);
        }
      }, 800);
    });
  }
}

function getDefaultSettings(userId: string): UserSettings {
  return {
    userId,
    profile: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "support",
      team: "general",
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      newAssignments: true,
      ticketUpdates: true,
      slaWarnings: true,
      dailyDigest: false,
      digestFrequency: "daily",
    },
    appearance: {
      theme: "system",
      compactMode: false,
      animationsEnabled: true,
      colorScheme: "default",
    },
    sla: {
      criticalSlaHours: 2,
      highSlaHours: 4,
      mediumSlaHours: 8,
      lowSlaHours: 24,
      enableSlaAlerts: true,
      slaAlertThresholdPercentage: 80,
    },
    workflow: {
      autoAssignEnabled: true,
      autoRoutingEnabled: true,
      defaultPriority: "medium",
      defaultCategory: "general",
    },
  };
}

const settingsService = new SettingsService();

/**
 * Enhanced Settings Page
 */
export default function EnhancedSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);

  const userId = user?.id || "default";

  // Fetch settings
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["user-settings", userId],
    queryFn: () => settingsService.fetchSettings(userId),
    enabled: !!userId,
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (newSettings: UserSettings) => settingsService.saveSettings(newSettings),
    onSuccess: (savedSettings) => {
      setLocalSettings(savedSettings);
      setHasChanges(false);
      queryClient.setQueryData(["user-settings", userId], savedSettings);

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
        variant: "default",
      });

      // Apply theme immediately
      if (savedSettings.appearance.theme !== theme) {
        setTheme(savedSettings.appearance.theme);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize local settings
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  if (isLoading || !localSettings) {
    return <SettingsSkeleton />;
  }

  const handleSettingChange = <T extends keyof UserSettings>(
    section: T,
    field: string,
    value: any
  ) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (localSettings) {
      await saveMutation.mutateAsync(localSettings);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your preferences and configuration
        </p>
      </div>

      {/* Unsaved Changes Alert */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardContent className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-900 dark:text-amber-100">
                    You have unsaved changes
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocalSettings(settings || null);
                      setHasChanges(false);
                    }}
                  >
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="profile" className="flex gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">SLA</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Workflow</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={localSettings.profile.firstName}
                    onChange={(e) => {
                      handleSettingChange("profile", "firstName", e.target.value);
                    }}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={localSettings.profile.lastName}
                    onChange={(e) => {
                      handleSettingChange("profile", "lastName", e.target.value);
                    }}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={localSettings.profile.email}
                  onChange={(e) => {
                    handleSettingChange("profile", "email", e.target.value);
                  }}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={localSettings.profile.phone}
                  onChange={(e) => {
                    handleSettingChange("profile", "phone", e.target.value);
                  }}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={localSettings.profile.role}
                    onValueChange={(value) => {
                      handleSettingChange("profile", "role", value);
                    }}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="support">Support Agent</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select
                    value={localSettings.profile.team}
                    onValueChange={(value) => {
                      handleSettingChange("profile", "team", value);
                    }}
                  >
                    <SelectTrigger id="team">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Support</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="vip">VIP Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="font-semibold">Channels</h3>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.notifications.emailNotifications}
                    onCheckedChange={(checked) => {
                      handleSettingChange("notifications", "emailNotifications", checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-sm">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive browser notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.notifications.pushNotifications}
                    onCheckedChange={(checked) => {
                      handleSettingChange("notifications", "pushNotifications", checked);
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="font-semibold">Notification Types</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">New Assignments</span>
                    <Switch
                      checked={localSettings.notifications.newAssignments}
                      onCheckedChange={(checked) => {
                        handleSettingChange("notifications", "newAssignments", checked);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Ticket Updates</span>
                    <Switch
                      checked={localSettings.notifications.ticketUpdates}
                      onCheckedChange={(checked) => {
                        handleSettingChange("notifications", "ticketUpdates", checked);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">SLA Warnings</span>
                    <Switch
                      checked={localSettings.notifications.slaWarnings}
                      onCheckedChange={(checked) => {
                        handleSettingChange("notifications", "slaWarnings", checked);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Daily Digest</span>
                    <Switch
                      checked={localSettings.notifications.dailyDigest}
                      onCheckedChange={(checked) => {
                        handleSettingChange("notifications", "dailyDigest", checked);
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Digest Frequency */}
              <div className="space-y-2">
                <Label htmlFor="digestFrequency">Digest Frequency</Label>
                <Select
                  value={localSettings.notifications.digestFrequency}
                  onValueChange={(value: any) => {
                    handleSettingChange("notifications", "digestFrequency", value);
                  }}
                >
                  <SelectTrigger id="digestFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Appearance & Theme
              </CardTitle>
              <CardDescription>Customize how the interface looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {["light", "dark", "system"].map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => {
                        handleSettingChange("appearance", "theme", themeOption);
                      }}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-sm font-medium capitalize",
                        localSettings.appearance.theme === themeOption
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      {themeOption === "light" && "☀️"}
                      {themeOption === "dark" && "🌙"}
                      {themeOption === "system" && "💻"}
                      <div className="mt-1">{themeOption}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Color Scheme */}
              <div className="space-y-3">
                <Label htmlFor="colorScheme">Color Scheme</Label>
                <Select
                  value={localSettings.appearance.colorScheme}
                  onValueChange={(value: any) => {
                    handleSettingChange("appearance", "colorScheme", value);
                  }}
                >
                  <SelectTrigger id="colorScheme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="vibrant">Vibrant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* UI Preferences */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">Compact Mode</span>
                  <Switch
                    checked={localSettings.appearance.compactMode}
                    onCheckedChange={(checked) => {
                      handleSettingChange("appearance", "compactMode", checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">Enable Animations</span>
                  <Switch
                    checked={localSettings.appearance.animationsEnabled}
                    onCheckedChange={(checked) => {
                      handleSettingChange("appearance", "animationsEnabled", checked);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Tab */}
        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                SLA Configuration
              </CardTitle>
              <CardDescription>Set service level agreement thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="criticalSla">Critical SLA (hours)</Label>
                  <Input
                    id="criticalSla"
                    type="number"
                    min="1"
                    value={localSettings.sla.criticalSlaHours}
                    onChange={(e) => {
                      handleSettingChange("sla", "criticalSlaHours", parseInt(e.target.value));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highSla">High SLA (hours)</Label>
                  <Input
                    id="highSla"
                    type="number"
                    min="1"
                    value={localSettings.sla.highSlaHours}
                    onChange={(e) => {
                      handleSettingChange("sla", "highSlaHours", parseInt(e.target.value));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediumSla">Medium SLA (hours)</Label>
                  <Input
                    id="mediumSla"
                    type="number"
                    min="1"
                    value={localSettings.sla.mediumSlaHours}
                    onChange={(e) => {
                      handleSettingChange("sla", "mediumSlaHours", parseInt(e.target.value));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowSla">Low SLA (hours)</Label>
                  <Input
                    id="lowSla"
                    type="number"
                    min="1"
                    value={localSettings.sla.lowSlaHours}
                    onChange={(e) => {
                      handleSettingChange("sla", "lowSlaHours", parseInt(e.target.value));
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium">Enable SLA Alerts</span>
                <Switch
                  checked={localSettings.sla.enableSlaAlerts}
                  onCheckedChange={(checked) => {
                    handleSettingChange("sla", "enableSlaAlerts", checked);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={localSettings.sla.slaAlertThresholdPercentage}
                  onChange={(e) => {
                    handleSettingChange(
                      "sla",
                      "slaAlertThresholdPercentage",
                      parseInt(e.target.value)
                    );
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when remaining time is below this percentage
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Workflow Automation
              </CardTitle>
              <CardDescription>Configure automated ticket handling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Auto-assign Tickets</p>
                    <p className="text-xs text-muted-foreground">Automatically assign new tickets to team members</p>
                  </div>
                  <Switch
                    checked={localSettings.workflow.autoAssignEnabled}
                    onCheckedChange={(checked) => {
                      handleSettingChange("workflow", "autoAssignEnabled", checked);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Auto-route Tickets</p>
                    <p className="text-xs text-muted-foreground">Automatically categorize and route tickets</p>
                  </div>
                  <Switch
                    checked={localSettings.workflow.autoRoutingEnabled}
                    onCheckedChange={(checked) => {
                      handleSettingChange("workflow", "autoRoutingEnabled", checked);
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultPriority">Default Priority</Label>
                  <Select
                    value={localSettings.workflow.defaultPriority}
                    onValueChange={(value) => {
                      handleSettingChange("workflow", "defaultPriority", value);
                    }}
                  >
                    <SelectTrigger id="defaultPriority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultCategory">Default Category</Label>
                  <Select
                    value={localSettings.workflow.defaultCategory}
                    onValueChange={(value) => {
                      handleSettingChange("workflow", "defaultCategory", value);
                    }}
                  >
                    <SelectTrigger id="defaultCategory">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (sticky) */}
      <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setLocalSettings(settings || null);
            setHasChanges(false);
          }}
          disabled={!hasChanges || saveMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-gradient-to-r from-primary to-primary/80"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Settings Skeleton Loader
 */
function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export { EnhancedSettings, settingsService, getDefaultSettings };
export type { UserSettings };
