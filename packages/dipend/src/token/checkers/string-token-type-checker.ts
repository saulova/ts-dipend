import { IStrategy } from "../../seedwork";

export class StringTokenTypeChecker implements IStrategy<unknown, boolean> {
  public execute(token: unknown): boolean {
    return typeof token === "string";
  }
}
