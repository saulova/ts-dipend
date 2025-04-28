import { describe, it, expect } from "vitest";
import { ClassTokenNameStrategy } from "./class-token-name-strategy";

class MockClass {}
class AnotherMockClass {}

describe("ClassTokenNameStrategy", () => {
  describe(".execute", () => {
    it("Should return the name of the class constructor", () => {
      const strategy = new ClassTokenNameStrategy();

      expect(strategy.execute(MockClass)).toBe("MockClass");
      expect(strategy.execute(AnotherMockClass)).toBe("AnotherMockClass");
    });

    it("Should handle anonymous class constructors correctly", () => {
      const strategy = new ClassTokenNameStrategy();

      const AnonymousClass = class {};

      expect(strategy.execute(AnonymousClass)).toBe("AnonymousClass");
    });
  });
});
