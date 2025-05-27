<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h1>Dipend</h1>
  <br/>

[![Issues][issues-shield]][issues-url]
[![Apache-2.0 License][license-shield]][license-url]
[![Contributors][contributors-shield]][contributors-url]

  <p align="center">
    Dipend is a lightweight and flexible dependency injection library, making it easier to manage dependencies in modular applications.
    <br />
    <a href="https://dipend.sauloalvarenga.dev.br"><strong>Explore the docs</strong></a>
  </p>
</div>

<!-- Features -->

## Features

- **Interface-based Dependency Injection**: Use TypeScript interfaces as references for dependencies, ensuring strong type safety.
- **Mapped Dependencies**: Register and resolve multiple implementations of the same interface by key. This allows you to map different behaviors or strategies to specific identifiers and retrieve them dynamically at runtime based on context.
- **Singleton and Transient Support**: Easily configure lifetime scopes for your services.
- **Minimal Setup**: Get started quickly with a simple CLI.
- **Easy to Extend**: Open and flexible architecture.

<p align="right"><a href="#top">(back to top)</a></p>

<!-- Getting Started -->

## Getting Started

### Installation

First, initialize Dipend in your project:

```bash
npx dipend init
```

This command will:

- Add Dipend and [ts-patch][ts-patch-url] to your `package.json`
- Update your `tsconfig.json` with necessary configuration
- Prepare your project for dependency injection

Then install dependencies:

```bash
npm install
```

### Basic Usage

Here’s a simple example to show how Dipend works:

```typescript
import { DependencyContainer } from "dipend";

// Define an interface
interface ILogger {
  info(message: string): void;
}

// Implement the interface
class Logger implements ILogger {
  public info(message: string) {
    console.info(`INFO: ${message}`);
  }
}

// Create a dependent class
class Greeter {
  constructor(private logger: ILogger) {}

  public greet(name: string): string {
    const message = `Hello, ${name}!`;
    this.logger.info(message);
    return message;
  }
}

// Create the container
const dependencyContainer = new DependencyContainer();

// Register dependencies
dependencyContainer.addSingleton<ILogger, Logger>();
dependencyContainer.addTransient<Greeter>();

// Build singletons (optional if you want them ready immediately)
dependencyContainer.buildSingletons();

// Resolve and use a dependency
const greeter = dependencyContainer.getDependency<Greeter>();
const result = greeter.greet("World");
console.log(result);
```

<p align="right"><a href="#top">(back to top)</a></p>

<!-- MORE EXEMPLES -->

## More Examples

Looking for more use cases or advanced configurations?  
Check out the [full documentation][documentation-url].

<p align="right"><a href="#top">(back to top)</a></p>

<!-- WHY DIPEND -->

## Why Dipend?

While many dependency injection libraries exist, **Dipend** is **the only one** (as of now) that fully supports using **interfaces** as references for dependency resolution without needing extra boilerplate or manual token management.

This means you can register and retrieve implementations by their interfaces directly, preserving **clean principles** while keeping your code strongly typed and maintainable.

<p align="right"><a href="#top">(back to top)</a></p>

<!-- CONTRIBUTING -->

## Contributing

Contributions make the open-source community such an amazing place to learn, inspire, and create. We warmly welcome your contributions!

Before contributing, please read the following:

- [CONTRIBUTING GUIDELINES][contributing-guidelines-url]
- [CONTRIBUTOR LICENSE AGREEMENT][cla-url]

If you like the project, don't forget to give it a ⭐️!

<p align="right"><a href="#top">(back to top)</a></p>

<!-- LICENSE -->

## License

Copyright 2025 Saulo V. Alvarenga. All rights reserved.

Licensed under the Apache License, Version 2.0.

See [LICENSE][license-url] for complete license information.

<p align="right"><a href="#top">(back to top)</a></p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/saulova/ts-dipend.svg?style=flat-square
[contributors-url]: https://github.com/saulova/ts-dipend/graphs/contributors
[issues-shield]: https://img.shields.io/github/issues/saulova/ts-dipend.svg?style=flat-square
[issues-url]: https://github.com/saulova/ts-dipend/issues
[license-shield]: https://img.shields.io/github/license/saulova/ts-dipend?style=flat-square
[license-url]: https://github.com/saulova/ts-dipend/blob/main/LICENSE
[contributing-guidelines-url]: https://github.com/saulova/ts-dipend/blob/main/CONTRIBUTING.md
[cla-url]: https://github.com/saulova/ts-dipend/blob/main/CLA.md
[documentation-url]: https://dipend.sauloalvarenga.dev.br
[ts-patch-url]: https://github.com/nonara/ts-patch
