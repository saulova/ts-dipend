import { IStrategy } from "../../seedwork";

export class StringTokenNameStrategy implements IStrategy<string, string> {
  public execute(token: string): string {
    return token || "Empty String";
  }
}
