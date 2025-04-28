import { describe, it, expect, vi, afterEach, afterAll } from "vitest";
import { Inject } from "./inject-decorator";
import { injectHelper } from "../helpers";

describe("Inject decorator", () => {
  vi.mock("../helpers", () => ({
    injectHelper: vi.fn(),
  }));

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should call injectHelper with the target and injectable tokens for classes", () => {
    const mockInjectableTokens = ["token1", "token2"];
    const mockTarget = class MockClass {};
    const addInitializerSpy = vi.fn();
    const mockContext = {
      kind: "class",
      addInitializer: addInitializerSpy,
    } as unknown as ClassDecoratorContext<abstract new (...args: any) => any>;

    Inject(...mockInjectableTokens)(mockTarget, mockContext);

    expect(addInitializerSpy).toHaveBeenCalled();

    const initializerFn = addInitializerSpy.mock.calls[0][0];
    initializerFn();

    expect(injectHelper).toHaveBeenCalledWith(mockTarget, mockInjectableTokens);
  });

  it("Should throw an error if used on a non-class context", () => {
    const mockInjectableTokens = ["token1", "token2"];
    const mockTarget = {};
    const addInitializerSpy = vi.fn();
    const mockContext = {
      kind: "method",
      addInitializer: addInitializerSpy,
    } as unknown as ClassDecoratorContext<abstract new (...args: any) => any>;

    expect(addInitializerSpy).not.toHaveBeenCalled();

    expect(() => Inject(...mockInjectableTokens)(mockTarget, mockContext)).toThrowError(
      "Inject just work with classes.",
    );
  });
});
