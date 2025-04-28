import { ArgumentsCamelCase, BuilderCallback } from "yargs";
import { ICLICommand } from "../interfaces";
import {
  proxyCommandBuilderHelper,
  proxyCommandHandlerHelper,
} from "../helpers";

export type TTsNodeCommandArguments = {};

export class TsNodeCommand implements ICLICommand<TTsNodeCommandArguments> {
  public command = "ts-node";
  public description = "Proxy command for ts-node";

  public builder: BuilderCallback<{}, TTsNodeCommandArguments> = (yargs) =>
    proxyCommandBuilderHelper(yargs);

  public handler = (
    args: ArgumentsCamelCase<TTsNodeCommandArguments>,
  ): void | Promise<void> => {
    console.log("Executing proxy command for ts-node\n");

    proxyCommandHandlerHelper("ts-node");
  };
}
