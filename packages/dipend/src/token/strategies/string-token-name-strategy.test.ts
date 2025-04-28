import { describe, it, expect } from "vitest";
import { StringTokenNameStrategy } from "./string-token-name-strategy";

describe("StringTokenNameStrategy", () => {
  describe(".execute", () => {
    it("Should return the token if it is a non-empty string", () => {
      const strategy = new StringTokenNameStrategy();

      expect(strategy.execute("StringDependencyName")).toBe("StringDependencyName");
    });

    it("Should return 'Empty String' if the token is an empty string", () => {
      const strategy = new StringTokenNameStrategy();

      expect(strategy.execute("")).toBe("Empty String");
    });
  });
});
