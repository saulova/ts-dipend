import ts from "typescript";

export abstract class BaseTransform {
  private _interfaces?: Map<ts.InterfaceDeclaration, ts.CallExpression>;
  private _tsInstance?: typeof ts;
  private _typeChecker?: ts.TypeChecker;
  private _tsFactory?: ts.NodeFactory;

  protected get interfaces(): Map<ts.InterfaceDeclaration, ts.CallExpression> {
    if (this._interfaces === undefined) {
      throw new Error("Set interfaces first.");
    }

    return this._interfaces;
  }

  public setInterfaces(value: Map<ts.InterfaceDeclaration, ts.CallExpression>) {
    this._interfaces = value;
  }

  protected get tsInstance(): typeof ts {
    if (this._tsInstance === undefined) {
      throw new Error("Set tsInstance first.");
    }

    return this._tsInstance;
  }

  public setTsInstance(value: typeof ts) {
    this._tsInstance = value;
  }

  protected get typeChecker(): ts.TypeChecker {
    if (this._typeChecker === undefined) {
      throw new Error("Set typeChecker first.");
    }

    return this._typeChecker;
  }

  public setTypeChecker(value: ts.TypeChecker) {
    this._typeChecker = value;
  }

  protected get tsFactory(): ts.NodeFactory {
    if (this._tsFactory === undefined) {
      throw new Error("Set tsFactory first.");
    }

    return this._tsFactory;
  }

  public setTsFactory(value: ts.NodeFactory) {
    this._tsFactory = value;
  }

  public abstract execute(node: ts.Node): ts.CallExpression | ts.ClassDeclaration | undefined | void;
}
