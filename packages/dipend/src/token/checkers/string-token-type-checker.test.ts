import { describe, it, expect, afterEach } from "vitest";
import { StringTokenTypeChecker } from "./string-token-type-checker";

describe("StringTokenTypeChecker", () => {
  let stringTokenTypeChecker: StringTokenTypeChecker = new StringTokenTypeChecker();

  afterEach(() => {
    stringTokenTypeChecker = new StringTokenTypeChecker();
  });

  describe(".execute", () => {
    it("Should return true for a string", () => {
      const result = stringTokenTypeChecker.execute("some string");

      expect(result).toBe(true);
    });

    it("Should return false for a number", () => {
      const result = stringTokenTypeChecker.execute(123);

      expect(result).toBe(false);
    });

    it("Should return false for a boolean", () => {
      const result = stringTokenTypeChecker.execute(true);

      expect(result).toBe(false);
    });

    it("Should return false for an object", () => {
      const result = stringTokenTypeChecker.execute({});

      expect(result).toBe(false);
    });

    it("Should return false for an array", () => {
      const result = stringTokenTypeChecker.execute(["item1", "item2"]);

      expect(result).toBe(false);
    });

    it("Should return false for a symbol", () => {
      const result = stringTokenTypeChecker.execute(Symbol("DI_SomePattern"));

      expect(result).toBe(false);
    });

    it("Should return false for null", () => {
      const result = stringTokenTypeChecker.execute(null);

      expect(result).toBe(false);
    });

    it("Should return false for undefined", () => {
      const result = stringTokenTypeChecker.execute(undefined);

      expect(result).toBe(false);
    });
  });
});
