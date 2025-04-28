import { AddDependencyCommandHandler, AddDependencyCommandInput } from "./commands/add-dependency";
import {
  ResolveDependencyCommandHandler,
  ResolveDependencyCommandInput,
  ResolveDependencyCommandOutput,
} from "./commands/resolve-dependency";
import { CheckForCyclicDependenciesCommandHandler } from "./commands/check-for-cyclic-dependencies";
import { ResolveSingletonsCommandHandler } from "./commands/resolve-singletons";
import { DependencyResolver } from "./dependency";
import { DependencyStore } from "./dependency";
import { TokenStore, TokenTypeResolver, TokenNameResolver } from "./token";
import { LifecycleEnum } from "./enums";
import { TClassConstructor } from "./types";
import { ExceptionHandler } from "./exceptions";
import { BaseDependencyContainerException } from "./exceptions";

/**
 * Class representing a Dependency Container for managing dependencies.
 */
export class DependencyContainer {
  protected dependencyTokenStore = new TokenStore();
  protected dependencyStore = new DependencyStore();
  protected dependencyResolver = new DependencyResolver(this.dependencyStore);
  protected dependencyTokenType = new TokenTypeResolver();
  protected dependencyTokenName = new TokenNameResolver();
  protected exceptionHandler = new ExceptionHandler(
    this.dependencyTokenStore,
    this.dependencyTokenType,
    this.dependencyTokenName,
  );

  protected addDependencyCommandHandler = new AddDependencyCommandHandler(
    this.dependencyTokenStore,
    this.dependencyStore,
  );
  protected checkForCyclicDependenciesCommandHandler = new CheckForCyclicDependenciesCommandHandler(
    this.dependencyStore,
  );
  protected resolveDependencyCommandHandler = new ResolveDependencyCommandHandler(
    this.dependencyTokenStore,
    this.dependencyResolver,
  );
  protected resolveSingletonsCommandHandler = new ResolveSingletonsCommandHandler(
    this.dependencyStore,
    this.dependencyResolver,
  );

  protected isContainerBuilt = false;
  protected isBuildSingletonsRequired = false;
  protected dependencyContainerToken: unknown = DependencyContainer;

  /**
   * Constructor to initialize the DependencyContainer with optional configurations.
   * @param {Object} [config] - Configuration options for the container.
   */
  constructor(config?: {
    disableDefaultResolveLifecycleStrategies?: boolean;
    disableDefaultTokenTypeCheckers?: boolean;
    disableDefaultTokenNameStrategies?: boolean;
    buildSingletonsRequired?: boolean;
    customDependencyContainerToken?: unknown;
  }) {
    this.loadConfigs(config);
  }

  protected loadConfigs(config?: {
    disableDefaultResolveLifecycleStrategies?: boolean;
    disableDefaultTokenTypeCheckers?: boolean;
    disableDefaultTokenNameStrategies?: boolean;
    buildSingletonsRequired?: boolean;
    customDependencyContainerToken?: unknown;
  }) {
    if (!config?.disableDefaultResolveLifecycleStrategies) {
      this.dependencyResolver.setDefaultResolveLifecycleStrategies();
    }

    if (!config?.disableDefaultTokenTypeCheckers) {
      this.dependencyTokenType.setDefaultTokenTypeCheckers();
    }

    if (!config?.disableDefaultTokenNameStrategies) {
      this.dependencyTokenName.setDefaultTokenNameStrategies();
    }

    if (config?.buildSingletonsRequired !== undefined) {
      this.isBuildSingletonsRequired = config?.buildSingletonsRequired;
    }

    if (config?.customDependencyContainerToken !== undefined) {
      this.dependencyContainerToken = config.customDependencyContainerToken;
    }

    this.addDependency({
      lifecycle: LifecycleEnum.SINGLETON,
      dependencyToken: this.dependencyContainerToken,
      instance: this,
    });
  }

  protected exceptionHandlerWrapper<T>(callback: () => any): T {
    try {
      return callback();
    } catch (err) {
      if (err instanceof BaseDependencyContainerException) {
        throw this.exceptionHandler.handle(err);
      }

      throw err;
    }
  }

  /**
   * Builds all singleton dependencies.
   * @returns {DependencyContainer} The current instance of the container.
   */
  public buildSingletons() {
    this.exceptionHandlerWrapper(() => this.resolveSingletonsCommandHandler.handle());

    this.isContainerBuilt = true;

    return this;
  }

  public checkForCyclicDependencies() {
    this.exceptionHandlerWrapper(() => this.checkForCyclicDependenciesCommandHandler.handle());

    return this;
  }

  protected addDependency<TToken, TInstance = TToken>(config: {
    lifecycle: string;
    dependencyToken?: TToken;
    qualifierToken?: unknown;
    classConstructor?: TClassConstructor;
    builder?: () => TInstance;
    instance?: TInstance;
  }) {
    const dependencyToken = config.dependencyToken || config.classConstructor;

    if (dependencyToken === undefined) {
      throw new Error("Invalid configuration, missing dependency token.");
    }

    const addDependencyCommandInput = new AddDependencyCommandInput(
      dependencyToken,
      config.qualifierToken,
      config.lifecycle,
      config.classConstructor,
      config.builder,
      config.instance,
    );

    this.exceptionHandlerWrapper(() => this.addDependencyCommandHandler.handle(addDependencyCommandInput));
  }

  protected retrieveDependency(config: { dependencyToken?: unknown; qualifierToken?: unknown }) {
    if (config?.dependencyToken === undefined) {
      throw new Error("Missing dependency token.");
    }

    if (this.isContainerBuilt === false && this.isBuildSingletonsRequired === true) {
      throw new Error(
        "Dependency container not initialized. Please call the 'build()' method before attempting to retrieve dependencies.",
      );
    }

    const resolveDependencyCommandInput = new ResolveDependencyCommandInput(
      config.dependencyToken,
      config.qualifierToken,
    );

    const output = this.exceptionHandlerWrapper<ResolveDependencyCommandOutput>(() =>
      this.resolveDependencyCommandHandler.handle(resolveDependencyCommandInput),
    );

    return output.dependencyInstance;
  }

  /**
   * Adds a singleton dependency using a builder function.
   * @param {Object} config - The configuration object.
   * @param {Function} config.builder - The builder function to create the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   */
  public addSingletonBuilder<TToken, TInstance = TToken>(config: { builder: () => TToken }): void;
  public addSingletonBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    builder: () => TInstance;
  }): void;
  public addSingletonBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    builder: () => TInstance;
  }) {
    if (config.builder === undefined) {
      throw new Error("Invalid configuration, missing builder function.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.SINGLETON,
      dependencyToken: config.dependencyToken,
      builder: config.builder,
    });
  }

  /**
   * Adds a mapped singleton dependency using a builder function.
   * @param {Object} config - The configuration object.
   * @param {unknown} config.qualifierToken - The token used to qualify the dependency.
   * @param {Function} config.builder - The builder function to create the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   */
  public addMappedSingletonBuilder<TToken, TInstance = TToken>(config: {
    qualifierToken: unknown;
    builder: () => TToken;
  }): void;
  public addMappedSingletonBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
    builder: () => TInstance;
  }): void;
  public addMappedSingletonBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
    builder: () => TInstance;
  }) {
    if (config.qualifierToken === undefined) {
      throw new Error("Invalid configuration, missing qualifier token.");
    }

    if (config.builder === undefined) {
      throw new Error("Invalid configuration, missing builder function.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.SINGLETON,
      dependencyToken: config.dependencyToken,
      qualifierToken: config.qualifierToken,
      builder: config.builder,
    });
  }

  /**
   * Adds a singleton dependency using an instance.
   * @param {Object} config - The configuration object.
   * @param {TInstance} config.instance - The instance of the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   */
  public addSingletonInstance<TToken, TInstance = TToken>(config: { instance: TToken }): void;
  public addSingletonInstance<TToken, TInstance = TToken>(config: { dependencyToken?: TToken; instance: TToken }): void;
  public addSingletonInstance<TToken, TInstance = TToken>(config: { dependencyToken?: TToken; instance: TInstance }) {
    if (config.instance === undefined) {
      throw new Error("Invalid configuration, missing instance.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.SINGLETON,
      dependencyToken: config.dependencyToken,
      instance: config.instance,
    });
  }

  /**
   * Adds a mapped singleton dependency using an instance.
   * @param {Object} config - The configuration object.
   * @param {unknown} config.qualifierToken - The token used to qualify the dependency.
   * @param {TInstance} config.instance - The instance of the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   */
  public addMappedSingletonInstance<TToken, TInstance = TToken>(config: {
    qualifierToken: unknown;
    instance: TToken;
  }): void;
  public addMappedSingletonInstance<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
    instance: TToken;
  }): void;
  public addMappedSingletonInstance<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
    instance: TInstance;
  }) {
    if (config.qualifierToken === undefined) {
      throw new Error("Invalid configuration, missing qualifier token.");
    }

    if (config.instance === undefined) {
      throw new Error("Invalid configuration, missing instance.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.SINGLETON,
      dependencyToken: config.dependencyToken,
      qualifierToken: config.qualifierToken,
      instance: config.instance,
    });
  }

  /**
   * Adds a singleton dependency using a class constructor.
   * @param {Object} [config] - The configuration object.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   * @param {TClassConstructor} [config.classConstructor] - Optional class constructor for the dependency.
   */
  public addSingleton<TToken, TInstance = TToken>(): void;
  public addSingleton<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }): void;
  public addSingleton<TToken, TInstance = TToken>(config?: {
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }) {
    if (config?.classConstructor === undefined) {
      throw new Error("Invalid configuration, missing class constructor.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.SINGLETON,
      dependencyToken: config.dependencyToken,
      classConstructor: config.classConstructor,
    });
  }

  /**
   * Adds a mapped singleton dependency using a class constructor.
   * @param {Object} config - The configuration object.
   * @param {unknown} config.qualifierToken - The token used to qualify the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   * @param {TClassConstructor} [config.classConstructor] - Optional class constructor for the dependency.
   */
  public addMappedSingleton<TToken, TInstance = TToken>(config: { qualifierToken: unknown }): void;
  public addMappedSingleton<TToken, TInstance = TToken>(config: {
    qualifierToken: unknown;
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }): void;
  public addMappedSingleton<TToken, TInstance = TToken>(config: {
    qualifierToken: unknown;
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }) {
    if (config.qualifierToken === undefined) {
      throw new Error("Invalid configuration, missing qualifier token.");
    }

    if (config.classConstructor === undefined) {
      throw new Error("Invalid configuration, missing class constructor.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.SINGLETON,
      dependencyToken: config.dependencyToken,
      qualifierToken: config.qualifierToken,
      classConstructor: config.classConstructor,
    });
  }

  /**
   * Adds a transient dependency using a builder function.
   * @param {Object} config - The configuration object.
   * @param {Function} config.builder - The builder function to create the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   */
  public addTransientBuilder<TToken, TInstance = TToken>(config: { builder: () => TToken }): void;
  public addTransientBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    builder: () => TInstance;
  }): void;
  public addTransientBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    builder: () => TInstance;
  }) {
    if (config.builder === undefined) {
      throw new Error("Invalid configuration, missing builder function.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.TRANSIENT,
      dependencyToken: config.dependencyToken,
      builder: config.builder,
    });
  }

  /**
   * Adds a mapped transient dependency using a builder function.
   * @param {Object} config - The configuration object.
   * @param {unknown} config.qualifierToken - The token used to qualify the dependency.
   * @param {Function} config.builder - The builder function to create the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   */
  public addMappedTransientBuilder<TToken, TInstance = TToken>(config: {
    qualifierToken: unknown;
    builder: () => TInstance;
  }): void;
  public addMappedTransientBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
    builder: () => TInstance;
  }): void;
  public addMappedTransientBuilder<TToken, TInstance = TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
    builder: () => TInstance;
  }) {
    if (config.qualifierToken === undefined) {
      throw new Error("Invalid configuration, missing qualifier token.");
    }

    if (config.builder === undefined) {
      throw new Error("Invalid configuration, missing builder function.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.TRANSIENT,
      dependencyToken: config.dependencyToken,
      qualifierToken: config.qualifierToken,
      builder: config.builder,
    });
  }

  /**
   * Adds a transient dependency using a class constructor.
   * @param {Object} [config] - The configuration object.
   * @param {TClassConstructor} [config.classConstructor] - The class constructor for the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   */
  public addTransient<TToken, TInstance = TToken>(): void;
  public addTransient<TToken, TInstance = TToken>(config?: {
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }): void;
  public addTransient<TToken, TInstance = TToken>(config?: {
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }) {
    if (config?.classConstructor === undefined) {
      throw new Error("Invalid configuration, missing class constructor.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.TRANSIENT,
      dependencyToken: config.dependencyToken,
      classConstructor: config.classConstructor,
    });
  }

  /**
   * Adds a mapped transient dependency using a class constructor.
   * @param {Object} config - The configuration object.
   * @param {unknown} config.qualifierToken - The token used to qualify the dependency.
   * @param {TToken} [config.dependencyToken] - Optional token for the dependency.
   * @param {TClassConstructor} [config.classConstructor] - Optional class constructor for the dependency.
   */
  public addMappedTransient<TToken, TInstance = TToken>(config: { qualifierToken: unknown }): void;
  public addMappedTransient<TToken, TInstance = TToken>(config: {
    qualifierToken: unknown;
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }): void;
  public addMappedTransient<TToken, TInstance = TToken>(config: {
    qualifierToken: unknown;
    dependencyToken?: TToken extends TClassConstructor ? TToken : unknown;
    classConstructor?: TClassConstructor;
  }) {
    if (config.qualifierToken === undefined) {
      throw new Error("Invalid configuration, missing qualifier token.");
    }

    if (config.classConstructor === undefined) {
      throw new Error("Invalid configuration, missing class constructor.");
    }

    this.addDependency({
      lifecycle: LifecycleEnum.TRANSIENT,
      dependencyToken: config.dependencyToken,
      qualifierToken: config.qualifierToken,
      classConstructor: config.classConstructor,
    });
  }

  /**
   * Retrieves a dependency by its token.
   * @param {Object} [config] - The configuration object.
   * @param {TToken} [config.dependencyToken] - The token of the dependency to retrieve.
   * @returns {TToken} The resolved dependency instance.
   */
  public getDependency<TToken>(): TToken extends new (...args: Array<any>) => infer TReturn
    ? TReturn
    : TToken extends symbol
      ? any
      : TToken;
  public getDependency<TToken>(config?: {
    dependencyToken?: TToken;
  }): TToken extends new (...args: Array<any>) => infer TReturn ? TReturn : TToken extends symbol ? any : TToken;
  public getDependency<TToken>(config?: {
    dependencyToken?: TToken;
  }): TToken extends new (...args: Array<any>) => infer TReturn ? TReturn : TToken extends symbol ? any : TToken {
    return this.retrieveDependency({
      dependencyToken: config?.dependencyToken,
    });
  }

  /**
   * Retrieves a mapped dependency by its token and qualifier.
   * @param {Object} config - The configuration object.
   * @param {unknown} config.qualifierToken - The token used to qualify the dependency.
   * @param {TToken} [config.dependencyToken] - The token of the dependency to retrieve.
   * @returns {TToken} The resolved dependency instance.
   */
  public getMappedDependency<TToken>(config: {
    qualifierToken: unknown;
  }): TToken extends new (...args: Array<any>) => infer TReturn ? TReturn : TToken extends symbol ? any : TToken;
  public getMappedDependency<TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
  }): TToken extends new (...args: Array<any>) => infer TReturn ? TReturn : TToken extends symbol ? any : TToken;
  public getMappedDependency<TToken>(config: {
    dependencyToken?: TToken;
    qualifierToken: unknown;
  }): TToken extends new (...args: Array<any>) => infer TReturn ? TReturn : TToken extends symbol ? any : TToken {
    if (config.dependencyToken === undefined || config.qualifierToken === undefined) {
      throw new Error("Missing dependency or qualifier token.");
    }

    return this.retrieveDependency({
      dependencyToken: config.dependencyToken,
      qualifierToken: config.qualifierToken,
    });
  }

  /**
   * Resets the dependency container to its initial state.
   * Remove all dependencies.
   */
  public reset() {
    this.dependencyTokenStore.reset();
    this.dependencyStore.reset();
    this.isContainerBuilt = false;
  }
}
