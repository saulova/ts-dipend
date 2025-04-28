import { spawn } from "child_process";
import { Argv } from "yargs";

export function proxyCommandBuilderHelper(yargs: Argv<any>) {
  return yargs.parserConfiguration({ "unknown-options-as-args": true });
}

export function proxyCommandHandlerHelper(
  command: string,
): void | Promise<void> {
  const commandProcess = spawn(command, process.argv.slice(3), {
    stdio: "inherit",
  });

  commandProcess.on("close", (code) => {
    process.exit(code || 0);
  });
}
