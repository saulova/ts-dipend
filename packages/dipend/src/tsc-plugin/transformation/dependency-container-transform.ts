import ts from "typescript";

import { BaseTransform } from "./base-transform";

export class DependencyContainerTransform extends BaseTransform {
  private findMethodName(nodeExpression: ts.PropertyAccessExpression): string | undefined {
    const symbol = this.typeChecker.getSymbolAtLocation(nodeExpression.expression);

    if (!symbol?.valueDeclaration) return undefined;

    const type = this.typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);

    if (this.typeChecker.typeToString(type) !== "DependencyContainer") return undefined;

    const validMethods = new Set([
      "addSingletonBuilder",
      "addMappedSingletonBuilder",
      "addSingletonInstance",
      "addMappedSingletonInstance",
      "addSingleton",
      "addMappedSingleton",
      "addTransientBuilder",
      "addMappedTransientBuilder",
      "addTransient",
      "addMappedTransient",
      "getDependency",
      "getMappedDependency",
    ]);

    if (!validMethods.has(nodeExpression.name.getText())) return undefined;

    return nodeExpression.name.getText();
  }

  private getDependencyTokenValue(dependencyToken: ts.TypeNode): ts.Expression {
    const dependencyTokenType = this.typeChecker.getTypeFromTypeNode(dependencyToken);
    const dependencyTokenSymbol = dependencyTokenType.getSymbol();
    const declaration = dependencyTokenSymbol?.declarations?.[0];

    if (declaration && this.tsInstance.isInterfaceDeclaration(declaration) && this.interfaces.has(declaration)) {
      const interfaceIdentifier = this.interfaces.get(declaration);

      if (!interfaceIdentifier) throw new Error("Invalid interface identifier");

      return interfaceIdentifier;
    }

    return this.tsFactory.createIdentifier(dependencyToken.getText());
  }

  private createUpdatedDependencyRegisterConfigObjectLiteral(
    methodArgument: ts.Expression | undefined,
    dependencyTokenPropertyValue: ts.Expression,
    classConstructorPropertyAssignmentArray: ts.PropertyAssignment[],
  ): ts.ObjectLiteralExpression {
    const dependencyTokenPropertyAssignment = this.tsFactory.createPropertyAssignment(
      "dependencyToken",
      dependencyTokenPropertyValue,
    );

    if (methodArgument && this.tsInstance.isObjectLiteralExpression(methodArgument)) {
      const existingProperties = methodArgument.properties;
      const propertyNames = new Set(existingProperties.map((prop) => (prop.name as any)?.text));

      return this.tsFactory.updateObjectLiteralExpression(methodArgument, [
        ...existingProperties,
        ...(!propertyNames.has("dependencyToken") ? [dependencyTokenPropertyAssignment] : []),
        ...(!propertyNames.has("classConstructor") ? classConstructorPropertyAssignmentArray : []),
      ]);
    }

    return this.tsFactory.createObjectLiteralExpression([
      dependencyTokenPropertyAssignment,
      ...classConstructorPropertyAssignmentArray,
    ]);
  }

  private createUpdatedDependencyRegisterCallExpression(
    node: ts.CallExpression,
    nodeExpression: ts.PropertyAccessExpression,
    methodName: string,
    dependencyTokenPropertyValue: ts.Expression,
    classConstructorExpr: ts.Expression,
  ): ts.CallExpression {
    const methodArgument = node.arguments?.[0];
    const requiresClassConstructor = new Set([
      "addSingleton",
      "addMappedSingleton",
      "addTransient",
      "addMappedTransient",
    ]).has(methodName);

    const classConstructorPropertyAssignmentArray = requiresClassConstructor
      ? [this.tsFactory.createPropertyAssignment("classConstructor", classConstructorExpr)]
      : [];

    const newObjectLiteral = this.createUpdatedDependencyRegisterConfigObjectLiteral(
      methodArgument,
      dependencyTokenPropertyValue,
      classConstructorPropertyAssignmentArray,
    );

    return this.tsFactory.updateCallExpression(
      node,
      this.tsFactory.updatePropertyAccessExpression(nodeExpression, nodeExpression.expression, nodeExpression.name),
      undefined,
      [newObjectLiteral],
    );
  }

  public execute(node: ts.Node) {
    if (!this.tsInstance.isCallExpression(node) || !this.tsInstance.isPropertyAccessExpression(node.expression)) return;

    const methodName = this.findMethodName(node.expression);

    if (methodName === undefined) return;

    const [dependencyToken, classConstructor] = node.typeArguments || [];
    if (!dependencyToken) return;

    const dependencyTokenExpr = this.tsFactory.createIdentifier(dependencyToken.getText());
    const classConstructorExpr = classConstructor
      ? this.tsFactory.createIdentifier(classConstructor.getText())
      : undefined;

    const dependencyTokenPropertyValue = this.getDependencyTokenValue(dependencyToken);

    return this.createUpdatedDependencyRegisterCallExpression(
      node,
      node.expression,
      methodName,
      dependencyTokenPropertyValue,
      classConstructorExpr || dependencyTokenExpr,
    );
  }
}
