import { IStrategy } from "../../seedwork";

export class SymbolTokenTypeChecker implements IStrategy<unknown, boolean> {
  public execute(token: unknown): boolean {
    return typeof token === "symbol" && !RegExp("^DI_(.*)_(.*)$").test(token.description || "");
  }
}
