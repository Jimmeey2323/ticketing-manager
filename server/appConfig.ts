import fs from "fs/promises";
import path from "path";

export interface WebhookRule {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  defaultStudioId: string | null;
  defaultCategoryId: string | null;
  defaultPriority: "low" | "medium" | "high" | "critical";
  processAutomatically: boolean;
}

export interface GmailRule {
  id: string;
  name: string;
  matchKeywords: string[];
  categoryId: string | null;
  subcategoryId: string | null;
  priority: "low" | "medium" | "high" | "critical";
  autoProcess: boolean;
}

export interface AppUiSettings {
  compactMode: boolean;
  animationsEnabled: boolean;
}

export interface AppConfig {
  ui: AppUiSettings;
  integrations: {
    mailtrap: {
      enabled: boolean;
      fromEmail: string;
      fromName: string;
    };
    webhooks: {
      enabled: boolean;
      rules: WebhookRule[];
    };
    gmail: {
      enabled: boolean;
      connectedAccounts: Array<{
        id: string;
        email: string;
        connectedAt: string;
      }>;
      rules: GmailRule[];
    };
  };
}

const dataDir = path.resolve(process.cwd(), "server", "data");
const configFile = path.resolve(dataDir, "app-config.json");

const defaultConfig: AppConfig = {
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

async function ensureFileExists() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(configFile);
  } catch {
    await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2), "utf8");
  }
}

export async function readAppConfig(): Promise<AppConfig> {
  await ensureFileExists();
  const raw = await fs.readFile(configFile, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      ...defaultConfig,
      ...parsed,
      ui: {
        ...defaultConfig.ui,
        ...(parsed.ui || {}),
      },
      integrations: {
        ...defaultConfig.integrations,
        ...(parsed.integrations || {}),
        mailtrap: {
          ...defaultConfig.integrations.mailtrap,
          ...(parsed.integrations?.mailtrap || {}),
        },
        webhooks: {
          ...defaultConfig.integrations.webhooks,
          ...(parsed.integrations?.webhooks || {}),
          rules: parsed.integrations?.webhooks?.rules || [],
        },
        gmail: {
          ...defaultConfig.integrations.gmail,
          ...(parsed.integrations?.gmail || {}),
          connectedAccounts: parsed.integrations?.gmail?.connectedAccounts || [],
          rules: parsed.integrations?.gmail?.rules || [],
        },
      },
    };
  } catch {
    return defaultConfig;
  }
}

export async function writeAppConfig(config: AppConfig): Promise<void> {
  await ensureFileExists();
  await fs.writeFile(configFile, JSON.stringify(config, null, 2), "utf8");
}

