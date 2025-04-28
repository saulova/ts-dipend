import { IHandler } from "../../seedwork";
import { DependencyStore } from "../../dependency";

export class CheckForCyclicDependenciesCommandHandler implements IHandler<undefined, void> {
  constructor(private dependencyStore: DependencyStore) {}

  public handle() {
    this.dependencyStore.getSortedDependenciesIds();
  }
}
