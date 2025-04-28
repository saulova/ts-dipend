import fs from "fs";

if (process.argv.length !== 4) {
  console.error("Usage: node normalize-version.js <path-to-package.json> <destination-to-package.json>");
  process.exit(1);
}

const sourcePath = process.argv[2];
const destPath = process.argv[3];

try {
  const packageJson = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
  const version = packageJson.version;

  const destPackageJson = JSON.parse(fs.readFileSync(destPath, "utf-8"));
  destPackageJson.version = version;

  fs.writeFileSync(destPath, JSON.stringify(destPackageJson, null, 2), "utf-8");

  console.log(`Version Normalized At: ${destPath}`);
} catch (error) {
  console.error("Error processing the file:", error);
  process.exit(1);
}
