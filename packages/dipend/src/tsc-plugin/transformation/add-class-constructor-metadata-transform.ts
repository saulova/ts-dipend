import ts from "typescript";

import { BaseTransform } from "./base-transform";

export class AddClassConstructorMetadataTransform extends BaseTransform {
  private getConstructorParameterTypes(node: ts.ClassDeclaration): ts.Expression[] {
    return node.members.filter(this.tsInstance.isConstructorDeclaration).flatMap(
      (constructor) =>
        constructor.parameters
          .filter((param) => param.type)
          .map((param) => {
            const type = this.typeChecker.getTypeAtLocation(param.type!);
            const typeSymbol = type.getSymbol();
            const typeSymbolDeclarations = typeSymbol?.declarations || [];

            if (typeSymbolDeclarations.length === 0) return null;

            const declaration = typeSymbolDeclarations[0];
            return this.tsInstance.isInterfaceDeclaration(declaration)
              ? this.interfaces.get(declaration) || null
              : this.tsInstance.isClassDeclaration(declaration) && declaration.name
                ? declaration.name
                : null;
          })
          .filter(Boolean) as ts.Expression[],
    );
  }

  private findSymbolMetadataProperty(classMembers: ts.ClassElement[]): ts.PropertyDeclaration | undefined {
    return classMembers.find(
      (member) =>
        this.tsInstance.isPropertyDeclaration(member) &&
        this.tsInstance.isComputedPropertyName(member.name) &&
        this.tsInstance.isPropertyAccessExpression(member.name.expression) &&
        member.name.expression.getText() === "Symbol.metadata",
    ) as ts.PropertyDeclaration | undefined;
  }

  private createSymbolMetadataProperty(): ts.PropertyDeclaration {
    return this.tsFactory.createPropertyDeclaration(
      [this.tsFactory.createModifier(this.tsInstance.SyntaxKind.StaticKeyword)],
      this.tsFactory.createComputedPropertyName(
        this.tsFactory.createPropertyAccessExpression(this.tsFactory.createIdentifier("Symbol"), "metadata"),
      ),
      undefined,
      this.tsFactory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      this.tsFactory.createObjectLiteralExpression(),
    );
  }

  private diConstructorMetadataExists(property: ts.ObjectLiteralElementLike): boolean {
    if (
      this.tsInstance.isPropertyAssignment(property) &&
      this.tsInstance.isComputedPropertyName(property.name) &&
      this.tsInstance.isCallExpression(property.name.expression)
    ) {
      const callExpr = property.name.expression;

      if (
        this.tsInstance.isPropertyAccessExpression(callExpr.expression) &&
        this.tsInstance.isIdentifier(callExpr.expression.expression) &&
        callExpr.expression.expression.text === "Symbol" &&
        callExpr.expression.name.text === "for"
      ) {
        const arg = callExpr.arguments[0];
        return this.tsInstance.isStringLiteral(arg) && arg.text === "di:constructor:param_types";
      }
    }
    return false;
  }

  private removeDIConstructorMetadataPropertyIfExists(
    symbolMetadataPropertyInitializer: ts.ObjectLiteralExpression,
  ): ts.ObjectLiteralExpression {
    const updatedProperties = symbolMetadataPropertyInitializer.properties.filter(
      (prop) => !this.diConstructorMetadataExists(prop),
    );

    return this.tsFactory.updateObjectLiteralExpression(symbolMetadataPropertyInitializer, updatedProperties);
  }

  private createDIConstructorMetadata(constructorParamArray: ts.Expression[]): ts.PropertyAssignment {
    return this.tsFactory.createPropertyAssignment(
      this.tsFactory.createComputedPropertyName(
        this.tsFactory.createCallExpression(
          this.tsFactory.createPropertyAccessExpression(this.tsFactory.createIdentifier("Symbol"), "for"),
          undefined,
          [this.tsFactory.createStringLiteral("di:constructor:param_types")],
        ),
      ),
      this.tsFactory.createArrayLiteralExpression(constructorParamArray),
    );
  }

  private createDIConstructorMetadataProperty(
    classMembers: ts.ClassElement[],
    symbolMetadataProperty: ts.PropertyDeclaration,
    symbolMetadataPropertyInitializer: ts.Expression,
    constructorParamArray: ts.Expression[],
  ) {
    if (!this.tsInstance.isObjectLiteralExpression(symbolMetadataPropertyInitializer))
      throw new Error("Symbol.metadata property must be an object.");

    const updatedObjectLiteralExpression = this.tsFactory.updateObjectLiteralExpression(
      symbolMetadataPropertyInitializer,
      [
        ...this.removeDIConstructorMetadataPropertyIfExists(symbolMetadataPropertyInitializer).properties,
        this.createDIConstructorMetadata(constructorParamArray),
      ],
    );

    const updatedSymbolMetadataProperty = this.tsFactory.updatePropertyDeclaration(
      symbolMetadataProperty,
      symbolMetadataProperty.modifiers,
      symbolMetadataProperty.name,
      symbolMetadataProperty.questionToken,
      symbolMetadataProperty.type,
      updatedObjectLiteralExpression,
    );

    const index = classMembers.indexOf(symbolMetadataProperty);
    if (index !== -1) classMembers[index] = updatedSymbolMetadataProperty;
  }

  private addClassConstructorMetadataToClass(
    node: ts.ClassDeclaration,
    constructorParamArray: ts.Expression[],
  ): ts.ClassDeclaration {
    const classMembers = Array.from(node.members);

    let symbolMetadataProperty = this.findSymbolMetadataProperty(classMembers);

    if (symbolMetadataProperty?.initializer === undefined) {
      symbolMetadataProperty = this.createSymbolMetadataProperty();

      classMembers.push(symbolMetadataProperty);
    }

    this.createDIConstructorMetadataProperty(
      classMembers,
      symbolMetadataProperty!,
      symbolMetadataProperty!.initializer!,
      constructorParamArray,
    );

    return this.tsFactory.updateClassDeclaration(
      node,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      classMembers,
    );
  }

  public execute(node: ts.Node) {
    if (!this.tsInstance.isClassDeclaration(node)) return;

    const constructorParamArray = this.getConstructorParameterTypes(node);

    return this.addClassConstructorMetadataToClass(node, constructorParamArray);
  }
}
