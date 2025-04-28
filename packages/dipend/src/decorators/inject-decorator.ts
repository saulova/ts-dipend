import { injectHelper } from "../helpers";

export function Inject(...injectableTokens: Array<any>) {
  return (target: any, context: ClassDecoratorContext) => {
    if (context.kind === "class") {
      context.addInitializer(function () {
        injectHelper(target, injectableTokens);

        return;
      });

      return;
    }

    throw new Error("Inject just work with classes.");
  };
}
