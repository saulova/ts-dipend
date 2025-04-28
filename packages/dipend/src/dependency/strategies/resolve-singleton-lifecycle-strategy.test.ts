import { describe, it, expect, vi, afterEach } from "vitest";
import { ResolveSingletonLifecycleStrategy } from "./resolve-singleton-lifecycle-strategy";
import { CanNotConstructDependencyException } from "../../exceptions";
import { DependencyRegistry, ImplementationDetails } from "..";
import { TDependencyId } from "../../types";
import { LifecycleEnum } from "../../enums";

class MockClass {
  constructor(
    public arg1: string,
    public arg2: string,
  ) {}
}

describe("ResolveSingletonLifecycleStrategy", () => {
  let strategy = new ResolveSingletonLifecycleStrategy();

  const mockClassConstructorSpy = vi.fn((arg1: string, arg2: string) => new MockClass(arg1, arg2));

  const createMockDependencyRegistry = (
    dependencyId: TDependencyId,
    classConstructorDependenciesIds: TDependencyId[] = [],
  ) => {
    const implementationDetails = new ImplementationDetails(mockClassConstructorSpy, classConstructorDependenciesIds);

    return new DependencyRegistry(dependencyId, LifecycleEnum.SINGLETON, implementationDetails);
  };

  afterEach(() => {
    strategy = new ResolveSingletonLifecycleStrategy();
    mockClassConstructorSpy.mockRestore();
  });

  describe(".execute", () => {
    it("Should create and store a singleton instance if it does not exist", () => {
      const dependencyRegistry = createMockDependencyRegistry("mock-dependency-id", ["depId1", "depId2"]);

      const input = {
        dependencyRegistry,
        resolvedClassConstructorDependencies: ["dep1", "dep2"],
      };

      const result = strategy.execute(input);

      expect(result).toBeInstanceOf(MockClass);
      expect(result.arg1).toBe("dep1");
      expect(result.arg2).toBe("dep2");
      expect(dependencyRegistry.implementationDetails.instance).toBe(result);
      expect(mockClassConstructorSpy).toHaveBeenCalledOnce();
    });

    it("Should return the same instance if singletonInstance is already created", () => {
      const input = {
        dependencyRegistry: createMockDependencyRegistry("mock-dependency-id", ["depId1", "depId2"]),
        resolvedClassConstructorDependencies: ["dep1", "dep2"],
      };

      const firstCallResult = strategy.execute(input);

      input.resolvedClassConstructorDependencies[1] = "dep7";

      const secondCallResult = strategy.execute(input);

      expect(secondCallResult).toBe(firstCallResult);
      expect(firstCallResult.arg1).toBe("dep1");
      expect(firstCallResult.arg2).toBe("dep2");
      expect(secondCallResult.arg1).toBe("dep1");
      expect(secondCallResult.arg2).toBe("dep2");
      expect(mockClassConstructorSpy).toHaveBeenCalledOnce();
    });

    it("Should throw CanNotConstructDependencyException if neither builder nor classConstructor is provided", () => {
      const input = {
        dependencyRegistry: new DependencyRegistry(
          "mock-dependency-id",
          LifecycleEnum.SINGLETON,
          new ImplementationDetails(),
        ),
        resolvedClassConstructorDependencies: [],
      };

      expect(() => strategy.execute(input)).toThrowError(CanNotConstructDependencyException);
    });
  });
});
