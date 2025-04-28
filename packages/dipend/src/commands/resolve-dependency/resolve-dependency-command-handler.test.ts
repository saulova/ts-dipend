import { describe, it, expect, vi, afterEach } from "vitest";
import { ResolveDependencyCommandHandler } from "./resolve-dependency-command-handler";
import { DependencyResolver } from "../../dependency";
import { ResolveDependencyCommandInput } from "./resolve-dependency-command-input";
import { ResolveDependencyCommandOutput } from "./resolve-dependency-command-output";
import { DependencyStore } from "../../dependency";
import { TokenStore } from "../../token";

class MockClass {}

describe("ResolveDependencyCommandHandler", () => {
  const dependencyTokenStoreMock: TokenStore = {
    retrieveOrCreateDependencyIdByTokens: vi.fn(),
  } as any;
  const dependencyResolverMock: DependencyResolver = {
    resolve: vi.fn(),
  } as any;

  const resolveDependencyCommandHandler: ResolveDependencyCommandHandler = new ResolveDependencyCommandHandler(
    dependencyTokenStoreMock,
    dependencyResolverMock,
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe(".handle", () => {
    it("Should resolve a dependency and return the ResolveDependencyCommandOutput", () => {
      const dependencyToken = "mock-token";
      const qualifierToken = "mock-qualifier";
      const dependencyId = "mock-dependency-id";

      const input = new ResolveDependencyCommandInput(dependencyToken, qualifierToken);

      vi.spyOn(dependencyTokenStoreMock, "retrieveOrCreateDependencyIdByTokens").mockReturnValue(dependencyId);
      vi.spyOn(dependencyResolverMock, "resolve").mockReturnValue({
        instance: "mockResolvedInstance",
      });

      const result = resolveDependencyCommandHandler.handle(input);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenCalledOnce();
      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenCalledWith([
        dependencyToken,
        qualifierToken,
      ]);
      expect(dependencyResolverMock.resolve).toHaveBeenCalledOnce();
      expect(dependencyResolverMock.resolve).toHaveBeenCalledWith(dependencyId);
      expect(result).toBeInstanceOf(ResolveDependencyCommandOutput);
      expect(result.dependencyInstance).toEqual({
        instance: "mockResolvedInstance",
      });
    });
  });
});
