import ts from "typescript";
import path from "node:path";

import { PluginConfig, ProgramTransformerExtras } from "ts-patch";

import { getPatchedHost } from "./get-patched-host";

import { AstVisitHandler } from "./ast-visit-handler";
import { BaseTransform } from "./transformation";

export class TransformProgram {
  constructor(private transformers: Array<BaseTransform>) {}

  public getHandler() {
    const transformers = this.transformers;

    return (
      program: ts.Program,
      host: ts.CompilerHost | undefined,
      config: PluginConfig,
      { ts: tsInstance }: ProgramTransformerExtras,
    ): ts.Program => {
      const compilerOptions = program.getCompilerOptions();
      const compilerHost = getPatchedHost(host, tsInstance, compilerOptions);
      const rootFileNames: string[] = program.getRootFileNames().map(path.normalize);

      const sourceFiles = [...program.getSourceFiles()];

      const astHandlers = transformers.map((transform) => new AstVisitHandler(tsInstance, program, transform));

      let transformedSourceFileResult = sourceFiles;

      astHandlers.forEach((astHandler) => {
        const transformedSourceFile = tsInstance.transform(
          transformedSourceFileResult,
          [(context) => astHandler.handle(context)],
          compilerOptions,
        ).transformed;

        if (transformedSourceFile && transformedSourceFile.length > 0) {
          transformedSourceFileResult = transformedSourceFile;
        }
      });

      const { printFile } = tsInstance.createPrinter();

      for (const sourceFile of transformedSourceFileResult) {
        const { fileName, languageVersion } = sourceFile;

        const fileVersion = (sourceFile as any).version;

        const updatedSourceFile = tsInstance.createSourceFile(fileName, printFile(sourceFile), languageVersion);

        (updatedSourceFile as any).version = fileVersion;

        compilerHost.fileCache.set(fileName, updatedSourceFile);
      }

      return tsInstance.createProgram(rootFileNames, compilerOptions, compilerHost);
    };
  }
}
