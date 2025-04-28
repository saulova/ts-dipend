import { TDependencyId } from "../types";
import { BaseDependencyContainerException } from "./base-dependency-container-exception";

export class CyclicDependenciesException extends BaseDependencyContainerException {
  constructor(dependencyIds: Array<TDependencyId>) {
    super(dependencyIds, "Cyclic dependencies error.");
  }
}
