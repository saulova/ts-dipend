import yargs, { BuilderCallback } from "yargs";
import { hideBin } from "yargs/helpers";
import { InitCommand, TscCommand, TspcCommand, BuildCommand, TsNodeCommand, DevCommand } from "./commands";

console.log("========================");
console.log("       Dipend CLI");
console.log("========================\n");

const commandList = [
  new InitCommand(),
  new TscCommand(),
  new TspcCommand(),
  new BuildCommand(),
  new TsNodeCommand(),
  new DevCommand(),
];

var yargsInstance = yargs(hideBin(process.argv));

commandList.forEach((command) =>
  yargsInstance.command(
    command.command,
    command.description,
    command.builder as BuilderCallback<any, any>,
    command.handler,
  ),
);

yargsInstance.help().demandCommand().argv;
