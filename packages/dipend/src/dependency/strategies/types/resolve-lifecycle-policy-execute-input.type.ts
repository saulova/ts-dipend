import { DependencyRegistry } from "../..";

export type TResolveLifecycleStrategyExecuteInput = {
  dependencyRegistry: DependencyRegistry;
  resolvedClassConstructorDependencies: Array<any>;
};
