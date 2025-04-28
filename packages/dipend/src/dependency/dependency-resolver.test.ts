import { describe, it, expect, vi, beforeEach } from "vitest";
import { DependencyResolver } from "./dependency-resolver";
import { LifecycleEnum } from "../enums";
import { InvalidLifecycleException } from "../exceptions";

import {
  ResolveSingletonLifecycleStrategy,
  ResolveTransientLifecycleStrategy,
  BaseResolveLifecycleStrategy,
} from "./strategies";

import { DependencyRegistry } from "./dependency-registry";
import { DependencyStore } from "./dependency-store";
import { ImplementationDetails } from "./implementation-details";
import { afterEach } from "node:test";

class MockClass {
  constructor() {}
}

describe("DependencyResolver", () => {
  let dependencyResolver: DependencyResolver;

  const createMockDependencyRegistry = (dependencies: any[] = [], instance?: any) => {
    const implementationDetails = new ImplementationDetails(MockClass, dependencies, undefined, instance);

    return new DependencyRegistry("mock-dependency-id", LifecycleEnum.SINGLETON, implementationDetails);
  };

  const mockDependencyStore: DependencyStore = { getDependency: vi.fn() } as any;

  beforeEach(() => {
    dependencyResolver = new DependencyResolver(mockDependencyStore);
  });

  afterEach(() => vi.restoreAllMocks());

  describe(".setDefaultResolveLifecycleStrategies", () => {
    it("Should set default lifecycle strategies", () => {
      dependencyResolver.setDefaultResolveLifecycleStrategies();

      const singletonStrategy = dependencyResolver["strategies"].get(LifecycleEnum.SINGLETON);
      const transientStrategy = dependencyResolver["strategies"].get(LifecycleEnum.TRANSIENT);

      expect(singletonStrategy).toBeInstanceOf(ResolveSingletonLifecycleStrategy);
      expect(transientStrategy).toBeInstanceOf(ResolveTransientLifecycleStrategy);
    });
  });

  describe(".addResolveLifecycleStrategy", () => {
    it("Should allow adding custom lifecycle strategies", () => {
      const mockStrategy = {
        execute: vi.fn(),
      } as unknown as BaseResolveLifecycleStrategy;

      dependencyResolver.addResolveLifecycleStrategy("CUSTOM", mockStrategy);

      const customStrategy = dependencyResolver["strategies"].get("CUSTOM");

      expect(customStrategy).toBe(mockStrategy);
    });
  });

  describe(".resolve", () => {
    it("Should resolve dependencies using the appropriate lifecycle strategy", () => {
      const mockDependencies = ["dep1", "dep2"];
      const dependencyRegistry = createMockDependencyRegistry(mockDependencies);
      const dependencyDep1Registry = createMockDependencyRegistry([], "dep1");
      const dependencyDep2Registry = createMockDependencyRegistry([], "dep2");
      const dependencyId = "dependencyId";

      const singletonStrategy = new ResolveSingletonLifecycleStrategy();
      const executeSpy = vi.spyOn(singletonStrategy, "execute").mockReturnValue({ instance: "singleton-resolved" });

      (mockDependencyStore.getDependency as any)
        .mockReturnValueOnce(dependencyRegistry)
        .mockReturnValueOnce(dependencyDep1Registry)
        .mockReturnValueOnce(dependencyDep2Registry);

      dependencyResolver.addResolveLifecycleStrategy(LifecycleEnum.SINGLETON, singletonStrategy);

      const result = dependencyResolver.resolve(dependencyId);

      expect(executeSpy).toHaveBeenCalledWith({
        dependencyRegistry: dependencyRegistry,
        resolvedClassConstructorDependencies: mockDependencies,
      });

      expect(result).toEqual({ instance: "singleton-resolved" });
    });

    it("Should throw InvalidLifecycleException for unsupported lifecycles", () => {
      const dependencyId = "dependencyId";

      const mockRegistry = createMockDependencyRegistry();
      (mockRegistry as any)["lifecycle"] = "UNSUPPORTED";

      (mockDependencyStore.getDependency as any).mockReturnValueOnce(mockRegistry);

      expect(() => dependencyResolver.resolve(dependencyId)).toThrowError(InvalidLifecycleException);
    });
  });
});
