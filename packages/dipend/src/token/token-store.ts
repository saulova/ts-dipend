import { TDependencyId } from "../types";
import { MissingDependencyTokenException } from "../exceptions";
import { TokenRegistry } from "./token-registry";

export class TokenStore {
  private tokens: Map<unknown, TokenRegistry> = new Map();

  private createTokenRegistry(token: unknown) {
    const tokenRegistry = new TokenRegistry(token);

    this.tokens.set(token, tokenRegistry);

    return tokenRegistry;
  }

  public retrieveOrCreateDependencyIdByTokens(tokens: Array<unknown>) {
    const tokenRegistryIds: Array<string> = [];

    tokens.forEach((token) => {
      if (token === undefined) return;

      const tokenRegistry = this.tokens.get(token);

      if (tokenRegistry !== undefined) {
        tokenRegistryIds.push(tokenRegistry.id);
        return;
      }

      tokenRegistryIds.push(this.createTokenRegistry(token).id);
    });

    return tokenRegistryIds.join("_");
  }

  public getTokens(dependencyId: TDependencyId): Array<unknown> {
    const tokensIds = dependencyId.split("_");

    const tokens: Array<unknown> = [];

    tokensIds.forEach((tokenId) => {
      for (const registry of this.tokens.values()) {
        if (registry.id === tokenId) {
          tokens.push(registry.token);

          return;
        }
      }
    });

    if (tokens.length === 0) {
      throw new MissingDependencyTokenException([dependencyId]);
    }

    return tokens;
  }

  public reset() {
    this.tokens.clear();
  }
}
