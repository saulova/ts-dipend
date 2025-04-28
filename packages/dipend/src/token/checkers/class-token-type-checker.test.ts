import { describe, it, expect, afterEach } from "vitest";
import { ClassTokenTypeChecker } from "./class-token-type-checker";

describe("ClassTokenTypeChecker", () => {
  let classTokenTypeChecker: ClassTokenTypeChecker = new ClassTokenTypeChecker();

  afterEach(() => {
    classTokenTypeChecker = new ClassTokenTypeChecker();
  });

  describe(".execute", () => {
    it("Should return true for a class constructor function", () => {
      class MyClass {}
      const result = classTokenTypeChecker.execute(MyClass);

      expect(result).toBe(true);
    });

    it("Should return false for a regular function", () => {
      const myFunction = () => {};
      const result = classTokenTypeChecker.execute(myFunction);

      expect(result).toBe(false);
    });

    it("Should return false for undefined", () => {
      const result = classTokenTypeChecker.execute(undefined);

      expect(result).toBe(false);
    });

    it("Should return false for null", () => {
      const result = classTokenTypeChecker.execute(null);

      expect(result).toBe(false);
    });

    it("Should return false for an object that is not a function", () => {
      const result = classTokenTypeChecker.execute({});

      expect(result).toBe(false);
    });

    it("Should return false for a primitive value", () => {
      const result = classTokenTypeChecker.execute(42);

      expect(result).toBe(false);
    });

    it("Should return false for an arrow function", () => {
      const arrowFunction = () => {};
      const result = classTokenTypeChecker.execute(arrowFunction);

      expect(result).toBe(false);
    });

    it("Should return true for a class with a constructor", () => {
      class AnotherClass {
        constructor(private value: number) {}
      }
      const result = classTokenTypeChecker.execute(AnotherClass);

      expect(result).toBe(true);
    });
  });
});
