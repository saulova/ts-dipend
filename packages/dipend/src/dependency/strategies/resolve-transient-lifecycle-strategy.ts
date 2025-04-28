import { BaseResolveLifecycleStrategy } from "./base-resolve-lifecycle-strategy";
import { TResolveLifecycleStrategyExecuteInput } from "./types";

export class ResolveTransientLifecycleStrategy extends BaseResolveLifecycleStrategy {
  public execute(input: TResolveLifecycleStrategyExecuteInput) {
    return this.construct(input);
  }
}
