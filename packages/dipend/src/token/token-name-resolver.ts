import { TokenTypeEnum } from "../enums/token-type.enum";
import { IStrategy } from "../seedwork";
import {
  ClassTokenNameStrategy,
  InterfaceSymbolTokenNameStrategy,
  StringTokenNameStrategy,
  SymbolTokenNameStrategy,
} from "./strategies";

export class TokenNameResolver {
  private strategies: Map<string, IStrategy<unknown, string>> = new Map();

  public setDefaultTokenNameStrategies(): void {
    this.strategies.set(TokenTypeEnum.CLASS_CONSTRUCTOR, new ClassTokenNameStrategy());
    this.strategies.set(TokenTypeEnum.INTERFACE_SYMBOL, new InterfaceSymbolTokenNameStrategy());
    this.strategies.set(TokenTypeEnum.STRING, new StringTokenNameStrategy());
    this.strategies.set(TokenTypeEnum.SYMBOL, new SymbolTokenNameStrategy());
  }

  public setTokenNameStrategy(tokenType: string, tokenNameStrategy: IStrategy<unknown, string>): void {
    this.strategies.set(tokenType, tokenNameStrategy);
  }

  public getTokenName(token: unknown, tokenType: string): string {
    const strategy = this.strategies.get(tokenType);

    if (strategy === undefined) {
      return "UNKNOWN";
    }

    return strategy.execute(token);
  }
}
