import { describe, it, expect, vi, afterEach } from "vitest";
import { ResolveSingletonsCommandHandler } from "./resolve-singletons-command-handler";
import { LifecycleEnum } from "../../enums";
import { DependencyStore, DependencyRegistry, ImplementationDetails } from "../../dependency";
import { DependencyResolver } from "../../dependency";

class MockClass1 {}
class MockClass2 {}

describe("ResolveSingletonsCommandHandler", () => {
  const dependencyStoreMock: DependencyStore = {
    getSortedDependenciesIds: vi.fn(),
    getDependency: vi.fn(),
  } as any;
  const dependencyResolverMock: DependencyResolver = {
    resolve: vi.fn(),
  } as any;
  const resolveSingletonsCommandHandler: ResolveSingletonsCommandHandler = new ResolveSingletonsCommandHandler(
    dependencyStoreMock,
    dependencyResolverMock,
  );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe(".handle", () => {
    it("Should resolve all SINGLETON dependencies", () => {
      const dependencyIds = ["dep1", "dep2"];
      const dependencyId1 = "dep1";
      const dependencyId2 = "dep2";

      const implementationDetails1 = new ImplementationDetails(MockClass1, []);
      const implementationDetails2 = new ImplementationDetails(MockClass2, []);

      const dependency1 = new DependencyRegistry(dependencyId1, LifecycleEnum.SINGLETON, implementationDetails1);
      const dependency2 = new DependencyRegistry(dependencyId2, LifecycleEnum.SINGLETON, implementationDetails2);

      (dependencyStoreMock.getSortedDependenciesIds as any).mockReturnValue(dependencyIds);

      (dependencyStoreMock.getDependency as any).mockImplementation((id: string) => {
        return id === dependencyId1 ? dependency1 : dependency2;
      });

      resolveSingletonsCommandHandler.handle();

      expect(dependencyStoreMock.getSortedDependenciesIds).toHaveBeenCalledOnce();
      expect(dependencyStoreMock.getDependency).toHaveBeenCalledTimes(2);
      expect(dependencyStoreMock.getDependency).toHaveBeenCalledWith(dependencyId1);
      expect(dependencyStoreMock.getDependency).toHaveBeenCalledWith(dependencyId2);
      expect(dependencyResolverMock.resolve).toHaveBeenCalledTimes(2);
      expect(dependencyResolverMock.resolve).toHaveBeenCalledWith(dependencyId1);
      expect(dependencyResolverMock.resolve).toHaveBeenCalledWith(dependencyId2);
    });

    it("Should skip dependencies with non-SINGLETON lifecycle", () => {
      const dependencyIds = ["dep1", "dep2"];
      const dependencyId1 = "dep1";
      const dependencyId2 = "dep2";

      const implementationDetails1 = new ImplementationDetails(MockClass1, []);
      const implementationDetails2 = new ImplementationDetails(MockClass2, []);

      const dependency1 = new DependencyRegistry(dependencyId1, LifecycleEnum.SINGLETON, implementationDetails1);
      const dependency2 = new DependencyRegistry(dependencyId2, LifecycleEnum.TRANSIENT, implementationDetails2);

      (dependencyStoreMock.getSortedDependenciesIds as any).mockReturnValue(dependencyIds);

      (dependencyStoreMock.getDependency as any).mockImplementation((id: string) => {
        return id === dependencyId1 ? dependency1 : dependency2;
      });

      (dependencyResolverMock.resolve as any).mockImplementation((dependencyRegistry: any) => {
        return dependencyRegistry.dependencyId === dependencyId1 ? "instance1" : "instance2";
      });

      resolveSingletonsCommandHandler.handle();

      expect(dependencyStoreMock.getSortedDependenciesIds).toHaveBeenCalledOnce();
      expect(dependencyStoreMock.getDependency).toHaveBeenCalledTimes(2);
      expect(dependencyStoreMock.getDependency).toHaveBeenNthCalledWith(1, dependencyId1);
      expect(dependencyStoreMock.getDependency).toHaveBeenNthCalledWith(2, dependencyId2);
      expect(dependencyResolverMock.resolve).toHaveBeenCalledTimes(1);
      expect(dependencyResolverMock.resolve).toHaveBeenCalledWith(dependencyId1);
    });

    it("Should resolve all singleton dependencies", () => {
      const dependencyIds = ["dep2", "dep1"];
      const parentDependencyId = "dep1";
      const childDependencyId = "dep2";

      const parentImplementationDetails = new ImplementationDetails(MockClass2, [childDependencyId]);

      const childImplementationDetails = new ImplementationDetails(MockClass1, []);

      const parentDependency = new DependencyRegistry(
        parentDependencyId,
        LifecycleEnum.SINGLETON,
        parentImplementationDetails,
      );

      const childDependency = new DependencyRegistry(
        childDependencyId,
        LifecycleEnum.SINGLETON,
        childImplementationDetails,
      );

      (dependencyStoreMock.getSortedDependenciesIds as any).mockReturnValue(dependencyIds);

      (dependencyStoreMock.getDependency as any).mockImplementation((id: string) => {
        if (id === parentDependencyId) return parentDependency;
        if (id === childDependencyId) return childDependency;
        throw new Error();
      });

      (dependencyResolverMock.resolve as any).mockImplementation((dependencyRegistry: any) => {
        return dependencyRegistry.dependencyId === childDependencyId ? "child-instance" : "parent-instance";
      });

      resolveSingletonsCommandHandler.handle();

      expect(dependencyStoreMock.getSortedDependenciesIds).toHaveBeenCalledOnce();
      expect(dependencyStoreMock.getDependency).toHaveBeenCalledTimes(2);
      expect(dependencyStoreMock.getDependency).toHaveBeenNthCalledWith(1, childDependencyId);
      expect(dependencyStoreMock.getDependency).toHaveBeenNthCalledWith(2, parentDependencyId);
      expect(dependencyResolverMock.resolve).toHaveBeenCalledTimes(2);
      expect(dependencyResolverMock.resolve).toHaveBeenNthCalledWith(1, childDependencyId);
      expect(dependencyResolverMock.resolve).toHaveBeenNthCalledWith(2, parentDependencyId);
    });
  });
});
