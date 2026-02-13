import { z } from "zod";

export const configSchema = z.object({
  // CLI configuration
  cli: z.object({
    theme: z.enum(["light", "dark", "auto"]).default("auto"),
    verbose: z.boolean().default(false),
    color: z.boolean().default(true),
  }).default({}),

  // AI configuration
  ai: z.object({
    provider: z.enum(["openai", "custom"]).default("custom"),
    model: z.string().default("gpt-4"),
    baseUrl: z.string().url().default("https://api.xiaomimimo.com/v1"),
    apiKey: z.string().default("sk-cbgdqbg1vl2co94fwpuctfbwl9cc00sagn4mjgxajznbb5c2"),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().positive().default(1000),
  }).default({}),

  // Server configuration
  server: z.object({
    port: z.number().default(3478),
  }).default({}),

  // API configuration (legacy)
  api: z.object({
    baseUrl: z.string().url().default("https://api.example.com"),
    timeout: z.number().positive().default(30000),
    retries: z.number().nonnegative().default(3),
  }).default({}),

  // User preferences
  user: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    preferences: z.record(z.unknown()).default({}),
  }).default({}),

  // Feature flags
  features: z.object({
    experimental: z.boolean().default(false),
    beta: z.boolean().default(false),
  }).default({}),
});

export type ConfigSchema = z.infer<typeof configSchema>;