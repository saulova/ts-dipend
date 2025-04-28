import { TDependencyId } from "../types";
import { BaseDependencyContainerException } from "./base-dependency-container-exception";

export class CanNotConstructDependencyException extends BaseDependencyContainerException {
  constructor(dependencyIds: Array<TDependencyId>) {
    super(dependencyIds, "Can not construct dependency.");
  }
}
