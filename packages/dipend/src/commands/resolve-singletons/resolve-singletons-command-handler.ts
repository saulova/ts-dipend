import { IHandler } from "../../seedwork";
import { DependencyStore } from "../../dependency";
import { DependencyResolver } from "../../dependency";

import { LifecycleEnum } from "../../enums";

export class ResolveSingletonsCommandHandler implements IHandler<undefined, void> {
  constructor(
    private dependencyStore: DependencyStore,
    private dependencyResolver: DependencyResolver,
  ) {}

  public handle() {
    const sortedDependencies = this.dependencyStore.getSortedDependenciesIds();

    sortedDependencies.forEach((dependencyId) => {
      const dependencyRegistry = this.dependencyStore.getDependency(dependencyId);

      if (dependencyRegistry.lifecycle === LifecycleEnum.SINGLETON) {
        this.dependencyResolver.resolve(dependencyId);
      }
    });
  }
}
