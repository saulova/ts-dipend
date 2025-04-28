import { MetadataHelper } from ".";
import { TClassConstructor } from "../types";

export function injectHelper(target: TClassConstructor, injectableTokens: Array<any>) {
  MetadataHelper.setConstructorParamsMetadata(target, injectableTokens);
}
