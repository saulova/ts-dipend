import { ArgumentsCamelCase, BuilderCallback } from "yargs";
import fs from "fs";
import path from "path";
import { ICLICommand } from "../interfaces";
import { applyEdits, modify, parse } from "jsonc-parser";

export type TInitCommandArguments = {
  tsConfig: string;
  packageJson: string;
};

type TTsConfigFile = {
  [key: string]: any;
  "ts-node"?: {
    [key: string]: any;
    compiler?: string;
  };
  compilerOptions?: {
    [key: string]: any;
    lib?: Array<string>;
    plugins?: Array<{ transform: string; transformProgram: boolean }>;
  };
};

type TPackageJson = {
  [key: string]: any;
  scripts?: {
    [key: string]: any;
  };
  dependencies?: {
    [key: string]: any;
    dipend: string;
  };
  devDependencies?: {
    [key: string]: any;
    "ts-patch": string;
  };
};

export class InitCommand implements ICLICommand<TInitCommandArguments> {
  public readonly command = "init [tsConfigPath]";
  public readonly description = "Adds Dipend configurations to tsconfig.json";
  private recommendInstall = false;

  public builder: BuilderCallback<{}, TInitCommandArguments> = (yargs) => {
    return yargs
      .option("ts-config", {
        alias: "ts",
        describe: "Path to the tsconfig.json file",
        type: "string",
        default: "tsconfig.json",
      })
      .option("package-json", {
        alias: "p",
        describe: "Path to the package.json file",
        type: "string",
        default: "package.json",
      });
  };

  private readTsConfig(tsConfigPath: string): TTsConfigFile {
    if (!fs.existsSync(tsConfigPath)) {
      throw new Error("Missing tsconfig.json");
    }

    const content = fs.readFileSync(tsConfigPath, "utf-8");
    const parsed = parse(content);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid tsconfig.json format");
    }

    return parsed;
  }

  private readPackageJson(packageJsonPath: string): TPackageJson {
    let packageJson: TPackageJson = {};

    if (fs.existsSync(packageJsonPath)) {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    }

    if (Object.keys(packageJson).length === 0) {
      throw new Error("Missing package.json");
    }

    return packageJson;
  }

  private addTsNodeConfigs(tsConfig: TTsConfigFile): TTsConfigFile {
    if (tsConfig?.["ts-node"]?.compiler === "ts-patch/compiler") {
      console.log(`tsconfig.json: ts-patch already setted as ts-node compiler`);

      return tsConfig;
    }

    return {
      ...tsConfig,
      "ts-node": {
        ...(tsConfig?.["ts-node"] ?? {}),
        compiler: "ts-patch/compiler",
      },
    };
  }

  private addLibs(tsConfig: TTsConfigFile): TTsConfigFile {
    if (tsConfig?.compilerOptions?.lib?.includes("esnext.decorators")) {
      console.log(`tsconfig.json: esnext.decorators already exists in libs`);

      return tsConfig;
    }

    return {
      ...tsConfig,
      compilerOptions: {
        ...(tsConfig.compilerOptions ?? {}),
        lib: [...(tsConfig?.compilerOptions?.lib ?? []), "esnext.decorators"],
      },
    };
  }

  private addPlugins(tsConfig: TTsConfigFile): TTsConfigFile {
    if (
      tsConfig.compilerOptions?.plugins?.find(
        (plugin) => plugin.transform === "dipend/tsc-plugin" && plugin.transformProgram === true,
      ) !== undefined
    ) {
      console.log(`tsconfig.json: Dipend already exists in plugins`);

      return tsConfig;
    }

    const misconfiguredPluginIndex = tsConfig.compilerOptions?.plugins?.findIndex(
      (plugin) => plugin.transform === "dipend/tsc-plugin",
    );

    if (misconfiguredPluginIndex !== undefined && misconfiguredPluginIndex !== -1) {
      tsConfig.compilerOptions?.plugins?.splice(misconfiguredPluginIndex, 1);
    }

    return {
      ...tsConfig,
      compilerOptions: {
        ...tsConfig.compilerOptions,
        plugins: [
          ...(tsConfig.compilerOptions?.plugins ?? []),
          {
            transform: "dipend/tsc-plugin",
            transformProgram: true,
          },
        ],
      },
    };
  }

  private mergeTsConfig(tsConfig: TTsConfigFile): TTsConfigFile {
    const newTsConfig = [this.addTsNodeConfigs.bind(this), this.addLibs.bind(this), this.addPlugins.bind(this)].reduce(
      (mergedTsConfig, method) => method(mergedTsConfig),
      tsConfig,
    );

    return newTsConfig;
  }

  private addDipendCliTool(packageJson: TPackageJson): TPackageJson {
    if (packageJson.scripts) {
      for (const [scriptName, scriptCmd] of Object.entries(packageJson.scripts)) {
        if (typeof scriptCmd === "string") {
          if (/\bdipend\s+(ts-node|tsc)\b/.test(scriptCmd)) {
            continue;
          }

          const updatedCmd = scriptCmd.replace(/(^|\s)(ts-node|tsc)(\s|$)/g, "$1dipend $2$3");
          packageJson.scripts[scriptName] = updatedCmd;
        }
      }
    }

    return packageJson;
  }

  private addTsPatch(packageJson: TPackageJson): TPackageJson {
    if (packageJson.devDependencies?.["ts-patch"]) {
      console.log(`package.json: ts-patch already exists in devDependencies`);

      return packageJson;
    }

    this.recommendInstall = true;

    return {
      ...packageJson,
      devDependencies: {
        ...(packageJson.devDependencies ?? {}),
        "ts-patch": "3.3.0",
      },
    };
  }

  private getDipendVersion(): string {
    const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    return packageJson.version;
  }

  private addDipend(packageJson: TPackageJson): TPackageJson {
    if (packageJson.dependencies?.["dipend"]) {
      console.log(`package.json: dipend already exists in dependencies`);

      return packageJson;
    }

    this.recommendInstall = true;

    return {
      ...packageJson,
      dependencies: {
        ...(packageJson.dependencies ?? {}),
        dipend: this.getDipendVersion(),
      },
    };
  }

  private mergePackageJson(packageJson: TPackageJson): TPackageJson {
    const newPackageJson = [
      this.addDipendCliTool.bind(this),
      this.addTsPatch.bind(this),
      this.addDipend.bind(this),
    ].reduce((mergedPackageJson, method) => method(mergedPackageJson), packageJson);

    return newPackageJson;
  }

  private applyChangesAndKeepComments(originalTsConfigAsString: string, mergedTsConfig: TTsConfigFile) {
    const formattingOptions = { insertSpaces: true, tabSize: 2 };
    let result = originalTsConfigAsString;

    if (mergedTsConfig["ts-node"]?.compiler) {
      const edit = modify(result, ["ts-node", "compiler"], mergedTsConfig["ts-node"].compiler, {
        formattingOptions,
      });

      result = applyEdits(result, edit);
    }

    if (mergedTsConfig.compilerOptions?.lib) {
      const edit = modify(result, ["compilerOptions", "lib"], mergedTsConfig.compilerOptions.lib, {
        formattingOptions,
      });

      result = applyEdits(result, edit);
    }

    if (mergedTsConfig.compilerOptions?.plugins) {
      const edit = modify(result, ["compilerOptions", "plugins"], mergedTsConfig.compilerOptions.plugins, {
        formattingOptions,
      });

      result = applyEdits(result, edit);
    }

    return result;
  }

  public handler = async (args: ArgumentsCamelCase<TInitCommandArguments>): Promise<void> => {
    try {
      const tsConfigPath = path.resolve(args.tsConfig);
      const packageJsonPath = path.resolve(args.packageJson);

      const tsConfig = this.readTsConfig(tsConfigPath);
      const originalTsConfigAsString = fs.readFileSync(tsConfigPath, "utf-8");
      const packageJson = this.readPackageJson(packageJsonPath);

      const mergedTsConfig = this.mergeTsConfig(tsConfig);
      console.log(`Dipend configurations successfully added to tsconfig.json`);
      const mergedPackageJson = this.mergePackageJson(packageJson);
      console.log(`Dipend configurations successfully added to package.json`);

      if (this.recommendInstall) console.log("Dipend: Please, run npm install again");

      const newTsConfig = this.applyChangesAndKeepComments(originalTsConfigAsString, mergedTsConfig);

      fs.writeFileSync(tsConfigPath, newTsConfig, "utf-8");
      fs.writeFileSync(packageJsonPath, JSON.stringify(mergedPackageJson, null, 2));
    } catch (error) {
      console.error("Error updating tsconfig.json or package.json:", error);
    }
  };
}
