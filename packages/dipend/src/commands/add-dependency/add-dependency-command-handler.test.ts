import { describe, it, expect, vi, afterEach } from "vitest";
import { AddDependencyCommandHandler } from "./add-dependency-command-handler";
import { AddDependencyCommandInput } from "./add-dependency-command-input";
import { AddDependencyCommandOutput } from "./add-dependency-command-output";
import { DependencyStore, DependencyRegistry, ImplementationDetails } from "../../dependency";
import { TokenStore } from "../../token";
import { MetadataHelper } from "../../helpers";
import { LifecycleEnum } from "../../enums";
import { MappedDependency } from "../../mapped-dependency";

class MockClass1 {}
class MockClass2 {}

describe("AddDependencyCommandHandler", () => {
  const dependencyTokenStoreMock: TokenStore = {
    retrieveOrCreateDependencyIdByTokens: vi.fn(),
  } as any;
  const dependencyStoreMock: DependencyStore = {
    addDependency: vi.fn(),
  } as any;
  const addDependencyCommandHandler: AddDependencyCommandHandler = new AddDependencyCommandHandler(
    dependencyTokenStoreMock,
    dependencyStoreMock,
  );

  afterEach(() => {
    delete (MockClass1 as any)[Symbol.metadata];
    vi.restoreAllMocks();
  });

  describe(".handle", () => {
    it("Should handle with AddDependencyCommandInput and call addDependency on DependencyStore", () => {
      const dependencyToken = "mock-token";
      const dependencyId = "mock-dependency-id";

      const input = new AddDependencyCommandInput(dependencyToken, undefined, LifecycleEnum.SINGLETON, MockClass1);

      vi.spyOn(dependencyTokenStoreMock, "retrieveOrCreateDependencyIdByTokens").mockImplementation((tokens) => {
        if (tokens[0] === dependencyToken && tokens[1] === undefined) {
          return dependencyId;
        }
        throw new Error();
      });

      const implementationDetails = new ImplementationDetails(MockClass1, []);

      const registry = new DependencyRegistry(dependencyId, LifecycleEnum.SINGLETON, implementationDetails);

      const result = addDependencyCommandHandler.handle(input);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenCalledOnce();
      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenCalledWith([
        dependencyToken,
        undefined,
      ]);

      expect(dependencyStoreMock.addDependency).toHaveBeenCalledOnce();
      expect(dependencyStoreMock.addDependency).toHaveBeenCalledWith(registry);

      expect(result).toBeInstanceOf(AddDependencyCommandOutput);
      expect(result.dependencyId).toEqual(dependencyId);
    });

    it("Should resolve MappedDependency constructor dependency token and handle recursively", () => {
      const dependencyToken = MockClass1;

      const parentDependencyId = "parent-id";

      const childToken = MockClass2;
      const childQualifierToken = "child-qualifier";
      const childDependencyId = "child-id";

      const input = new AddDependencyCommandInput(dependencyToken, undefined, LifecycleEnum.SINGLETON, MockClass1);

      MetadataHelper.setConstructorParamsMetadata(MockClass1, [new MappedDependency(childToken, childQualifierToken)]);

      vi.spyOn(dependencyTokenStoreMock, "retrieveOrCreateDependencyIdByTokens").mockImplementation((tokens) => {
        if (tokens[0] === dependencyToken) {
          return parentDependencyId;
        }
        if (tokens[0] === childToken && tokens[1] === childQualifierToken) {
          return childDependencyId;
        }
        throw new Error();
      });

      const implementationDetails = new ImplementationDetails(MockClass1, [childDependencyId]);

      const registry = new DependencyRegistry(parentDependencyId, LifecycleEnum.SINGLETON, implementationDetails);

      const result = addDependencyCommandHandler.handle(input);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenCalledTimes(2);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenNthCalledWith(1, [
        dependencyToken,
        undefined,
      ]);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenNthCalledWith(2, [
        childToken,
        childQualifierToken,
      ]);

      expect(dependencyStoreMock.addDependency).toHaveBeenCalledOnce();
      expect(dependencyStoreMock.addDependency).toHaveBeenCalledWith(registry);

      expect(result).toBeInstanceOf(AddDependencyCommandOutput);
      expect(result.dependencyId).toEqual(parentDependencyId);
    });

    it("Should resolve constructor dependencies tokens and handle recursively", () => {
      const dependencyToken = MockClass1;
      const qualifierToken = undefined;
      const parentDependencyId = "parent-id";

      const childToken = MockClass2;
      const childDependencyId = "child-id";

      const input = new AddDependencyCommandInput(dependencyToken, qualifierToken, LifecycleEnum.SINGLETON, MockClass1);

      MetadataHelper.setConstructorParamsMetadata(MockClass1, [MockClass2]);

      vi.spyOn(dependencyTokenStoreMock, "retrieveOrCreateDependencyIdByTokens").mockImplementation((tokens) => {
        if (tokens[0] === dependencyToken) {
          return parentDependencyId;
        }
        if (tokens[0] === childToken) {
          return childDependencyId;
        }
        throw new Error();
      });

      const implementationDetails = new ImplementationDetails(MockClass1, [childDependencyId]);

      const registry = new DependencyRegistry(parentDependencyId, LifecycleEnum.SINGLETON, implementationDetails);

      const result = addDependencyCommandHandler.handle(input);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenCalledTimes(2);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenNthCalledWith(1, [
        dependencyToken,
        qualifierToken,
      ]);

      expect(dependencyTokenStoreMock.retrieveOrCreateDependencyIdByTokens).toHaveBeenNthCalledWith(2, [childToken]);

      expect(dependencyStoreMock.addDependency).toHaveBeenCalledOnce();
      expect(dependencyStoreMock.addDependency).toHaveBeenCalledWith(registry);

      expect(result).toBeInstanceOf(AddDependencyCommandOutput);
      expect(result.dependencyId).toEqual(parentDependencyId);
    });
  });
});
