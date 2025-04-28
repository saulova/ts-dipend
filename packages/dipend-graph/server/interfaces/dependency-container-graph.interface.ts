export interface IDependencyContainerGraph {
  dependencyTokenStore: { getTokens: (dependencyId: string) => Array<unknown> };
  dependencyTokenType: { getTokenType: (token: unknown) => string };
  dependencyTokenName: { getTokenName: (token: unknown, tokenType: string) => string };
  dependencyStore: {
    dependencies: Map<string, any>;
    getSortedDependenciesIds: () => Array<string>;
    initializeGraphAndDegrees: () => {
      graph: Map<string, Array<string>>;
      inputDegree: Map<string, number>;
    };
  };
}
