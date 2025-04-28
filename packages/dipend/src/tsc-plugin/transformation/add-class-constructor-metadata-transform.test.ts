import ts from "typescript";
import { describe, it, expect, vi, afterEach } from "vitest";
import { AddClassConstructorMetadataTransform } from "./add-class-constructor-metadata-transform";
import { ASTTestHelper, SpyHelper } from "../__tests__";

const tsInstance = ts;

const createTsFactory = () => {
  const tsFactory = ts.factory;
  const tsFactorySpies = SpyHelper.spyOnAllMethods(tsFactory);

  return {
    tsFactory,
    tsFactorySpies,
  };
};

function createTransformer(
  interfaces: Map<ts.InterfaceDeclaration, ts.CallExpression>,
  tsFactory: ts.NodeFactory,
  typeChecker?: ts.TypeChecker,
) {
  const mockTypeChecker: ts.TypeChecker =
    typeChecker ||
    ({
      getTypeAtLocation: vi.fn(() => ({
        getSymbol: () => ({ declarations: [] }),
      })),
    } as any);

  const transform = new AddClassConstructorMetadataTransform();

  transform.setInterfaces(interfaces);
  transform.setTsInstance(tsInstance);
  transform.setTypeChecker(mockTypeChecker);
  transform.setTsFactory(tsFactory);

  return { transform };
}

function makeSut(interfaces: Map<ts.InterfaceDeclaration, ts.CallExpression>, typeChecker?: any) {
  const { tsFactory, tsFactorySpies } = createTsFactory();

  return {
    tsFactory,
    tsFactorySpies,
    ...createTransformer(interfaces, tsFactory, typeChecker),
  };
}

describe("AddClassConstructorMetadataTransform", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getConstructorParameterTypes", () => {
    it("Should extract constructor parameter types if declaration is a interface declaration", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          test2: string = "test";

          constructor(public testDependency: ITestDependency) { }

          test3(): void {
              console.log("This is a test.");
          }
        }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, ts);

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const mockTypeChecker = {
        getTypeAtLocation: vi.fn(() => ({
          getSymbol: () => ({ declarations: [interfaceDeclarations[0]] }),
        })),
      };

      const { transform } = makeSut(new Map([[interfaceDeclarations[0], "ITestDependency" as any]]), mockTypeChecker);

      const result = transform["getConstructorParameterTypes"](classDeclarations[0]);

      expect(result).toHaveLength(1);
      expect(result).toEqual(["ITestDependency"]);
    });

    it("Should extract constructor parameter types if declaration is a class declaration", () => {
      const sourceCode = `
        class TestDependencyClass { 
          test1: string = "test";
        }

        class TestClass {
          test2: string = "test";

          constructor(public testDependency: TestDependencyClass) { }

          test3(): void {
              console.log("This is a test.");
          }
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const mockTypeChecker = {
        getTypeAtLocation: vi.fn(() => ({
          getSymbol: () => ({ declarations: [classDeclarations[0]] }),
        })),
      };

      const { transform } = makeSut(new Map(), mockTypeChecker);

      const result = transform["getConstructorParameterTypes"](classDeclarations[1]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(classDeclarations[0].name);
    });

    it("Should not extract constructor parameter types if constructor is empty", () => {
      const sourceCode = `
        class TestClass {
          test2: string = "test";

          constructor() { }

          test3(): void {
              console.log("This is a test.");
          }
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const mockTypeChecker = {
        getTypeAtLocation: vi.fn(() => ({
          getSymbol: () => ({}),
        })),
      };

      const { transform } = makeSut(new Map([]), mockTypeChecker);

      const result = transform["getConstructorParameterTypes"](classDeclarations[0]);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("Should not extract constructor parameter types if declaration is missing", () => {
      const sourceCode = `
        class TestClass {
          test2: string = "test";

          constructor(abc: string) { }

          test3(): void {
              console.log("This is a test.");
          }
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const mockTypeChecker = {
        getTypeAtLocation: vi.fn(() => ({
          getSymbol: () => ({}),
        })),
      };

      const { transform } = makeSut(new Map([]), mockTypeChecker);

      const result = transform["getConstructorParameterTypes"](classDeclarations[0]);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("Should not extract constructor parameter types if interface is not registered", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          test2: string = "test";

          constructor(public testDependency: ITestDependency) { }

          test3(): void {
              console.log("This is a test.");
          }
        }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, ts);

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const mockTypeChecker = {
        getTypeAtLocation: vi.fn(() => ({
          getSymbol: () => ({ declarations: [interfaceDeclarations[0]] }),
        })),
      };

      const { transform } = makeSut(new Map([]), mockTypeChecker);

      const result = transform["getConstructorParameterTypes"](classDeclarations[0]);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("Should not extract constructor parameter types if declaration is not a class or interface type", () => {
      const sourceCode = `
        class TestClass {
          test2: string = "test";

          constructor(public testString: string) { }

          test3(): void {
              console.log("This is a test.");
          }
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const typeParameterDeclaration = ts.factory.createTypeParameterDeclaration(
        undefined,
        "string",
        undefined,
        undefined,
      );

      const mockTypeChecker = {
        getTypeAtLocation: vi.fn(() => ({
          getSymbol: () => ({ declarations: [typeParameterDeclaration] }),
        })),
      };

      const { transform } = makeSut(new Map(), mockTypeChecker);

      const result = transform["getConstructorParameterTypes"](classDeclarations[0]);

      expect(result).toHaveLength(0);
    });
  });

  describe("createSymbolMetadataProperty", () => {
    it("Should create symbol metadata property", () => {
      const { transform, tsFactorySpies } = makeSut(new Map());

      const result = transform["createSymbolMetadataProperty"]();

      expect(tsFactorySpies.createPropertyDeclarationSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createModifierSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createComputedPropertyNameSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createPropertyAccessExpressionSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createIdentifierSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createKeywordTypeNodeSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createObjectLiteralExpressionSpy).toHaveBeenCalledOnce();
      expect(tsInstance.isPropertyDeclaration(result)).toBe(true);
      expect(tsInstance.isComputedPropertyName(result.name)).toBe(true);
      expect(tsInstance.isPropertyAccessExpression((result.name as any)?.expression)).toBe(true);
      expect((result.name as any)?.expression.expression.text).toBe("Symbol");
      expect((result.name as any)?.expression.name.text).toBe("metadata");
    });
  });

  describe("findSymbolMetadataProperty", () => {
    it("Should find symbol metadata property if exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static [Symbol.metadata] = {};
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform } = makeSut(new Map());

      const classMembers = Array.from(classDeclarations[0].members);

      const result = transform["findSymbolMetadataProperty"](classMembers);

      expect(result).toBeDefined();
      expect(result).toEqual(classDeclarations[0].members[1]);
    });

    it("Should return undefined if symbol metadata property not exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform } = makeSut(new Map());

      const classMembers = Array.from(classDeclarations[0].members);

      const result = transform["findSymbolMetadataProperty"](classMembers);

      expect(result).toBeUndefined();
    });
  });

  describe("diConstructorMetadataExists", () => {
    it("Should return true if di constructor metadata exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static [Symbol.metadata] = { [Symbol.for("di:constructor:param_types")]: [] };
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform } = makeSut(new Map());

      const classMembers = Array.from(classDeclarations[0].members);

      const result = transform["diConstructorMetadataExists"]((classMembers[1] as any).initializer.properties[0]);

      expect(result).toBe(true);
    });

    it("Should return false if di constructor metadata exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static test = { test: "test"};
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform } = makeSut(new Map());

      const classMembers = Array.from(classDeclarations[0].members);

      const result = transform["diConstructorMetadataExists"]((classMembers[1] as any).initializer.properties[0]);

      expect(result).toBe(false);
    });
  });

  describe("removeDIConstructorMetadataPropertyIfExists", () => {
    it("Should remove di constructor metadata property if exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static [Symbol.metadata] = { [Symbol.for("di:constructor:param_types")]: [] };
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform, tsFactorySpies } = makeSut(new Map());

      const classMembers = Array.from(classDeclarations[0].members);

      transform["diConstructorMetadataExists"] = vi.fn(() => true);

      const result = transform["removeDIConstructorMetadataPropertyIfExists"]((classMembers[1] as any).initializer);

      expect(transform["diConstructorMetadataExists"]).toHaveBeenCalledOnce();
      expect((tsFactorySpies as any)["updateObjectLiteralExpressionSpy"]).toHaveBeenCalledOnce();
      expect(result.properties.length).toBe(0);
    });

    it("Should do nothing if di constructor metadata property not exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static [Symbol.metadata] = { [Symbol.for("di:anything")]: [] };
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform, tsFactorySpies } = makeSut(new Map());

      const classMembers = Array.from(classDeclarations[0].members);

      transform["diConstructorMetadataExists"] = vi.fn(() => false);

      const result = transform["removeDIConstructorMetadataPropertyIfExists"]((classMembers[1] as any).initializer);

      expect(transform["diConstructorMetadataExists"]).toHaveBeenCalledOnce();
      expect((tsFactorySpies as any)["updateObjectLiteralExpressionSpy"]).toHaveBeenCalledOnce();
      expect(result.properties.length).toBe(1);
    });
  });

  describe("createDIConstructorMetadata", () => {
    it("Should create DI metadata property assignment when createDIConstructorMetadata is called", () => {
      const { transform, tsFactorySpies } = makeSut(new Map());

      const result = transform["createDIConstructorMetadata"]([]);

      expect(tsFactorySpies.createPropertyAssignmentSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createComputedPropertyNameSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createCallExpressionSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createPropertyAccessExpressionSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createIdentifierSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createStringLiteralSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.createArrayLiteralExpressionSpy).toHaveBeenCalledOnce();
      expect(tsInstance.isPropertyAssignment(result)).toBe(true);
      expect(tsInstance.isComputedPropertyName(result.name)).toBe(true);
      expect(tsInstance.isCallExpression((result.name as any)?.expression)).toBe(true);
      expect(tsInstance.isPropertyAccessExpression((result.name as any)?.expression.expression)).toBe(true);
      expect((result.name as any)?.expression.expression.expression.text).toBe("Symbol");
      expect((result.name as any)?.expression.expression.name.text).toBe("for");
      expect((result.name as any)?.expression.arguments[0].text).toBe("di:constructor:param_types");
    });
  });

  describe("createDIConstructorMetadataProperty", () => {
    it("Should create di constructor metadata property", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static [Symbol.metadata] = {};
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform, tsFactory, tsFactorySpies } = makeSut(new Map());

      transform["removeDIConstructorMetadataPropertyIfExists"] = vi.fn(
        (symbolMetadataPropertyInitializer: ts.ObjectLiteralExpression): ts.ObjectLiteralExpression => {
          return symbolMetadataPropertyInitializer;
        },
      );

      transform["createDIConstructorMetadata"] = vi.fn(() =>
        tsFactory.createPropertyAssignment(
          tsFactory.createComputedPropertyName(
            tsFactory.createCallExpression(
              tsFactory.createPropertyAccessExpression(tsFactory.createIdentifier("Symbol"), "for"),
              undefined,
              [tsFactory.createStringLiteral("di:constructor:param_types")],
            ),
          ),
          tsFactory.createArrayLiteralExpression(),
        ),
      );

      const classMembers = Array.from(classDeclarations[0].members);

      const symbolMetadataProperty = classMembers.find(
        (member) =>
          tsInstance.isPropertyDeclaration(member) &&
          tsInstance.isComputedPropertyName(member.name) &&
          tsInstance.isPropertyAccessExpression(member.name.expression) &&
          member.name.expression.getText() === "Symbol.metadata",
      ) as ts.PropertyDeclaration;

      transform["createDIConstructorMetadataProperty"](
        classMembers,
        symbolMetadataProperty,
        symbolMetadataProperty.initializer as ts.Expression,
        [],
      );

      expect(transform["removeDIConstructorMetadataPropertyIfExists"]).toHaveBeenCalledOnce();
      expect(transform["createDIConstructorMetadata"]).toHaveBeenCalledOnce();
      expect(tsFactorySpies.updateObjectLiteralExpressionSpy).toHaveBeenCalledOnce();
      expect(tsFactorySpies.updatePropertyDeclarationSpy).toHaveBeenCalledOnce();
      expect((classMembers[1] as any)?.initializer.properties.length).toBe(1);
      expect((classMembers[1] as any)?.initializer.properties[0].name.expression.expression.expression.text).toEqual(
        "Symbol",
      );
      expect((classMembers[1] as any)?.initializer.properties[0].name.expression.expression.name.text).toEqual("for");
      expect((classMembers[1] as any)?.initializer.properties[0].name.expression.arguments[0].text).toEqual(
        "di:constructor:param_types",
      );
    });

    it("Should throw an error if Symbol.metadata is not an object", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static [Symbol.metadata] = [];
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform } = makeSut(new Map());

      const classMembers = Array.from(classDeclarations[0].members);

      const symbolMetadataProperty = classMembers.find(
        (member) =>
          tsInstance.isPropertyDeclaration(member) &&
          tsInstance.isComputedPropertyName(member.name) &&
          tsInstance.isPropertyAccessExpression(member.name.expression) &&
          member.name.expression.getText() === "Symbol.metadata",
      ) as ts.PropertyDeclaration;

      expect(() =>
        transform["createDIConstructorMetadataProperty"](
          classMembers,
          symbolMetadataProperty,
          symbolMetadataProperty.initializer as any,
          [],
        ),
      ).toThrowError("Symbol.metadata property must be an object.");
    });
  });

  describe("addClassConstructorMetadataToClass", () => {
    it("Should add class constructor metadata to a class if symbol metadata exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }

          public static [Symbol.metadata] = {}
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform, tsFactorySpies } = makeSut(new Map());

      transform["findSymbolMetadataProperty"] = vi.fn(
        () =>
          ({
            initializer: "Symbol.metadata",
          }) as any,
      );
      transform["createSymbolMetadataProperty"] = vi.fn();
      transform["createDIConstructorMetadataProperty"] = vi.fn();

      const result = transform["addClassConstructorMetadataToClass"](classDeclarations[0], []);

      expect(tsInstance.isClassDeclaration(result)).toBe(true);
      expect(transform["findSymbolMetadataProperty"]).toHaveBeenCalledOnce();
      expect(transform["createSymbolMetadataProperty"]).not.toHaveBeenCalledOnce();
      expect(transform["createDIConstructorMetadataProperty"]).toHaveBeenCalledOnce();
      expect(tsFactorySpies.updateClassDeclarationSpy).toHaveBeenCalledOnce();
    });

    it("Should class constructor metadata to a class if symbol metadata not exists", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }

        class TestClass {
          constructor(public testDependency: ITestDependency) { }
        }
      `;

      const classDeclarations = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      const { transform, tsFactorySpies } = makeSut(new Map());

      transform["findSymbolMetadataProperty"] = vi.fn();
      transform["createSymbolMetadataProperty"] = vi.fn(
        () =>
          ({
            initializer: "Symbol.metadata",
          }) as any,
      );
      transform["createDIConstructorMetadataProperty"] = vi.fn();

      const result = transform["addClassConstructorMetadataToClass"](classDeclarations[0], []);

      expect(tsInstance.isClassDeclaration(result)).toBe(true);
      expect(transform["findSymbolMetadataProperty"]).toHaveBeenCalledOnce();
      expect(transform["createSymbolMetadataProperty"]).toHaveBeenCalledOnce();
      expect(transform["createDIConstructorMetadataProperty"]).toHaveBeenCalledOnce();
      expect(tsFactorySpies.updateClassDeclarationSpy).toHaveBeenCalledOnce();
    });
  });

  describe("execute", () => {
    it("Should return undefined if node is not a class declaration", () => {
      const { transform } = makeSut(new Map());

      transform["getConstructorParameterTypes"] = vi.fn();
      transform["addClassConstructorMetadataToClass"] = vi.fn();

      const result = transform.execute({} as any);

      expect(transform["getConstructorParameterTypes"]).not.toBeCalled();
      expect(transform["addClassConstructorMetadataToClass"]).not.toBeCalled();
      expect(result).toBeUndefined();
    });

    it("Should execute if node is a class declaration", () => {
      const { transform } = makeSut(new Map());

      const sourceCode = `
        class TestDependencyClass {
          test1: string = "test";
        }

        class TestClass {
          test2: string = "test";

          constructor(public testDependency: TestDependencyClass) { }

          test3(): void {
              console.log("This is a test.");
          }
        }
      `;

      const classDeclaration = ASTTestHelper.parseClassDeclarationsFromSource(sourceCode, tsInstance);

      transform["getConstructorParameterTypes"] = vi.fn();
      transform["addClassConstructorMetadataToClass"] = vi.fn(() => classDeclaration[1]);

      const result = transform.execute(classDeclaration[1]);

      expect(transform["getConstructorParameterTypes"]).toHaveBeenCalledOnce();
      expect(transform["addClassConstructorMetadataToClass"]).toHaveBeenCalledOnce();
      expect(result).toBeDefined();
    });
  });
});
