import { TDependencyId } from "../types";
import { DependencyRegistry } from "./dependency-registry";
import { CyclicDependenciesException, MissingDependencyException } from "../exceptions";

export class DependencyStore {
  private dependencies: Map<TDependencyId, DependencyRegistry> = new Map();
  private sortedDependenciesIdsCacheInvalidated = false;
  private sortedDependenciesIds: Array<TDependencyId> = [];

  public addDependency(registry: DependencyRegistry): void {
    this.sortedDependenciesIdsCacheInvalidated = true;
    this.dependencies.set(registry.dependencyId, registry);
  }

  public getDependency(dependencyId: TDependencyId): DependencyRegistry {
    const registry = this.dependencies.get(dependencyId);

    if (registry === undefined) {
      throw new MissingDependencyException([dependencyId]);
    }

    return registry;
  }

  public reset() {
    this.dependencies.clear();
  }

  private initializeGraphAndDegrees(): {
    graph: Map<TDependencyId, Array<TDependencyId>>;
    inputDegree: Map<TDependencyId, number>;
  } {
    const graph = new Map<TDependencyId, Array<TDependencyId>>();
    const inputDegree = new Map<TDependencyId, number>();

    this.dependencies.forEach((dependencyRegistry, dependencyId) => {
      inputDegree.set(dependencyId, inputDegree.get(dependencyId) ?? 0);

      dependencyRegistry.implementationDetails.classConstructorDependenciesIds.forEach(
        (classConstructorDependencyId) => {
          inputDegree.set(classConstructorDependencyId, (inputDegree.get(classConstructorDependencyId) ?? 0) + 1);

          if (!graph.has(dependencyId)) {
            graph.set(dependencyId, []);
          }

          graph.get(dependencyId)!.push(classConstructorDependencyId);
        },
      );
    });

    return { graph, inputDegree };
  }

  private performTopologicalSort(
    graph: Map<TDependencyId, Array<TDependencyId>>,
    inputDegree: Map<TDependencyId, number>,
  ): Array<TDependencyId> {
    const queue: Array<TDependencyId> = [];

    inputDegree.forEach((degree, dependencyId) => {
      if (degree === 0) {
        queue.push(dependencyId);
      }
    });

    const sortedList: Array<TDependencyId> = [];

    while (queue.length > 0) {
      const currentItem = queue.shift()!;
      sortedList.push(currentItem);

      if (!graph.has(currentItem)) {
        continue;
      }

      graph.get(currentItem)!.forEach((dependent) => {
        inputDegree.set(dependent, inputDegree.get(dependent)! - 1);

        if (inputDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      });
    }

    return sortedList;
  }

  private detectAndThrowCyclicDependencies(
    graph: Map<TDependencyId, Array<TDependencyId>>,
    inputDegree: Map<TDependencyId, number>,
  ): void {
    const unresolved = Array.from(inputDegree.keys()).filter(
      (dependencyId) => inputDegree.get(dependencyId)! > 0 && graph.get(dependencyId),
    );

    if (unresolved.length > 0) {
      throw new CyclicDependenciesException(unresolved);
    }
  }

  public getSortedDependenciesIds(): Array<TDependencyId> {
    if (this.sortedDependenciesIdsCacheInvalidated) {
      const { graph, inputDegree } = this.initializeGraphAndDegrees();
      const sortedList = this.performTopologicalSort(graph, inputDegree);

      if (sortedList.length !== this.dependencies.size) {
        this.detectAndThrowCyclicDependencies(graph, inputDegree);
      }

      this.sortedDependenciesIds = sortedList.reverse();
      this.sortedDependenciesIdsCacheInvalidated = false;

      return this.sortedDependenciesIds;
    }

    return this.sortedDependenciesIds;
  }
}
