import { IHandler } from "../../seedwork";
import { TokenStore } from "../../token";
import { ResolveDependencyCommandInput } from "./resolve-dependency-command-input";
import { ResolveDependencyCommandOutput } from "./resolve-dependency-command-output";
import { DependencyResolver } from "../../dependency";

export class ResolveDependencyCommandHandler
  implements IHandler<ResolveDependencyCommandInput, ResolveDependencyCommandOutput>
{
  constructor(
    private dependencyTokenStore: TokenStore,
    private dependencyResolver: DependencyResolver,
  ) {}

  public handle(input: ResolveDependencyCommandInput): ResolveDependencyCommandOutput {
    const dependencyId = this.dependencyTokenStore.retrieveOrCreateDependencyIdByTokens([
      input.dependencyToken,
      input.qualifierToken,
    ]);

    const dependencyInstance = this.dependencyResolver.resolve(dependencyId);

    const output = new ResolveDependencyCommandOutput(dependencyInstance);

    return output;
  }
}
