import { CanNotConstructDependencyException } from "../../exceptions";
import { IStrategy } from "../../seedwork";
import { TResolveLifecycleStrategyExecuteInput } from "./types";

export abstract class BaseResolveLifecycleStrategy implements IStrategy<TResolveLifecycleStrategyExecuteInput, any> {
  protected construct(input: TResolveLifecycleStrategyExecuteInput) {
    if (input.dependencyRegistry.implementationDetails.instance !== undefined) {
      return input.dependencyRegistry.implementationDetails.instance;
    }

    if (input.dependencyRegistry.implementationDetails.builder !== undefined) {
      return input.dependencyRegistry.implementationDetails.builder();
    }

    if (input.dependencyRegistry.implementationDetails.classConstructor === undefined) {
      throw new CanNotConstructDependencyException([input.dependencyRegistry.dependencyId]);
    }

    return Reflect.construct(
      input.dependencyRegistry.implementationDetails.classConstructor,
      input.resolvedClassConstructorDependencies,
    );
  }

  public execute(input: TResolveLifecycleStrategyExecuteInput): any {
    throw new Error("Method not implemented.");
  }
}
