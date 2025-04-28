import ts from "typescript";

import { BaseTransform } from "./transformation";

export class AstVisitHandler {
  constructor(
    private tsInstance: typeof ts,
    private program: ts.Program,
    private transform: BaseTransform,
  ) {}

  public handle(context: ts.TransformationContext) {
    const tsInstance = this.tsInstance;
    const transform = this.transform;

    return (sourceFile: ts.SourceFile) => {
      const typeChecker = this.program.getTypeChecker();
      const { factory } = context;

      transform.setTsFactory(factory);
      transform.setTsInstance(tsInstance);
      transform.setTypeChecker(typeChecker);

      function visit(node: ts.Node): ts.Node {
        const result = transform.execute(node);

        if (result) return result;

        return tsInstance.visitEachChild(node, visit, context);
      }

      return tsInstance.visitEachChild(sourceFile, visit, context);
    };
  }
}
