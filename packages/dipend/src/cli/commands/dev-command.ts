import { TsNodeCommand } from "./ts-node-command";

export class DevCommand extends TsNodeCommand {
  public command = "dev";
  public description = "(alias) Proxy command for ts-node";
}
