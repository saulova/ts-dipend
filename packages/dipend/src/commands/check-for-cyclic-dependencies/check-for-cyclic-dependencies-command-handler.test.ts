import { describe, it, expect, vi, afterEach } from "vitest";
import { CheckForCyclicDependenciesCommandHandler } from "./check-for-cyclic-dependencies-command-handler";
import { LifecycleEnum } from "../../enums";
import { DependencyStore, DependencyRegistry, ImplementationDetails } from "../../dependency";
import { DependencyResolver } from "../../dependency";

class MockClass1 {}
class MockClass2 {}

describe("CheckForCyclicDependenciesCommandHandler", () => {
  const dependencyStoreMock: DependencyStore = {
    getSortedDependenciesIds: vi.fn(),
    getDependency: vi.fn(),
  } as any;
  const dependencyResolverMock: DependencyResolver = {
    resolve: vi.fn(),
  } as any;
  const resolveSingletonsCommandHandler: CheckForCyclicDependenciesCommandHandler =
    new CheckForCyclicDependenciesCommandHandler(dependencyStoreMock);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe(".handle", () => {
    it("Should call getSortedDependenciesIds", () => {
      const dependencyIds = ["dep1", "dep2"];

      (dependencyStoreMock.getSortedDependenciesIds as any).mockReturnValue(dependencyIds);

      resolveSingletonsCommandHandler.handle();

      expect(dependencyStoreMock.getSortedDependenciesIds).toHaveBeenCalledOnce();
    });
  });
});
