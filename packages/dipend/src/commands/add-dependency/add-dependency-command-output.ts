import { TDependencyId } from "../../types";

export class AddDependencyCommandOutput {
  constructor(public readonly dependencyId: TDependencyId) {}
}
