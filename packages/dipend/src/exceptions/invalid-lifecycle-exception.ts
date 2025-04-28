import { TDependencyId } from "../types";
import { BaseDependencyContainerException } from "./base-dependency-container-exception";

export class InvalidLifecycleException extends BaseDependencyContainerException {
  constructor(dependencyIds: Array<TDependencyId>, lifecyclePolicy: string) {
    super(dependencyIds, `Invalid lifecycle: ${lifecyclePolicy}`);
  }
}
