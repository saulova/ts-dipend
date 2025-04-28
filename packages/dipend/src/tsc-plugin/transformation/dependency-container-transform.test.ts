import ts from "typescript";
import { describe, it, expect, vi, afterEach } from "vitest";
import { DependencyContainerTransform } from "./dependency-container-transform";
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
      getSymbolAtLocation: vi.fn(),
      getTypeOfSymbolAtLocation: vi.fn(),
      typeToString: vi.fn(),
      getTypeFromTypeNode: vi.fn(),
    } as any);

  const transform = new DependencyContainerTransform();

  transform.setInterfaces(interfaces);
  transform.setTsInstance(tsInstance);
  transform.setTypeChecker(mockTypeChecker);
  transform.setTsFactory(tsFactory);

  return { transform, mockTypeChecker };
}

function makeSut(interfaces: Map<ts.InterfaceDeclaration, ts.CallExpression>, typeChecker?: any) {
  const { tsFactory, tsFactorySpies } = createTsFactory();

  return {
    tsFactory,
    tsFactorySpies,
    ...createTransformer(interfaces, tsFactory, typeChecker),
  };
}

describe("DependencyContainerTransform", () => {
  afterEach(() => vi.restoreAllMocks());
  describe("findMethodName", () => {
    it("Should return undefined if the symbol is not found", () => {
      const { transform, mockTypeChecker } = makeSut(new Map());

      (mockTypeChecker.getSymbolAtLocation as any).mockReturnValue(undefined);

      const node = { expression: {} };

      const result = transform["findMethodName"](node as any);

      expect(result).toBeUndefined();
    });

    it("Should return undefined if the value declaration is not found", () => {
      const { transform, mockTypeChecker } = makeSut(new Map());

      (mockTypeChecker.getSymbolAtLocation as any).mockReturnValue({});

      const node = { expression: {} };

      const result = transform["findMethodName"](node as any);

      expect(result).toBeUndefined();
    });

    it("Should return undefined if it is not DependencyContainer", () => {
      const { transform, mockTypeChecker } = makeSut(new Map());

      (mockTypeChecker.getSymbolAtLocation as any).mockReturnValue({ valueDeclaration: {} });
      (mockTypeChecker.getTypeOfSymbolAtLocation as any).mockReturnValue({});
      (mockTypeChecker.typeToString as any).mockReturnValue("NotDependencyContainer");

      const node = { expression: {} };

      const result = transform["findMethodName"](node as any);

      expect(result).toBeUndefined();
    });

    it("Should return method name if it belongs to DependencyContainer", () => {
      const { transform, mockTypeChecker } = makeSut(new Map());

      (mockTypeChecker.getSymbolAtLocation as any).mockReturnValue({ valueDeclaration: {} });
      (mockTypeChecker.getTypeOfSymbolAtLocation as any).mockReturnValue({});
      (mockTypeChecker.typeToString as any).mockReturnValue("DependencyContainer");

      const node = { expression: {}, name: { getText: () => "addSingleton" } };

      const result = transform["findMethodName"](node as any);

      expect(result).toBe("addSingleton");
    });

    it("Should return undefined if method not belongs to DependencyContainer", () => {
      const { transform, mockTypeChecker } = makeSut(new Map());

      (mockTypeChecker.getSymbolAtLocation as any).mockReturnValue({ valueDeclaration: {} });
      (mockTypeChecker.getTypeOfSymbolAtLocation as any).mockReturnValue({});
      (mockTypeChecker.typeToString as any).mockReturnValue("DependencyContainer");

      const node = { expression: {}, name: { getText: () => "fakeMethod" } };

      const result = transform["findMethodName"](node as any);

      expect(result).toBeUndefined();
    });
  });

  describe("getDependencyTokenValue", () => {
    it("Should return interface identifier it is a registered interface", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, ts);

      const { transform, mockTypeChecker } = makeSut(new Map([[interfaceDeclarations[0], "ITestDependency" as any]]));

      const token = interfaceDeclarations[0];

      (mockTypeChecker.getTypeFromTypeNode as any).mockReturnValue({
        getSymbol: () => ({ declarations: [interfaceDeclarations[0]] }),
      });

      const result = transform["getDependencyTokenValue"](token as any);

      expect(result as any).toEqual("ITestDependency");
    });

    it("Should return the same dependency token if it is not an interface", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, ts);

      const { transform, mockTypeChecker } = makeSut(new Map());

      const token = { getText: () => "MyDependency" };

      (mockTypeChecker.getTypeFromTypeNode as any).mockReturnValue({
        getSymbol: () => ({ declarations: [interfaceDeclarations[0]] }),
      });

      const result = transform["getDependencyTokenValue"](token as any);

      expect((result as any).text).toEqual("MyDependency");
    });

    it("Should throw an error if interface identifier is invalid", () => {
      const sourceCode = `
        interface ITestDependency { 
          test1: string;
        }
      `;

      const interfaceDeclarations = ASTTestHelper.parseInterfaceDeclarationsFromSource(sourceCode, ts);

      const { transform, mockTypeChecker } = makeSut(new Map([[interfaceDeclarations[0], undefined as any]]));

      const token = interfaceDeclarations[0];

      (mockTypeChecker.getTypeFromTypeNode as any).mockReturnValue({
        getSymbol: () => ({ declarations: [interfaceDeclarations[0]] }),
      });

      expect(() => transform["getDependencyTokenValue"](token as any)).toThrowError("Invalid interface identifier");
    });
  });

  describe("createUpdatedDependencyRegisterConfigObjectLiteral", () => {
    it("Should create an object literal with dependencyToken and classConstructor when methodArgument is undefined", () => {
      const { transform, tsFactory } = makeSut(new Map());

      const dependencyTokenPropertyValue = tsFactory.createStringLiteral("tokenValue");

      const classConstructorPropertyAssignmentArray = [
        tsFactory.createPropertyAssignment("classConstructor", tsFactory.createStringLiteral("constructorValue")),
      ];

      const result = transform["createUpdatedDependencyRegisterConfigObjectLiteral"](
        undefined,
        dependencyTokenPropertyValue,
        classConstructorPropertyAssignmentArray,
      );

      expect(result.properties.length).toBe(2);
      expect(result.properties.some((prop) => (prop.name as any)?.text === "dependencyToken")).toBeTruthy();
      expect(result.properties.some((prop) => (prop.name as any)?.text === "classConstructor")).toBeTruthy();
    });

    it("Should add dependencyToken if not present in methodArgument", () => {
      const { transform, tsFactory } = makeSut(new Map());

      const dependencyTokenPropertyValue = tsFactory.createStringLiteral("tokenValue");

      const existingProperties = [
        tsFactory.createPropertyAssignment("existingProperty", tsFactory.createStringLiteral("existingValue")),
      ];

      const methodArgument = tsFactory.createObjectLiteralExpression(existingProperties, true);

      const result = transform["createUpdatedDependencyRegisterConfigObjectLiteral"](
        methodArgument,
        dependencyTokenPropertyValue,
        [],
      );

      expect(result.properties.length).toBe(2);
      expect(result.properties.some((prop) => (prop.name as any)?.text === "existingProperty")).toBeTruthy();
      expect(result.properties.some((prop) => (prop.name as any)?.text === "dependencyToken")).toBeTruthy();
    });

    it("Should not add dependencyToken if it already exists in methodArgument", () => {
      const { transform, tsFactory } = makeSut(new Map());

      const dependencyTokenPropertyValue = tsFactory.createStringLiteral("tokenValue");

      const existingProperties = [
        tsFactory.createPropertyAssignment("dependencyToken", tsFactory.createStringLiteral("existingToken")),
      ];

      const methodArgument = tsFactory.createObjectLiteralExpression(existingProperties, true);

      const result = transform["createUpdatedDependencyRegisterConfigObjectLiteral"](
        methodArgument,
        dependencyTokenPropertyValue,
        [],
      );

      expect(result.properties?.length).toBe(1);
      expect((result.properties?.[0]?.name as any)?.text).toBe("dependencyToken");
      expect((result.properties?.[0] as any)?.initializer?.text).toBe("existingToken");
    });

    it("Should add classConstructor if not present in methodArgument", () => {
      const { transform, tsFactory } = makeSut(new Map());

      const dependencyTokenPropertyValue = tsFactory.createStringLiteral("tokenValue");
      const classConstructorPropertyAssignmentArray = [
        tsFactory.createPropertyAssignment("classConstructor", tsFactory.createStringLiteral("constructorValue")),
      ];
      const existingProperties = [
        tsFactory.createPropertyAssignment("existingProperty", tsFactory.createStringLiteral("existingValue")),
      ];

      const methodArgument = tsFactory.createObjectLiteralExpression(existingProperties, true);

      const result = transform["createUpdatedDependencyRegisterConfigObjectLiteral"](
        methodArgument,
        dependencyTokenPropertyValue,
        classConstructorPropertyAssignmentArray,
      );

      expect(result.properties.length).toBe(3);
      expect(result.properties.some((prop) => (prop.name as any)?.text === "classConstructor")).toBeTruthy();
    });

    it("Should not add classConstructor if present in methodArgument", () => {
      const { transform, tsFactory } = makeSut(new Map());

      const dependencyTokenPropertyValue = tsFactory.createStringLiteral("tokenValue");
      const classConstructorPropertyAssignmentArray = [
        tsFactory.createPropertyAssignment("classConstructor", tsFactory.createStringLiteral("newConstructorValue")),
      ];
      const existingProperties = [
        tsFactory.createPropertyAssignment("existingProperty", tsFactory.createStringLiteral("existingValue")),
        tsFactory.createPropertyAssignment("classConstructor", tsFactory.createStringLiteral("oldConstructorValue")),
      ];

      const methodArgument = tsFactory.createObjectLiteralExpression(existingProperties, true);

      const result = transform["createUpdatedDependencyRegisterConfigObjectLiteral"](
        methodArgument,
        dependencyTokenPropertyValue,
        classConstructorPropertyAssignmentArray,
      );

      expect(result.properties.length).toBe(3);
      expect(result.properties.some((prop) => (prop.name as any)?.text === "classConstructor")).toBeTruthy();
      expect(result.properties.some((prop) => (prop as any).initializer?.text === "oldConstructorValue")).toBeTruthy();
    });
  });

  describe("createUpdatedDependencyRegisterCallExpression", () => {
    it("Should create a new call expression with updated object literal", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["createUpdatedDependencyRegisterConfigObjectLiteral"] = vi.fn(
        (methodArgument, dependencyToken, classConstructorArray) =>
          tsFactory.createObjectLiteralExpression([
            tsFactory.createPropertyAssignment("dependencyToken", dependencyToken),
            ...classConstructorArray,
          ]),
      );

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyRegistry"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const methodName = "addSingleton";
      const dependencyTokenPropertyValue = tsFactory.createStringLiteral("tokenValue");
      const classConstructorExpr = tsFactory.createIdentifier("MyClass");

      const callExpression = tsFactory.createCallExpression(nodeExpression, undefined, []);

      const result = transform["createUpdatedDependencyRegisterCallExpression"](
        callExpression,
        nodeExpression,
        methodName,
        dependencyTokenPropertyValue,
        classConstructorExpr,
      );

      expect(transform["createUpdatedDependencyRegisterConfigObjectLiteral"]).toHaveBeenCalledOnce();
      expect(result.arguments.length).toBe(1);
      expect(ts.isObjectLiteralExpression(result.arguments[0])).toBeTruthy();
      expect(
        (result.arguments[0] as any)?.properties.some((prop: any) => prop.name.text === "dependencyToken"),
      ).toBeTruthy();
      expect(
        (result.arguments[0] as any)?.properties.some((prop: any) => prop.name.text === "classConstructor"),
      ).toBeTruthy();
    });

    it("Should not include classConstructor for methods that do not require it", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["createUpdatedDependencyRegisterConfigObjectLiteral"] = vi.fn(
        (methodArgument, dependencyToken, classConstructorArray) =>
          tsFactory.createObjectLiteralExpression([
            tsFactory.createPropertyAssignment("dependencyToken", dependencyToken),
            ...classConstructorArray,
          ]),
      );

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyRegistry"),
        tsFactory.createIdentifier("addScoped"),
      );

      const methodName = "addScoped";
      const dependencyTokenPropertyValue = tsFactory.createStringLiteral("tokenValue");
      const classConstructorExpr = tsFactory.createIdentifier("MyClass");

      const callExpression = tsFactory.createCallExpression(nodeExpression, undefined, []);

      const result = transform["createUpdatedDependencyRegisterCallExpression"](
        callExpression,
        nodeExpression,
        methodName,
        dependencyTokenPropertyValue,
        classConstructorExpr,
      );

      expect(transform["createUpdatedDependencyRegisterConfigObjectLiteral"]).toHaveBeenCalledOnce();
      expect(result.arguments.length).toBe(1);
      expect(ts.isObjectLiteralExpression(result.arguments[0])).toBeTruthy();
      expect(
        (result.arguments[0] as any)?.properties.some((prop: any) => prop.name.text === "dependencyToken"),
      ).toBeTruthy();
      expect(
        (result.arguments[0] as any)?.properties.some((prop: any) => prop.name.text === "classConstructor"),
      ).toBeFalsy();
    });
  });

  describe("execute", () => {
    it("Should return undefined if node is not a call expression", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["findMethodName"] = vi.fn(() => "addSingleton");
      transform["getDependencyTokenValue"] = vi.fn((token) => tsFactory.createStringLiteral((token as any).text));
      transform["createUpdatedDependencyRegisterCallExpression"] = vi.fn();

      const node = tsFactory.createIdentifier("notACallExpression");
      const result = transform.execute(node);

      expect(result).toBeUndefined();
    });

    it("Should return undefined if node expression is not a property access expression", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["findMethodName"] = vi.fn(() => "addSingleton");
      transform["getDependencyTokenValue"] = vi.fn((token) => tsFactory.createStringLiteral((token as any).text));
      transform["createUpdatedDependencyRegisterCallExpression"] = vi.fn();

      const node = tsFactory.createCallExpression(tsFactory.createIdentifier("invalidExpression"), undefined, []);
      const result = transform.execute(node);

      expect(result).toBeUndefined();
    });

    it("Should return undefined if methodName is not found", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["findMethodName"] = vi.fn(() => undefined);
      transform["getDependencyTokenValue"] = vi.fn((token) => tsFactory.createStringLiteral((token as any).text));
      transform["createUpdatedDependencyRegisterCallExpression"] = vi.fn();

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyRegistry"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const callExpression = tsFactory.createCallExpression(nodeExpression, undefined, []);
      const result = transform.execute(callExpression);
      expect(result).toBeUndefined();
    });

    it("Should return undefined if dependencyToken is missing", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["findMethodName"] = vi.fn(() => "addSingleton");
      transform["getDependencyTokenValue"] = vi.fn((token) => tsFactory.createStringLiteral((token as any).text));
      transform["createUpdatedDependencyRegisterCallExpression"] = vi.fn();

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyRegistry"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const callExpression = tsFactory.createCallExpression(
        nodeExpression,
        [
          /* No type arguments */
        ],
        [],
      );

      const result = transform.execute(callExpression);

      expect(result).toBeUndefined();
    });

    it("Should call createUpdatedDependencyRegisterCallExpression with correct arguments", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["findMethodName"] = vi.fn(() => "addSingleton");
      transform["getDependencyTokenValue"] = vi.fn((token) => tsFactory.createStringLiteral((token as any).text));
      transform["createUpdatedDependencyRegisterCallExpression"] = vi.fn();

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyRegistry"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const dependencyToken = tsFactory.createIdentifier("Token");
      dependencyToken["getText"] = () => dependencyToken.text;
      const classConstructor = tsFactory.createIdentifier("MyClass");
      classConstructor["getText"] = () => classConstructor.text;

      const callExpression = tsFactory.createCallExpression(
        nodeExpression,
        [dependencyToken, classConstructor] as any[],
        [],
      );

      transform.execute(callExpression);

      expect(transform["getDependencyTokenValue"]).toHaveBeenCalledOnce();
      expect(transform["getDependencyTokenValue"]).toHaveBeenCalledWith(dependencyToken);
      expect(transform["createUpdatedDependencyRegisterCallExpression"]).toHaveBeenCalledOnce();
      expect(transform["createUpdatedDependencyRegisterCallExpression"]).toHaveBeenCalledWith(
        callExpression,
        nodeExpression,
        "addSingleton",
        tsFactory.createStringLiteral("Token"),
        tsFactory.createIdentifier("MyClass"),
      );
    });

    it("Should handle case when typeArguments is undefined", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["findMethodName"] = vi.fn(() => "addSingleton");
      transform["getDependencyTokenValue"] = vi.fn((token) => tsFactory.createStringLiteral((token as any).text));
      transform["createUpdatedDependencyRegisterCallExpression"] = vi.fn();

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyRegistry"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const callExpression = tsFactory.createCallExpression(nodeExpression, undefined, []);

      const result = transform.execute(callExpression);

      expect(transform["createUpdatedDependencyRegisterCallExpression"]).not.toHaveBeenCalledOnce();
      expect(result).toBeUndefined();
    });

    it("Should use dependencyTokenExpr if classConstructor is undefined", () => {
      const { transform, tsFactory } = makeSut(new Map());

      transform["findMethodName"] = vi.fn(() => "addSingleton");
      transform["getDependencyTokenValue"] = vi.fn((token) => tsFactory.createStringLiteral((token as any).text));
      transform["createUpdatedDependencyRegisterCallExpression"] = vi.fn();

      const nodeExpression = tsFactory.createPropertyAccessExpression(
        tsFactory.createIdentifier("dependencyRegistry"),
        tsFactory.createIdentifier("addSingleton"),
      );

      const dependencyToken = tsFactory.createIdentifier("Token");
      dependencyToken["getText"] = () => dependencyToken.text;
      const callExpression = tsFactory.createCallExpression(nodeExpression, [dependencyToken] as any[], []);

      transform.execute(callExpression);

      expect(transform["getDependencyTokenValue"]).toHaveBeenCalledWith(dependencyToken);
      expect(transform["createUpdatedDependencyRegisterCallExpression"]).toHaveBeenCalledWith(
        callExpression,
        nodeExpression,
        "addSingleton",
        tsFactory.createStringLiteral("Token"),
        tsFactory.createIdentifier("Token"),
      );
    });
  });
});
