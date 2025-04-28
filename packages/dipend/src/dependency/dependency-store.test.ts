import { beforeEach, describe, it, expect, vi } from "vitest";

import { LifecycleEnum } from "../enums";
import { TDependencyId } from "../types";
import { DependencyStore } from "./dependency-store";
import { DependencyRegistry } from "./dependency-registry";
import { ImplementationDetails } from "./implementation-details";
import { CyclicDependenciesException, MissingDependencyException } from "../exceptions";

class MockClass {}

const createMockDependencyRegistry = (
  dependencyId: TDependencyId,
  classConstructorDependenciesIds: TDependencyId[] = [],
) => {
  const implementationDetails = new ImplementationDetails(MockClass, classConstructorDependenciesIds);

  return new DependencyRegistry(dependencyId, LifecycleEnum.SINGLETON, implementationDetails);
};

describe("DependencyStore", () => {
  let dependencyStore: DependencyStore;

  beforeEach(() => {
    dependencyStore = new DependencyStore();
  });

  describe(".addDependency", () => {
    it("Should add a dependency to the store", () => {
      const dependencyId = "mock-dependency-id";

      const dependency = createMockDependencyRegistry(dependencyId);

      dependencyStore.addDependency(dependency);

      expect((dependencyStore as any).dependencies.get(dependencyId)).toBe(dependency);
    });

    it("Should allow multiple dependencies to be added", () => {
      const dependencyId1 = "mock-dependency-id-1";
      const dependencyId2 = "mock-dependency-id-2";

      const dependency1 = createMockDependencyRegistry(dependencyId1);
      const dependency2 = createMockDependencyRegistry(dependencyId2);

      dependencyStore.addDependency(dependency1);
      dependencyStore.addDependency(dependency2);

      expect((dependencyStore as any).dependencies.get(dependencyId1)).toBe(dependency1);
      expect((dependencyStore as any).dependencies.get(dependencyId2)).toBe(dependency2);
    });
  });

  describe(".getDependency", () => {
    it("Should retrieve the correct dependency by ID", () => {
      const dependencyId = "mock-dependency-id";

      const dependency = createMockDependencyRegistry(dependencyId);

      dependencyStore.addDependency(dependency);

      const retrievedDependency = dependencyStore.getDependency(dependencyId);

      expect(retrievedDependency).toBe(dependency);
    });

    it("Should throw an error if a dependency is missing", () => {
      const invalidDependencyId = "invalid-id";

      expect(() => {
        dependencyStore.getDependency(invalidDependencyId);
      }).toThrowError(MissingDependencyException);
    });
  });

  describe(".getSortedDependenciesIds", () => {
    it("Should return a topologically sorted list of dependency IDs", () => {
      const dependencyA = createMockDependencyRegistry("A", ["B"]);
      const dependencyB = createMockDependencyRegistry("B", ["C"]);
      const dependencyC = createMockDependencyRegistry("C");

      dependencyStore.addDependency(dependencyA);
      dependencyStore.addDependency(dependencyB);
      dependencyStore.addDependency(dependencyC);

      const sortedIds = dependencyStore.getSortedDependenciesIds();

      expect(sortedIds).toEqual(["C", "B", "A"]);
    });

    it("Should throw a CyclicDependenciesException when a cycle is detected", () => {
      const dependencyA = createMockDependencyRegistry("A", ["B"]);
      const dependencyB = createMockDependencyRegistry("B", ["C"]);
      const dependencyC = createMockDependencyRegistry("C", ["A"]);

      dependencyStore.addDependency(dependencyA);
      dependencyStore.addDependency(dependencyB);
      dependencyStore.addDependency(dependencyC);

      expect(() => dependencyStore.getSortedDependenciesIds()).toThrowError(CyclicDependenciesException);
    });

    it("Should handle independent dependency chains correctly", () => {
      const dependencyA = createMockDependencyRegistry("A", ["B"]);
      const dependencyB = createMockDependencyRegistry("B");
      const dependencyX = createMockDependencyRegistry("X", ["Y"]);
      const dependencyY = createMockDependencyRegistry("Y");

      dependencyStore.addDependency(dependencyA);
      dependencyStore.addDependency(dependencyB);
      dependencyStore.addDependency(dependencyX);
      dependencyStore.addDependency(dependencyY);

      const sortedIds = dependencyStore.getSortedDependenciesIds();

      expect(sortedIds).toEqual(["Y", "B", "X", "A"]);
    });

    it("Should return cached sorted dependencies ids", () => {
      const dependencyA = createMockDependencyRegistry("A", ["B"]);
      const dependencyB = createMockDependencyRegistry("B");
      const dependencyX = createMockDependencyRegistry("X", ["Y"]);
      const dependencyY = createMockDependencyRegistry("Y");

      dependencyStore.addDependency(dependencyA);
      dependencyStore.addDependency(dependencyB);
      dependencyStore.addDependency(dependencyX);
      dependencyStore.addDependency(dependencyY);

      const initializeGraphAndDegreesSpy = vi.spyOn(dependencyStore as any, "initializeGraphAndDegrees");
      const performTopologicalSortSpy = vi.spyOn(dependencyStore as any, "performTopologicalSort");
      const detectAndThrowCyclicDependenciesSpy = vi.spyOn(dependencyStore as any, "detectAndThrowCyclicDependencies");

      const sortedIds = dependencyStore.getSortedDependenciesIds();
      const sortedIds2 = dependencyStore.getSortedDependenciesIds();

      expect(initializeGraphAndDegreesSpy).toHaveBeenCalledOnce();
      expect(performTopologicalSortSpy).toHaveBeenCalledOnce();
      expect(detectAndThrowCyclicDependenciesSpy).not.toHaveBeenCalled();
      expect(sortedIds).toEqual(["Y", "B", "X", "A"]);
      expect(sortedIds2).toEqual(["Y", "B", "X", "A"]);
    });
  });

  describe(".reset", () => {
    it("Should reset dependency store", () => {
      const dependencyId = "mock-dependency-id";

      const dependency = createMockDependencyRegistry(dependencyId);

      dependencyStore.addDependency(dependency);

      const retrievedDependency = dependencyStore.getDependency(dependencyId);

      expect(retrievedDependency).toBe(dependency);

      dependencyStore.reset();

      expect(() => {
        dependencyStore.getDependency(dependencyId);
      }).toThrowError(MissingDependencyException);
    });
  });
});
