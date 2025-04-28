import { describe, it, expect, vi, afterEach } from "vitest";
import { ExceptionHandler } from "./exception-handler";
import { BaseDependencyContainerException } from "./base-dependency-container-exception";
import { TDependencyId } from "../types";

describe("ExceptionHandler", () => {
  const mockTokenStore = {
    getTokens: vi.fn(),
  } as any;
  const mockTokenType = {
    getTokenType: vi.fn(),
  } as any;
  const mockTokenName = {
    getTokenName: vi.fn(),
  } as any;
  const exceptionHandler: ExceptionHandler = new ExceptionHandler(mockTokenStore, mockTokenType, mockTokenName);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe(".createErrorMessage", () => {
    it("Should create a correctly formatted error message", () => {
      const result = exceptionHandler["createErrorMessage"]("MockTokenName", "Mock description");

      expect(result).toBe("Error: Mock description - Caused by: [MockTokenName]");
    });
  });

  describe(".getTokenNames", () => {
    it("Should return token names for valid dependencyIds", () => {
      const mockDependencyIds: Array<TDependencyId> = ["dep1", "dep2"];
      const mockTokens = [{}, {}];

      mockTokenStore.getTokens.mockReturnValue(mockTokens);
      mockTokenType.getTokenType.mockReturnValue("STRING");
      mockTokenName.getTokenName.mockReturnValue("mockToken");

      const result = exceptionHandler["getTokenNames"](mockDependencyIds);

      expect(result).toEqual(["(mockToken - mockToken)", "(mockToken - mockToken)"]);
    });

    it("Should handle unknown dependencyId gracefully", () => {
      const mockDependencyIds: Array<TDependencyId> = ["dep1"];
      mockTokenStore.getTokens.mockImplementation(() => {
        throw new Error("Token not found");
      });

      const result = exceptionHandler["getTokenNames"](mockDependencyIds);

      expect(result).toEqual(["(UNKNOWN DEPENDENCY ID: dep1)"]);
    });
  });

  describe(".handle", () => {
    it("Should create and throw an error with the correct message", () => {
      const mockException = new BaseDependencyContainerException(["dep1", "dep2"], "Test message");

      const mockTokens = {
        dependencyToken: {},
        qualifierToken: {},
      };

      mockTokenStore.getTokens.mockReturnValue(mockTokens);
      mockTokenType.getTokenType.mockReturnValue("STRING");
      mockTokenName.getTokenName.mockReturnValue("mockToken");

      const errorSpy = vi.spyOn(global, "Error").mockImplementationOnce(() => {
        const error = new Error("test");
        error.stack = "stackTrace";
        return error;
      });

      expect(() => exceptionHandler.handle(mockException)).toThrowError("test");
      expect(errorSpy).toHaveBeenCalled();
    });

    it("Should create a correct error message when no cause is provided", () => {
      const mockException = new BaseDependencyContainerException(["dep1", "dep2"], "Test message");
      const mockTokens = {
        dependencyToken: {},
        qualifierToken: {},
      };

      mockTokenStore.getTokens.mockReturnValue(mockTokens);
      mockTokenType.getTokenType.mockReturnValue("STRING");
      mockTokenName.getTokenName.mockReturnValue("mockToken");

      const errorSpy = vi.spyOn(global, "Error").mockImplementationOnce(() => {
        const error = new Error("test");
        error.stack = "stackTrace";
        return error;
      });

      expect(() => exceptionHandler.handle(mockException)).toThrowError("test");
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
