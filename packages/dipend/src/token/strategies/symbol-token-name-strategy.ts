import { IStrategy } from "../../seedwork";

export class SymbolTokenNameStrategy implements IStrategy<symbol, string> {
  public execute(token: symbol): string {
    return token.description || "Unknown Symbol";
  }
}
