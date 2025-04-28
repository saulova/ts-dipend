import { TClassConstructor, TDependencyId } from "../types";

export class ImplementationDetails {
  constructor(
    public readonly classConstructor?: TClassConstructor,
    public readonly classConstructorDependenciesIds: Array<TDependencyId> = [],
    public readonly builder?: () => any,
    public instance?: any,
  ) {}
}
