import { describe, vi, it, expect, afterEach } from "vitest";
import { TokenTypeResolver } from "./token-type-resolver";
import { TokenTypeEnum } from "../enums/token-type.enum";
import {
  ClassTokenTypeChecker,
  InterfaceSymbolTokenTypeChecker,
  StringTokenTypeChecker,
  SymbolTokenTypeChecker,
} from "./checkers";
import { IStrategy } from "../seedwork";

describe("TokenType", () => {
  let dependencyTokenType: TokenTypeResolver = new TokenTypeResolver();

  afterEach(() => {
    dependencyTokenType = new TokenTypeResolver();
  });

  describe(".setDefaultTokenTypeCheckers", () => {
    it("Should set default token type checkers", () => {
      dependencyTokenType.setDefaultTokenTypeCheckers();

      const classChecker = dependencyTokenType["checkers"].get(TokenTypeEnum.CLASS_CONSTRUCTOR);
      const interfaceChecker = dependencyTokenType["checkers"].get(TokenTypeEnum.INTERFACE_SYMBOL);
      const stringChecker = dependencyTokenType["checkers"].get(TokenTypeEnum.STRING);
      const symbolChecker = dependencyTokenType["checkers"].get(TokenTypeEnum.SYMBOL);

      expect(classChecker).toBeInstanceOf(ClassTokenTypeChecker);
      expect(interfaceChecker).toBeInstanceOf(InterfaceSymbolTokenTypeChecker);
      expect(stringChecker).toBeInstanceOf(StringTokenTypeChecker);
      expect(symbolChecker).toBeInstanceOf(SymbolTokenTypeChecker);
    });
  });

  describe(".setTokenTypeChecker", () => {
    it("Should allow adding custom token type checkers", () => {
      const mockChecker = { execute: () => true } as unknown as IStrategy<unknown, boolean>;

      dependencyTokenType.setTokenTypeChecker("CUSTOM_TOKEN_TYPE", mockChecker);

      const customChecker = dependencyTokenType["checkers"].get("CUSTOM_TOKEN_TYPE");

      expect(customChecker).toBe(mockChecker);
    });
  });

  describe(".getTokenType", () => {
    it("Should return the correct token type for a given token", () => {
      const mockClassToken = class MyClass {};
      const mockSymbolToken = Symbol("DI_SomePattern");
      const mockStringToken = "my-string";

      dependencyTokenType.setDefaultTokenTypeCheckers();

      expect(dependencyTokenType.getTokenType(mockClassToken)).toBe(TokenTypeEnum.CLASS_CONSTRUCTOR);
      expect(dependencyTokenType.getTokenType(mockSymbolToken)).toBe(TokenTypeEnum.SYMBOL);
      expect(dependencyTokenType.getTokenType(mockStringToken)).toBe(TokenTypeEnum.STRING);
    });

    it("Should return 'UNKNOWN' for an unsupported token", () => {
      const unsupportedToken = 42;

      const result = dependencyTokenType.getTokenType(unsupportedToken);

      expect(result).toBe("UNKNOWN");
    });

    it("Should return the correct token type for custom checkers", () => {
      const customChecker = {
        execute: vi.fn().mockReturnValue(true),
      } as unknown as IStrategy<unknown, boolean>;
      dependencyTokenType.setTokenTypeChecker("CUSTOM", customChecker);

      const mockToken = {};

      const result = dependencyTokenType.getTokenType(mockToken);

      expect(result).toBe("CUSTOM");
    });
  });
});
