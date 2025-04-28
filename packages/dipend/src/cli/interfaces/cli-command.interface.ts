import { ArgumentsCamelCase, BuilderCallback } from "yargs";

export interface ICLICommand<TCommandArguments> {
  command: string;
  description: string;

  builder: BuilderCallback<{}, TCommandArguments>;
  handler: (
    args: ArgumentsCamelCase<TCommandArguments>,
  ) => void | Promise<void>;
}
