import ts from "typescript";
import path from "node:path";

/**
 * Patches existing Compiler Host (or creates new one) to allow feeding updated file content from cache
 * Found At: https://github.com/nonara/ts-patch/discussions/29
 */
export function getPatchedHost(
  maybeHost: ts.CompilerHost | undefined,
  tsInstance: typeof ts,
  compilerOptions: ts.CompilerOptions,
): ts.CompilerHost & { fileCache: Map<string, ts.SourceFile> } {
  const fileCache = new Map();

  const compilerHost = maybeHost ?? tsInstance.createCompilerHost(compilerOptions, true);

  const originalGetSourceFile = compilerHost.getSourceFile;

  return Object.assign(compilerHost, {
    getSourceFile(fileName: string, languageVersion: ts.ScriptTarget) {
      fileName = path.normalize(fileName);

      if (fileCache.has(fileName)) return fileCache.get(fileName);

      const sourceFile = originalGetSourceFile.apply(void 0, Array.from(arguments) as any);

      fileCache.set(fileName, sourceFile);

      return sourceFile;
    },
    fileCache,
  });
}
