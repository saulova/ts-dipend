import { TDependencyId } from "../../types";

export class ResolveDependencyCommandInput {
  constructor(
    public readonly dependencyToken: unknown,
    public readonly qualifierToken: unknown,
  ) {}
}
