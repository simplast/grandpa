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
    apiKey: "sk-c6vhtv3mopq8w0fov7ny41wd7i5fu8xc0b73hzxl477qg18o",
    temperature: 0.7,
    maxTokens: 1000,
  },
  server: {
    port: 3478,
  },
  api: {
    baseUrl: "https://api.xiaomimimo.com/v1",
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
    // 优先从环境变量获取
    const envValue = this.getFromEnv(key);
    if (envValue !== undefined) {
      return envValue as ConfigSchema[K];
    }

    // 优先返回硬编码默认值
    return HARDCODED_DEFAULTS[key];
  }

  set<K extends keyof ConfigSchema>(key: K, value: ConfigSchema[K]): void {
    this.store.set(key, value);
  }

  update<K extends keyof ConfigSchema>(
    key: K,
    updater: (value: ConfigSchema[K]) => ConfigSchema[K],
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
    return {
      ...HARDCODED_DEFAULTS,
      ...this.store.store,
    };
  }

  reset(): void {
    this.store.clear();
  }

  path(): string {
    return this.store.path;
  }

  // 从环境变量获取配置
  private getFromEnv<K extends keyof ConfigSchema>(
    key: K,
  ): string | number | boolean | undefined {
    switch (key) {
      case "ai":
        const apiKey =
          process.env.OPENAI_API_KEY || process.env.GRANDPA_API_KEY;
        const baseUrl =
          process.env.OPENAI_BASE_URL || process.env.GRANDPA_BASE_URL;
        const model = process.env.OPENAI_MODEL || process.env.GRANDPA_MODEL;

        if (apiKey || baseUrl || model) {
          return {
            ...HARDCODED_DEFAULTS.ai,
            ...(apiKey && { apiKey }),
            ...(baseUrl && { baseUrl }),
            ...(model && { model }),
          } as ConfigSchema[K];
        }
        return undefined;
      case "server":
        const port = process.env.PORT || process.env.GRANDPA_PORT;
        if (port !== undefined) {
          return {
            ...HARDCODED_DEFAULTS.server,
            port: parseInt(port, 10),
          } as ConfigSchema[K];
        }
        return undefined;
      default:
        return undefined;
    }
  }

  // Environment variable support
  getFromEnvKey(key: string): string | undefined {
    return process.env[key];
  }

  // Override with environment variable
  getWithEnv<K extends keyof ConfigSchema>(
    key: K,
    envKey: string,
  ): ConfigSchema[K] | string {
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      return envValue;
    }
    return this.get(key);
  }
}
