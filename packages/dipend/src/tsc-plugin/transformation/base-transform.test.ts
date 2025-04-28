import ts from "typescript";
import { describe, it, expect } from "vitest";
import { BaseTransform } from "./base-transform";

class ConcreteTransform extends BaseTransform {
  public execute(node: ts.Node) {
    return undefined;
  }
}

function makeSut() {
  const transform = new ConcreteTransform();

  return { transform };
}

describe("BaseTransform", () => {
  describe("interfaces", () => {
    it("Should throw an error if interfaces is not set", () => {
      const { transform } = makeSut();

      expect(() => transform["interfaces"]).toThrow("Set interfaces first.");
    });

    it("Should return the set interfaces", () => {
      const { transform } = makeSut();

      const mockInterfaces = new Map();

      transform.setInterfaces(mockInterfaces);

      const result = transform["interfaces"];

      expect(result).toEqual(mockInterfaces);
    });
  });

  describe("tsInstance", () => {
    it("Should throw an error if tsInstance is not set", () => {
      const { transform } = makeSut();

      expect(() => transform["tsInstance"]).toThrow("Set tsInstance first.");
    });

    it("Should return the set tsInstance", () => {
      const { transform } = makeSut();

      transform.setTsInstance(ts);

      const result = transform["tsInstance"];

      expect(result).toEqual(ts);
    });
  });

  describe("typeChecker", () => {
    it("Should throw an error if typeChecker is not set", () => {
      const { transform } = makeSut();

      expect(() => transform["typeChecker"]).toThrow("Set typeChecker first.");
    });

    it("Should return the set typeChecker", () => {
      const { transform } = makeSut();

      const mockTypeChecker = {} as ts.TypeChecker;

      transform.setTypeChecker(mockTypeChecker);

      const result = transform["typeChecker"];

      expect(result).toEqual(mockTypeChecker);
    });
  });

  describe("tsFactory", () => {
    it("Should throw an error if tsFactory is not set", () => {
      const { transform } = makeSut();

      expect(() => transform["tsFactory"]).toThrow("Set tsFactory first.");
    });

    it("Should return the set tsFactory", () => {
      const { transform } = makeSut();

      const mockFactory = ts.factory;

      transform.setTsFactory(mockFactory);

      const result = transform["tsFactory"];

      expect(result).toEqual(mockFactory);
    });
  });
});
