import { describe, it, expect } from "vitest";
import { SymbolTokenNameStrategy } from "./symbol-token-name-strategy";

describe("SymbolTokenNameStrategy", () => {
  describe(".execute", () => {
    it("Should extract the correct name from a symbol's description", () => {
      const strategy = new SymbolTokenNameStrategy();

      const mockSymbol = Symbol(`SymbolDependencyDescription`);

      expect(strategy.execute(mockSymbol)).toBe("SymbolDependencyDescription");
    });

    it("Should return 'Unknown Symbol' if description is missing", () => {
      const strategy = new SymbolTokenNameStrategy();

      const mockSymbol = Symbol();

      expect(strategy.execute(mockSymbol)).toBe("Unknown Symbol");
    });
  });
});
