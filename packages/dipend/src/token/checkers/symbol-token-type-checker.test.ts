import { describe, it, expect, afterEach } from "vitest";
import { SymbolTokenTypeChecker } from "./symbol-token-type-checker";

describe("SymbolTokenTypeChecker", () => {
  let symbolTokenTypeChecker: SymbolTokenTypeChecker = new SymbolTokenTypeChecker();

  afterEach(() => {
    symbolTokenTypeChecker = new SymbolTokenTypeChecker();
  });

  describe(".execute", () => {
    it("Should return true for a symbol with an valid description format", () => {
      const invalidSymbol = Symbol("NotMatchingPattern");

      const result = symbolTokenTypeChecker.execute(invalidSymbol);

      expect(result).toBe(true);
    });

    it("Should return true for a symbol without any description", () => {
      const symbolWithoutDescription = Symbol();

      const result = symbolTokenTypeChecker.execute(symbolWithoutDescription);

      expect(result).toBe(true);
    });

    it("Should return false for a symbol with an interface description format", () => {
      const validSymbol = Symbol("DI_SomePattern_AnotherPattern");

      const result = symbolTokenTypeChecker.execute(validSymbol);

      expect(result).toBe(false);
    });

    it("Should return false for a non-symbol value", () => {
      const notSymbol = 42;

      const result = symbolTokenTypeChecker.execute(notSymbol);

      expect(result).toBe(false);
    });

    it("Should return false for an object instead of symbol", () => {
      const obj = {};

      const result = symbolTokenTypeChecker.execute(obj);

      expect(result).toBe(false);
    });

    it("Should return false for a string", () => {
      const notSymbol = "DI_SomePattern_AnotherPattern";

      const result = symbolTokenTypeChecker.execute(notSymbol);

      expect(result).toBe(false);
    });

    it("Should return false for undefined", () => {
      const result = symbolTokenTypeChecker.execute(undefined);

      expect(result).toBe(false);
    });

    it("Should return false for null", () => {
      const result = symbolTokenTypeChecker.execute(null);

      expect(result).toBe(false);
    });
  });
});
