import { describe, it, expect, beforeEach } from "vitest";
import { TokenStore } from "./token-store";
import { MissingDependencyTokenException } from "../exceptions";

class MockClass {}

describe("TokenStore", () => {
  let tokenStore: TokenStore;

  beforeEach(() => {
    tokenStore = new TokenStore();
  });

  describe(".retrieveOrCreateDependencyIdByTokens", () => {
    it("Should create a new dependency ID for a single token", () => {
      const token = MockClass;
      const dependencyId = tokenStore.retrieveOrCreateDependencyIdByTokens([token]);

      expect(dependencyId).toMatch(/[\w-]+/);
    });

    it("Should return the same dependency ID for the same token", () => {
      const token = MockClass;
      const dependencyId1 = tokenStore.retrieveOrCreateDependencyIdByTokens([token]);
      const dependencyId2 = tokenStore.retrieveOrCreateDependencyIdByTokens([token]);

      expect(dependencyId1).toBe(dependencyId2);
    });

    it("Should create a composed dependency ID for a token and a qualifier token", () => {
      const token = MockClass;
      const qualifierToken = "qualifier1";

      const dependencyId = tokenStore.retrieveOrCreateDependencyIdByTokens([token, qualifierToken]);

      expect(dependencyId).toMatch(/[\w-]+_[\w-]+/);
    });
  });

  describe(".getTokensDescription", () => {
    it("Should retrieve tokens for a valid dependency ID", () => {
      const token = MockClass;
      const qualifierToken = "qualifier1";

      const dependencyId = tokenStore.retrieveOrCreateDependencyIdByTokens([token, qualifierToken]);

      const result = tokenStore.getTokens(dependencyId);

      expect(result[0]).toBe(MockClass);
      expect(result[1]).toBe("qualifier1");
    });

    it("Should throw an error if the dependency token is missing", () => {
      const invalidDependencyId = "unknown_id";

      expect(() => {
        tokenStore.getTokens(invalidDependencyId);
      }).toThrow(MissingDependencyTokenException);
    });

    it("Should return only dependency token", () => {
      const tokens = [MockClass, undefined];

      const dependencyId = tokenStore.retrieveOrCreateDependencyIdByTokens(tokens);

      const result = tokenStore.getTokens(dependencyId);

      expect(result[0]).toBe(MockClass);
      expect(result.length).toBe(1);
    });
  });

  describe(".reset", () => {
    it("Should reset token store", () => {
      const tokens = [MockClass, undefined];

      const dependencyId = tokenStore.retrieveOrCreateDependencyIdByTokens(tokens);

      const result1 = tokenStore.getTokens(dependencyId);

      expect(result1[0]).toBe(MockClass);
      expect(result1.length).toBe(1);

      tokenStore.reset();

      expect(() => {
        tokenStore.getTokens(dependencyId);
      }).toThrow(MissingDependencyTokenException);
    });
  });
});
