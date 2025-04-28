import { IStrategy } from "../../seedwork";
import { TClassConstructor } from "../../types";

export class ClassTokenNameStrategy implements IStrategy<TClassConstructor, string | undefined> {
  public execute(token: TClassConstructor): string {
    return token.name;
  }
}
