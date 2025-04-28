import { DependencyStore, DependencyRegistry, ImplementationDetails } from "../../dependency";
import { TokenStore } from "../../token";
import { MetadataHelper } from "../../helpers";
import { MappedDependency } from "../../mapped-dependency";
import { IHandler } from "../../seedwork";
import { AddDependencyCommandInput } from "./add-dependency-command-input";
import { AddDependencyCommandOutput } from "./add-dependency-command-output";

export class AddDependencyCommandHandler implements IHandler<AddDependencyCommandInput, AddDependencyCommandOutput> {
  constructor(
    private dependencyTokenStore: TokenStore,
    private dependencyStore: DependencyStore,
  ) {}

  public handle(input: AddDependencyCommandInput): AddDependencyCommandOutput {
    const dependencyId = this.dependencyTokenStore.retrieveOrCreateDependencyIdByTokens([
      input.dependencyToken,
      input.qualifierToken,
    ]);

    let classConstructorDependenciesTokens: Array<unknown> = [];

    if (input.classConstructor) {
      classConstructorDependenciesTokens = MetadataHelper.getConstructorParamsMetadata(input.classConstructor) || [];
    }

    const classConstructorDependenciesIds = classConstructorDependenciesTokens.map(
      (classConstructorDependencyToken) => {
        if (classConstructorDependencyToken instanceof MappedDependency) {
          return this.dependencyTokenStore.retrieveOrCreateDependencyIdByTokens([
            classConstructorDependencyToken.dependencyToken,
            classConstructorDependencyToken.qualifierToken,
          ]);
        }

        return this.dependencyTokenStore.retrieveOrCreateDependencyIdByTokens([classConstructorDependencyToken]);
      },
    );

    const implementationDetails = new ImplementationDetails(
      input.classConstructor,
      classConstructorDependenciesIds,
      input.builder,
      input.instance,
    );

    const registry = new DependencyRegistry(dependencyId, input.lifecycle, implementationDetails);

    this.dependencyStore.addDependency(registry);

    return new AddDependencyCommandOutput(dependencyId);
  }
}
