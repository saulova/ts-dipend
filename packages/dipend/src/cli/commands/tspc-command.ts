import { ArgumentsCamelCase, BuilderCallback } from "yargs";
import { ICLICommand } from "../interfaces";
import { proxyCommandBuilderHelper, proxyCommandHandlerHelper } from "../helpers";

export type TTspcCommandArguments = {};

export class TspcCommand implements ICLICommand<TTspcCommandArguments> {
  public command = "tspc";
  public description = "Proxy command for ts-patch TypeScript compiler patcher";

  public builder: BuilderCallback<{}, TTspcCommandArguments> = (yargs) => proxyCommandBuilderHelper(yargs);

  public handler = (args: ArgumentsCamelCase<TTspcCommandArguments>): void | Promise<void> => {
    console.log("Executing proxy command for ts-patch TypeScript compiler");

    proxyCommandHandlerHelper("tspc");
  };
}
