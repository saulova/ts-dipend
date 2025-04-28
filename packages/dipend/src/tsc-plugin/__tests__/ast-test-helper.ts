import * as ts from "typescript";

export class ASTTestHelper {
  public static parseClassDeclarationsFromSource(source: string, tsInstance: typeof ts): Array<ts.ClassDeclaration> {
    const sourceFile = ts.createSourceFile(
      "fake.ts",
      source,
      tsInstance.ScriptTarget.Latest,
      true,
      tsInstance.ScriptKind.TS,
    );

    const classDeclarations: Array<ts.ClassDeclaration> = [];

    tsInstance.forEachChild(sourceFile, (node) => {
      if (tsInstance.isClassDeclaration(node)) {
        classDeclarations.push(node);
      }
    });

    return classDeclarations;
  }

  public static parseInterfaceDeclarationsFromSource(
    source: string,
    tsInstance: typeof ts,
  ): Array<ts.InterfaceDeclaration> {
    const sourceFile = ts.createSourceFile(
      "fake.ts",
      source,
      tsInstance.ScriptTarget.Latest,
      true,
      tsInstance.ScriptKind.TS,
    );

    const interfaceDeclarations: Array<ts.InterfaceDeclaration> = [];

    tsInstance.forEachChild(sourceFile, (node) => {
      if (tsInstance.isInterfaceDeclaration(node)) {
        interfaceDeclarations.push(node);
      }
    });

    return interfaceDeclarations;
  }
}
