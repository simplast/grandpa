import Conf from "conf";
import { type ConfigSchema } from "./schema.js";

// 硬编码的默认配置
const HARDCODED_DEFAULTS: ConfigSchema = {
  cli: {
    theme: "auto",
    verbose: false,
    color: true,
  },
  ai: {
    provider: "custom",
    model: "mimo-v2-flash",
    baseUrl: "https://api.xiaomimimo.com/v1",
    apiKey: "sk-cbgdqbg1vl2co94fwpuctfbwl9cc00sagn4mjgxajznbb5c2",
    temperature: 0.7,
    maxTokens: 1000,
  },
  server: {
    port: 3478,
  },
  api: {
    baseUrl: "https://api.xiaomimimo.com/v1/chat/completions",
    timeout: 30000,
    retries: 3,
  },
  user: {
    preferences: {},
  },
  features: {
    experimental: false,
    beta: false,
  },
};

export class ConfigManager {
  private store: Conf<ConfigSchema>;
  private static instance: ConfigManager;

  private constructor(projectName: string = "grandpa-cli") {
    this.store = new Conf<ConfigSchema>({
      projectName,
      defaults: HARDCODED_DEFAULTS,
    });
  }

  static getInstance(projectName?: string): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(projectName);
    }
    return ConfigManager.instance;
  }

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] {
    // Always return hardcoded defaults, ignoring persisted config
    return HARDCODED_DEFAULTS[key];
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.store.set(key, value);
  }

  update<K extends keyof ConfigSchema>(
    key: K,
    updater: (value: ConfigSchema[K]) => ConfigSchema[K]
  ): void {
    const current = this.get(key);
    this.set(key, updater(current));
  }

  delete<K extends keyof ConfigSchema>(key: K): void {
    this.store.delete(key);
  }

  has<K extends keyof ConfigSchema>(key: K): boolean {
    return this.store.has(key);
  }

  get all(): ConfigSchema {
    return HARDCODED_DEFAULTS;
  }

  reset(): void {
    this.store.clear();
  }

  path(): string {
    return this.store.path;
  }

  // Environment variable support
  getFromEnv(key: string): string | undefined {
    return process.env[key];
  }

  // Override with environment variable
  getWithEnv<K extends keyof ConfigSchema>(
    key: K,
    envKey: string
  ): ConfigSchema[K] | string {
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      return envValue;
    }
    return this.get(key);
  }
}
