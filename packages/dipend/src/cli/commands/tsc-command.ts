import { ArgumentsCamelCase, BuilderCallback } from "yargs";
import { ICLICommand } from "../interfaces";
import {
  proxyCommandBuilderHelper,
  proxyCommandHandlerHelper,
} from "../helpers";

export type TTscCommandArguments = {};

export class TscCommand implements ICLICommand<TTscCommandArguments> {
  public command = "tsc";
  public description = "Proxy command for ts-patch TypeScript compiler patcher";

  public builder: BuilderCallback<{}, TTscCommandArguments> = (yargs) =>
    proxyCommandBuilderHelper(yargs);

  public handler = (
    args: ArgumentsCamelCase<TTscCommandArguments>,
  ): void | Promise<void> => {
    console.log("Executing proxy command for ts-patch TypeScript compiler");

    proxyCommandHandlerHelper("tspc");
  };
}
