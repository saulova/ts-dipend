import { describe, it, expect } from "vitest";
import { InterfaceSymbolTokenNameStrategy } from "./interface-symbol-token-name-strategy";
import { randomUUID } from "node:crypto";

describe("InterfaceSymbolTokenNameStrategy", () => {
  describe(".execute", () => {
    it("Should extract the correct name from a symbol's description", () => {
      const strategy = new InterfaceSymbolTokenNameStrategy();

      const mockSymbol = Symbol(`DI_InterfaceDependencyName_${randomUUID()}`);

      expect(strategy.execute(mockSymbol)).toBe("InterfaceDependencyName");
    });

    it("Should return 'Unknown Interface Symbol' if description is missing", () => {
      const strategy = new InterfaceSymbolTokenNameStrategy();

      const mockSymbol = Symbol();

      expect(strategy.execute(mockSymbol)).toBe("Unknown Interface Symbol");
    });

    it("Should return 'Unknown Interface Symbol' if description doesn't follow the expected format", () => {
      const strategy = new InterfaceSymbolTokenNameStrategy();

      const mockSymbol = Symbol("DI:InterfaceDependencyName");

      expect(strategy.execute(mockSymbol)).toBe("Unknown Interface Symbol");
    });

    it("Should handle descriptions without a second underscore", () => {
      const strategy = new InterfaceSymbolTokenNameStrategy();

      const mockSymbol = Symbol("DI_InterfaceDependencyName");

      expect(strategy.execute(mockSymbol)).toBe("InterfaceDependencyName");
    });
  });
});
