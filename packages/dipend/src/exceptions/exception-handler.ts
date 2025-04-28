import { TokenStore, TokenTypeResolver, TokenNameResolver } from "../token";
import { IHandler } from "../seedwork";
import { TDependencyId } from "../types";
import { BaseDependencyContainerException } from "./base-dependency-container-exception";

export class ExceptionHandler implements IHandler<Error, void> {
  constructor(
    private dependencyTokenStore: TokenStore,
    private dependencyTokenType: TokenTypeResolver,
    private dependencyTokenName: TokenNameResolver,
  ) {}

  private createErrorMessage(tokenName: string, description: string) {
    return `Error: ${description} - Caused by: [${tokenName}]`;
  }

  private getTokenNames(dependencyIds: Array<TDependencyId>) {
    const tokenNames = dependencyIds.map((dependencyId) => {
      try {
        const tokens = this.dependencyTokenStore.getTokens(dependencyId);

        const names = tokens.map((token) => {
          const dependencyTokenType = this.dependencyTokenType.getTokenType(token);

          const dependencyTokenName = this.dependencyTokenName.getTokenName(token, dependencyTokenType);

          return dependencyTokenName;
        });

        return `(${names.join(" - ")})`;
      } catch {
        return `(UNKNOWN DEPENDENCY ID: ${dependencyId})`;
      }
    });

    return tokenNames;
  }

  public handle(input: BaseDependencyContainerException): void {
    const tokenNames = this.getTokenNames(input.dependencyIds);

    const error = new Error(this.createErrorMessage(tokenNames.join(", "), input.message), {
      cause: input.cause,
    });

    error.stack = input.stack;

    throw error;
  }
}
