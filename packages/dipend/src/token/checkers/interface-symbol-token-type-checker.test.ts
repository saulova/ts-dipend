import { describe, it, expect, afterEach } from "vitest";
import { InterfaceSymbolTokenTypeChecker } from "./interface-symbol-token-type-checker";

describe("InterfaceSymbolTokenTypeChecker", () => {
  let interfaceSymbolTokenTypeChecker: InterfaceSymbolTokenTypeChecker = new InterfaceSymbolTokenTypeChecker();

  afterEach(() => {
    interfaceSymbolTokenTypeChecker = new InterfaceSymbolTokenTypeChecker();
  });

  describe(".execute", () => {
    it("Should return true for a symbol with an interface description format", () => {
      const validSymbol = Symbol("DI_SomePattern_AnotherPattern");

      const result = interfaceSymbolTokenTypeChecker.execute(validSymbol);

      expect(result).toBe(true);
    });

    it("Should return false for a symbol without the interface description format", () => {
      const invalidSymbol = Symbol("NotMatchingPattern");

      const result = interfaceSymbolTokenTypeChecker.execute(invalidSymbol);

      expect(result).toBe(false);
    });

    it("Should return false for a symbol without any description", () => {
      const symbolWithoutDescription = Symbol();

      const result = interfaceSymbolTokenTypeChecker.execute(symbolWithoutDescription);

      expect(result).toBe(false);
    });

    it("Should return false for a non-symbol value", () => {
      const notSymbol = 42;

      const result = interfaceSymbolTokenTypeChecker.execute(notSymbol);

      expect(result).toBe(false);
    });

    it("Should return false for an object instead of symbol", () => {
      const obj = {};

      const result = interfaceSymbolTokenTypeChecker.execute(obj);

      expect(result).toBe(false);
    });

    it("Should return false for a string", () => {
      const notSymbol = "DI_SomePattern_AnotherPattern";

      const result = interfaceSymbolTokenTypeChecker.execute(notSymbol);

      expect(result).toBe(false);
    });

    it("Should return false for undefined", () => {
      const result = interfaceSymbolTokenTypeChecker.execute(undefined);

      expect(result).toBe(false);
    });

    it("Should return false for null", () => {
      const result = interfaceSymbolTokenTypeChecker.execute(null);

      expect(result).toBe(false);
    });
  });
});
