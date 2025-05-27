import { LifecycleEnum } from "../enums";
import { InvalidLifecycleException } from "../exceptions";

import { ResolveSingletonLifecycleStrategy, ResolveTransientLifecycleStrategy } from "./strategies";
import { BaseResolveLifecycleStrategy } from "./strategies";
import { DependencyRegistry } from "./dependency-registry";
import { DependencyStore } from "./dependency-store";
import { TDependencyId } from "types";

export class DependencyResolver {
  private strategies: Map<string, BaseResolveLifecycleStrategy> = new Map();

  constructor(private dependencyStore: DependencyStore) {}

  public setDefaultResolveLifecycleStrategies() {
    this.strategies.set(LifecycleEnum.SINGLETON, new ResolveSingletonLifecycleStrategy());
    this.strategies.set(LifecycleEnum.TRANSIENT, new ResolveTransientLifecycleStrategy());
  }

  public addResolveLifecycleStrategy(lifecycle: string, strategy: BaseResolveLifecycleStrategy) {
    this.strategies.set(lifecycle, strategy);
  }

  private useLifecycleStrategy(
    dependencyRegistry: DependencyRegistry,
    resolvedClassConstructorDependencies: Array<unknown>,
  ) {
    const strategy = this.strategies.get(dependencyRegistry.lifecycle);

    if (strategy === undefined) {
      throw new InvalidLifecycleException([dependencyRegistry.dependencyId], dependencyRegistry.lifecycle);
    }

    return strategy.execute({
      dependencyRegistry,
      resolvedClassConstructorDependencies,
    });
  }

  private resolvedInstance(dependencyRegistry: DependencyRegistry) {
    return dependencyRegistry.implementationDetails.instance;
  }

  public resolve(dependencyId: TDependencyId): unknown {
    const dependencyRegistry = this.dependencyStore.getDependency(dependencyId);

    const resolvedInstance = this.resolvedInstance(dependencyRegistry);

    if (resolvedInstance !== undefined) {
      return resolvedInstance;
    }

    const classConstructorDependenciesIds = dependencyRegistry.implementationDetails.classConstructorDependenciesIds;

    const resolvedClassConstructorDependencies = classConstructorDependenciesIds.map((constructorDependencyId) =>
      this.resolve(constructorDependencyId),
    );

    return this.useLifecycleStrategy(dependencyRegistry, resolvedClassConstructorDependencies);
  }
}
