import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenNameResolver } from "./token-name-resolver";
import { TokenTypeEnum } from "../enums/token-type.enum";
import {
  ClassTokenNameStrategy,
  InterfaceSymbolTokenNameStrategy,
  StringTokenNameStrategy,
  SymbolTokenNameStrategy,
} from "./strategies";
import { IStrategy } from "../seedwork";

describe("TokenName", () => {
  let dependencyTokenName: TokenName;

  beforeEach(() => {
    dependencyTokenName = new TokenNameResolver();
  });

  describe(".setDefaultTokenNameStrategies", () => {
    it("Should set default token name strategies", () => {
      dependencyTokenName.setDefaultTokenNameStrategies();

      const classStrategy = dependencyTokenName["strategies"].get(TokenTypeEnum.CLASS_CONSTRUCTOR);
      const interfaceStrategy = dependencyTokenName["strategies"].get(TokenTypeEnum.INTERFACE_SYMBOL);
      const stringStrategy = dependencyTokenName["strategies"].get(TokenTypeEnum.STRING);
      const symbolStrategy = dependencyTokenName["strategies"].get(TokenTypeEnum.SYMBOL);

      expect(classStrategy).toBeInstanceOf(ClassTokenNameStrategy);
      expect(interfaceStrategy).toBeInstanceOf(InterfaceSymbolTokenNameStrategy);
      expect(stringStrategy).toBeInstanceOf(StringTokenNameStrategy);
      expect(symbolStrategy).toBeInstanceOf(SymbolTokenNameStrategy);
    });
  });

  describe(".setTokenNameStrategy", () => {
    it("Should allow adding custom token name strategies", () => {
      const mockStrategy = {
        execute: vi.fn(),
      } as unknown as IStrategy<unknown, string>;

      dependencyTokenName.setTokenNameStrategy("CUSTOM_TOKEN", mockStrategy);

      const customStrategy = dependencyTokenName["strategies"].get("CUSTOM_TOKEN");

      expect(customStrategy).toBe(mockStrategy);
    });
  });

  describe(".getTokenName", () => {
    it("Should return the token name using the appropriate strategy", () => {
      const mockStrategy = {
        execute: vi.fn().mockReturnValue("mock-token-name"),
      } as unknown as IStrategy<unknown, string>;

      dependencyTokenName.setTokenNameStrategy("CUSTOM", mockStrategy);

      const tokenName = dependencyTokenName.getTokenName({}, "CUSTOM");

      expect(mockStrategy.execute).toHaveBeenCalledWith({});
      expect(tokenName).toBe("mock-token-name");
    });

    it("Should return 'UNKNOWN' for unsupported token types", () => {
      const tokenName = dependencyTokenName.getTokenName({}, "UNSUPPORTED");

      expect(tokenName).toBe("UNKNOWN");
    });

    it("Should use default strategies if set", () => {
      dependencyTokenName.setDefaultTokenNameStrategies();

      const classToken = { name: "MyClass" };
      const symbolToken = Symbol("MySymbol");

      const classStrategy = dependencyTokenName["strategies"].get(TokenTypeEnum.CLASS_CONSTRUCTOR);
      const symbolStrategy = dependencyTokenName["strategies"].get(TokenTypeEnum.SYMBOL);

      const classSpy = vi.spyOn(classStrategy!, "execute");
      const symbolSpy = vi.spyOn(symbolStrategy!, "execute");

      dependencyTokenName.getTokenName(classToken, TokenTypeEnum.CLASS_CONSTRUCTOR);
      dependencyTokenName.getTokenName(symbolToken, TokenTypeEnum.SYMBOL);

      expect(classSpy).toHaveBeenCalledWith(classToken);
      expect(symbolSpy).toHaveBeenCalledWith(symbolToken);
    });
  });
});
