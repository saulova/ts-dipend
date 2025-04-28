import { describe, it, expect, vi, afterEach } from "vitest";
import { injectHelper } from "./inject-helper";
import { MetadataHelper } from ".";

describe("injectHelper", () => {
  vi.mock("../helpers", () => ({
    MetadataHelper: {
      setConstructorParamsMetadata: vi.fn(),
    },
  }));

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should call MetadataHelper.setConstructorParamsMetadata with the target and injectableTokens", () => {
    const mockTarget = class {};
    const injectableTokens = ["token1", "token2"];

    injectHelper(mockTarget, injectableTokens);

    expect(MetadataHelper.setConstructorParamsMetadata).toHaveBeenCalledWith(mockTarget, injectableTokens);
  });

  it("Should handle empty injectableTokens array", () => {
    const mockTarget = class {};
    const injectableTokens: Array<any> = [];

    injectHelper(mockTarget, injectableTokens);

    expect(MetadataHelper.setConstructorParamsMetadata).toHaveBeenCalledWith(mockTarget, injectableTokens);
  });
});
