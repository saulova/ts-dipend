import { TDependencyId } from "../types";

export class BaseDependencyContainerException extends Error {
  constructor(
    public readonly dependencyIds: Array<TDependencyId>,
    message: string,
  ) {
    super(message);
  }
}
