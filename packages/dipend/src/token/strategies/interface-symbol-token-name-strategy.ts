import { IStrategy } from "../../seedwork";

export class InterfaceSymbolTokenNameStrategy implements IStrategy<symbol, string> {
  public execute(token: symbol): string {
    return token.description?.split("_")[1] || "Unknown Interface Symbol";
  }
}
