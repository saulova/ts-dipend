import { TscCommand } from "./tsc-command";

export class BuildCommand extends TscCommand {
  public command = "build";
  public description =
    "(alias) Proxy command for ts-patch TypeScript compiler patcher ";
}
