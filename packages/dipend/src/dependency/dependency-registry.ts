import { TDependencyId } from "../types";
import { ImplementationDetails } from "./implementation-details";

export class DependencyRegistry {
  constructor(
    public readonly dependencyId: TDependencyId,
    public readonly lifecycle: string,
    public readonly implementationDetails: ImplementationDetails,
  ) {}
}
