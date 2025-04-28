import { TClassConstructor, TDependencyId } from "../../types";

export class AddDependencyCommandInput {
  constructor(
    public readonly dependencyToken: unknown,
    public readonly qualifierToken: unknown,
    public readonly lifecycle: string,
    public readonly classConstructor?: TClassConstructor,
    public readonly builder?: () => any,
    public readonly instance?: any,
  ) {}
}
