import { TokenTypeEnum } from "../enums/token-type.enum";
import { IStrategy } from "../seedwork";
import {
  ClassTokenTypeChecker,
  InterfaceSymbolTokenTypeChecker,
  StringTokenTypeChecker,
  SymbolTokenTypeChecker,
} from "./checkers";

export class TokenTypeResolver {
  private checkers: Map<string, IStrategy<unknown, boolean>> = new Map();

  public setDefaultTokenTypeCheckers(): void {
    this.checkers.set(TokenTypeEnum.CLASS_CONSTRUCTOR, new ClassTokenTypeChecker());
    this.checkers.set(TokenTypeEnum.INTERFACE_SYMBOL, new InterfaceSymbolTokenTypeChecker());
    this.checkers.set(TokenTypeEnum.STRING, new StringTokenTypeChecker());
    this.checkers.set(TokenTypeEnum.SYMBOL, new SymbolTokenTypeChecker());
  }

  public setTokenTypeChecker(tokenType: string, tokenTypeChecker: IStrategy<unknown, boolean>): void {
    this.checkers.set(tokenType, tokenTypeChecker);
  }

  public getTokenType(token: unknown): string {
    for (const [tokenType, tokenTypeChecker] of this.checkers.entries()) {
      if (tokenTypeChecker.execute(token)) {
        return tokenType;
      }
    }

    return "UNKNOWN";
  }
}
