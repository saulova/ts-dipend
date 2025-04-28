import { IDependencyContainerGraph } from "../interfaces";

export class GraphDataHandler {
  constructor(private dependencyContainer: IDependencyContainerGraph) {}

  private getNodeName(dependencyId: string) {
    const tokens = this.dependencyContainer.dependencyTokenStore.getTokens(dependencyId);

    const tokenNames = tokens.map((token: unknown) => {
      const tokenType = this.dependencyContainer.dependencyTokenType.getTokenType(token);
      return this.dependencyContainer.dependencyTokenName.getTokenName(token, tokenType);
    });

    return tokenNames.join(":");
  }

  private getNodeType(dependencyId: string) {
    const dependencyRegistry = (this.dependencyContainer as any).dependencyStore.dependencies.get(dependencyId);

    return dependencyRegistry.lifecycle.charAt(0).toUpperCase() + dependencyRegistry.lifecycle.slice(1).toLowerCase();
  }

  private getNode(dependencyId: string) {
    return {
      node: this.getNodeName(dependencyId),
      type: this.getNodeType(dependencyId),
    };
  }

  private getTypes() {
    return [
      { type: "Singleton", color: "#03C800" },
      { type: "Transient", color: "#FF5733" },
    ];
  }

  private getDependencyGraphData() {
    const dependencyIds = this.dependencyContainer.dependencyStore.getSortedDependenciesIds();
    const graphAndDegrees = this.dependencyContainer.dependencyStore.initializeGraphAndDegrees();

    const nodes = dependencyIds.map((dependencyId: string) => this.getNode(dependencyId));

    const links: Array<Record<string, string>> = [];

    for (const [source, targets] of graphAndDegrees.graph.entries()) {
      (targets as Array<string>).forEach((target: any) => {
        links.push({
          source: this.getNodeName(source),
          target: this.getNodeName(target),
        });
      });
    }

    return { nodes, links, types: this.getTypes() };
  }

  handle() {
    return this.getDependencyGraphData();
  }
}
