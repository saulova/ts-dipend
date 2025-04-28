import { BaseResolveLifecycleStrategy } from "./base-resolve-lifecycle-strategy";
import { TResolveLifecycleStrategyExecuteInput } from "./types";

export class ResolveSingletonLifecycleStrategy extends BaseResolveLifecycleStrategy {
  public execute(input: TResolveLifecycleStrategyExecuteInput) {
    if (input.dependencyRegistry.implementationDetails.instance === undefined) {
      const instance = this.construct(input);

      input.dependencyRegistry.implementationDetails.instance = instance;
    }

    return input.dependencyRegistry.implementationDetails.instance;
  }
}
