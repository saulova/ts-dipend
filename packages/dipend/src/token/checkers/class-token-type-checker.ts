import { IStrategy } from "../../seedwork";

export class ClassTokenTypeChecker implements IStrategy<unknown, boolean> {
  public execute(token: unknown): boolean {
    return typeof token === "function" && token?.constructor !== undefined && token?.prototype !== undefined;
  }
}
