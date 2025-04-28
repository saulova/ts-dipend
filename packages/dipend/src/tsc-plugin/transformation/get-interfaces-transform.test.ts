import ts from "typescript";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ASTTestHelper, SpyHelper } from "../__tests__";
import { GetInterfacesTransform } from "./get-interfaces-transform";

const tsInstance = ts;

const createTsFactory = () => {
  const tsFactory = ts.factory;
  const tsFactorySpies = SpyHelper.spyOnAllMethods(tsFactory);

  return {
    tsFactory,
    tsFactorySpies,
  };
};

function createTransformer(tsFactory: ts.NodeFactory, typeChecker?: ts.TypeChecker) {
  const mockTypeChecker: ts.TypeChecker =
    typeChecker ||
    ({
      getSymbolAtLocation: vi.fn(() => ({ valueDeclaration: {} })),
      getTypeOfSymbolAtLocation: vi.fn(() => ({
        getSymbol: vi.fn(() => ({ declarations: [{}] })),
      })),
      typeToString: vi.fn(() => "DependencyContainer"),
      getTypeFromTypeNode: vi.fn(() => ({ getSymbol: vi.fn(() => ({ declarations: [{}] })) })),
    } as any);

  const transform = new GetInterfacesTransform();

  const interfaces: Map<ts.InterfaceDeclaration, ts.CallExpression> = new Map();

  transform.setInterfaces(interfaces);
  transform.setTsInstance(tsInstance);
  transform.setTypeChecker(mockTypeChecker);
  transform.setTsFactory(tsFactory);

  return { transform, mockTypeChecker, interfaces };
}

function makeSut(typeChecker?: any) {
  const { tsFactory, tsFactorySpies } = createTsFactory();

  return {
    tsFactory,
    tsFactorySpies,
    ...createTransformer(tsFactory, typeChecker),
  };
}

describe("GetInterfacesTransform", () => {
  afterEach(() => vi.restoreAllMocks());

  describe("isValidDependencyContainerCall", () => {
    it("Should return true for valid dependency container calls", () => {
      const { transform, tsFactory } = makeSut();

      const methodIdentifier = tsFactory.createIdentifier("addSingleton");

      methodIdentifier["getText"] = () => methodIdentifier.text;

      const propertyAccessExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyContainer"),
        methodIdentifier,
      );

      const result = transform["isValidDependencyContainerCall"](propertyAccessExpression);

      expect(result).toBe(true);
    });

    it("should return false if symbol.valueDeclaration is missing", () => {
      const { transform, tsFactory, mockTypeChecker } = makeSut();

      const methodIdentifier = tsFactory.createIdentifier("addSingleton");

      methodIdentifier["getText"] = () => methodIdentifier.text;

      const propertyAccessExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyContainer"),
        methodIdentifier,
      );

      (mockTypeChecker as any).getSymbolAtLocation = vi.fn(() => null);

      const result = transform["isValidDependencyContainerCall"](propertyAccessExpression);

      expect(result).toBe(false);
    });

    it("Should return false for invalid method calls", () => {
      const { transform, tsFactory } = makeSut();

      const methodIdentifier = tsFactory.createIdentifier("invalidMethod");

      methodIdentifier["getText"] = () => methodIdentifier.text;

      const propertyAccessExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyContainer"),
        methodIdentifier,
      );

      const result = transform["isValidDependencyContainerCall"](propertyAccessExpression);

      expect(result).toBe(false);
    });
  });

  describe("registerInterface", () => {
    it("Should create and store a symbol for an interface", () => {
      const { transform, interfaces } = makeSut();

      const sourceCode = `
        interface ITestDependency { test1: string; }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, tsInstance);

      const declaration = interfaceDeclarations[0];

      transform["registerInterface"](declaration);

      expect(interfaces.has(declaration)).toBeTruthy();
    });
  });

  describe("registerDependencyToken", () => {
    it("Should register interface when dependency token has an interface declaration", () => {
      const { transform, mockTypeChecker } = makeSut();

      const sourceCode = `
        interface ITestDependency { test1: string; }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, tsInstance);

      (mockTypeChecker as any)["getTypeFromTypeNode"] = vi.fn(() => ({
        getSymbol: () => ({ declarations: [interfaceDeclarations[0]] }),
      }));

      transform["registerInterface"] = vi.fn();

      transform["registerDependencyToken"](interfaceDeclarations[0] as any);

      expect(transform["registerInterface"]).toHaveBeenCalledWith(interfaceDeclarations[0]);
    });

    it("should return undefined if dependencyTokenSymbol.declarations is missing", () => {
      const { transform, mockTypeChecker, tsFactory } = makeSut();

      const dependencyToken = tsFactory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

      (mockTypeChecker as any).getTypeFromTypeNode = vi.fn(() => ({ getSymbol: () => null }));

      transform["registerInterface"] = vi.fn();

      transform["registerDependencyToken"](dependencyToken);

      expect(transform["registerInterface"]).not.toHaveBeenCalled();
    });
  });

  describe("execute", () => {
    it("Should process dependency token if valid dependency container call", () => {
      const { transform, tsFactory } = makeSut();

      const sourceCode = `
        interface ITestDependency { test1: string; }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, tsInstance);

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyContainer"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const callExpression = tsFactory.createCallExpression(nodeExpression, [interfaceDeclarations[0] as any], []);

      transform["isValidDependencyContainerCall"] = vi.fn(() => true);
      transform["registerDependencyToken"] = vi.fn();

      const result = transform.execute(callExpression);

      expect(result).toBeUndefined();
      expect(transform["isValidDependencyContainerCall"]).toHaveBeenCalledOnce();
      expect(transform["registerDependencyToken"]).toHaveBeenCalledOnce();
    });

    it("Should return undefined if node is not a valid call expression", () => {
      const { transform, tsFactory } = makeSut();

      const node = tsFactory.createIdentifier("notACallExpression");

      transform["isValidDependencyContainerCall"] = vi.fn(() => true);
      transform["registerDependencyToken"] = vi.fn();

      const result = transform.execute(node);

      expect(result).toBeUndefined();
      expect(transform["isValidDependencyContainerCall"]).not.toHaveBeenCalled();
      expect(transform["registerDependencyToken"]).not.toHaveBeenCalled();
    });

    it("should return undefined if isValidDependencyContainerCall returns false", () => {
      const { transform, tsFactory } = makeSut();

      const sourceCode = `
        interface ITestDependency { test1: string; }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, tsInstance);

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyContainer"),
        tsFactory.createIdentifier("invalidCall"),
      );

      const callExpression = tsFactory.createCallExpression(nodeExpression, [interfaceDeclarations[0] as any], []);

      transform["isValidDependencyContainerCall"] = vi.fn(() => false);
      transform["registerDependencyToken"] = vi.fn();

      const result = transform.execute(callExpression);

      expect(result).toBeUndefined();
      expect(transform["isValidDependencyContainerCall"]).toHaveBeenCalledOnce();
      expect(transform["registerDependencyToken"]).not.toHaveBeenCalled();
    });

    it("should return undefined if dependencyToken is missing", () => {
      const { transform, tsFactory } = makeSut();

      const sourceCode = `
        interface ITestDependency { test1: string; }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, tsInstance);

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyContainer"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const callExpression = tsFactory.createCallExpression(nodeExpression, undefined, []);

      transform["isValidDependencyContainerCall"] = vi.fn(() => true);
      transform["registerDependencyToken"] = vi.fn();

      const result = transform.execute(callExpression);

      expect(result).toBeUndefined();
      expect(transform["isValidDependencyContainerCall"]).toHaveBeenCalledOnce();
      expect(transform["registerDependencyToken"]).not.toHaveBeenCalled();
    });
  });
});
