import { TDependencyId } from "../types";
import { BaseDependencyContainerException } from "./base-dependency-container-exception";

export class MissingDependencyTokenException extends BaseDependencyContainerException {
  constructor(dependencyIds: Array<TDependencyId>) {
    super(dependencyIds, `Missing dependency token.`);
  }
}
