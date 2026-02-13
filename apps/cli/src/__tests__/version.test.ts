import { describe, it, expect } from "bun:test";
import { versionCommand } from "../commands/version.js";

describe("version command", () => {
  it("should return version information", async () => {
    const mockContext = {
      args: [],
      options: { json: false },
      logger: {
        info: () => {},
        success: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
      config: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
        has: () => false,
      },
    };

    const result = await versionCommand.action(mockContext);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe("object");
  });

  it("should return JSON when requested", async () => {
    const mockContext = {
      args: [],
      options: { json: true },
      logger: {
        info: () => {},
        success: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
      config: {
        get: () => undefined,
        set: () => {},
        delete: () => {},
        has: () => false,
      },
    };

    const result = await versionCommand.action(mockContext);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});