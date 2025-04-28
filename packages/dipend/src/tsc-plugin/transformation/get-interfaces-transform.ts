import ts from "typescript";
import { randomUUID } from "crypto";
import { BaseTransform } from "./base-transform";

export class GetInterfacesTransform extends BaseTransform {
  private isValidDependencyContainerCall(nodeExpression: ts.PropertyAccessExpression): boolean {
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
    ]);

    if (!validMethods.has(nodeExpression.name.getText())) return false;

    const symbol = this.typeChecker.getSymbolAtLocation(nodeExpression.expression);

    if (!symbol?.valueDeclaration) return false;

    const type = this.typeChecker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);

    return this.typeChecker.typeToString(type) === "DependencyContainer";
  }

  private registerInterface(declaration: ts.InterfaceDeclaration) {
    const symbolForInterface = ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("Symbol"), "for"),
      undefined,
      [ts.factory.createStringLiteral(`DI_${declaration.name.getText()}_${randomUUID()}`)],
    );

    this.interfaces.set(declaration, symbolForInterface);
  }

  private registerDependencyToken(dependencyToken: ts.TypeNode) {
    const dependencyTokenType = this.typeChecker.getTypeFromTypeNode(dependencyToken);
    const dependencyTokenSymbol = dependencyTokenType.getSymbol();
    if (!dependencyTokenSymbol?.declarations) return;

    dependencyTokenSymbol.declarations.forEach((declaration) => {
      if (this.tsInstance.isInterfaceDeclaration(declaration)) {
        this.registerInterface(declaration);
      }
    });
  }

  public execute(node: ts.Node) {
    if (!this.tsInstance.isCallExpression(node) || !this.tsInstance.isPropertyAccessExpression(node.expression)) return;

    if (!this.isValidDependencyContainerCall(node.expression)) return;

    const dependencyToken = node.typeArguments?.[0];
    if (!dependencyToken) return;

    this.registerDependencyToken(dependencyToken);
  }
}
