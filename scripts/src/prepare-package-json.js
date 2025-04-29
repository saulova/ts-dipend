import fs from "fs";
import path from "path";

if (process.argv.length !== 4) {
  console.error("Usage: node prepare-package-json.js <path-to-package.json> <destination-to-package.json>");
  process.exit(1);
}

const sourcePath = process.argv[2];
const destPath = process.argv[3];

function removeDistPathPrefix(filePath) {
  const prefix = "./dist/";

  if (filePath.startsWith(prefix)) {
    return `./${filePath.slice(prefix.length)}`;
  }

  return filePath;
}

function removeDistPackageJson(packageJson) {
  Object.keys(packageJson.bin ?? {}).forEach((key) => {
    packageJson.bin[key] = removeDistPathPrefix(packageJson.bin[key]);
  });

  Object.keys(packageJson.exports ?? {}).forEach((key) => {
    packageJson.exports[key] = removeDistPathPrefix(packageJson.exports[key]);
  });
}

try {
  const packageJson = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));

  delete packageJson.private;
  delete packageJson.scripts;
  delete packageJson.devDependencies;
  delete packageJson.type;
  delete packageJson.main;

  removeDistPackageJson(packageJson);

  fs.writeFileSync(destPath, JSON.stringify(packageJson, null, 2), "utf-8");

  console.log(`File saved to: ${destPath}`);
} catch (error) {
  console.error("Error processing the file:", error);
  process.exit(1);
}
