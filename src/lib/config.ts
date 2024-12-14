// src/config/loader.ts
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

const SideBarUrlSchema = z.object({
  name: z.string(),
  url: z.string(),
  icon: z.enum(["chart", "url", "terminal", "text"]),
  description: z.string(),
});

const AppConfigSchema = z.object({
  WEBSITE_NAME: z.string(),
  GRAFANA_BASE_URL: z.string(),
  GRAFANA_DASHBOARD_URL_DEPLOYMENT: z.string(),
  GRAFANA_DASHBOARD_URL_NAMESPACE: z.string(),
  LABEL_SELECTOR: z.string(),
  SIDEBAR_URLS: z.array(SideBarUrlSchema),
  SPECIAL_NAMESPACES: z.array(z.string()),
});

type AppConfig = z.infer<typeof AppConfigSchema>;
type SideBarUrl = z.infer<typeof SideBarUrlSchema>;

let config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (config !== null) {
    return config;
  }

  try {
    const configPath = path.join(process.cwd(), "config.yaml");
    const configFile = fs.readFileSync(configPath, "utf-8");
    const parsedConfig = yaml.load(configFile);
    config = AppConfigSchema.parse(parsedConfig);
    console.log("Configuration loaded successfully");
    return config;
  } catch (error) {
    console.error("Error loading configuration:", error);
    throw error;
  }
}

// Export types and schemas
export type { AppConfig, SideBarUrl };
export { AppConfigSchema, SideBarUrlSchema };
