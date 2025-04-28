import fs from "fs";

if (process.argv.length !== 4) {
  console.error("Usage: node prepare-package-json.js <path-to-package.json> <destination-to-package.json>");
  process.exit(1);
}

const sourcePath = process.argv[2];
const destPath = process.argv[3];

try {
  const packageJson = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));

  delete packageJson.private;
  delete packageJson.scripts;
  delete packageJson.devDependencies;
  delete packageJson.type;
  delete packageJson.main;

  fs.writeFileSync(destPath, JSON.stringify(packageJson, null, 2), "utf-8");

  console.log(`File saved to: ${destPath}`);
} catch (error) {
  console.error("Error processing the file:", error);
  process.exit(1);
}
