import fs from "fs";
import path from "path";

const npmrcContent = `//registry.npmjs.org/:_authToken=\$\{NODE_AUTH_TOKEN\}
registry=https://registry.npmjs.org/
always-auth=true`;

const destPath = process.argv[2];

const npmrcPath = path.join(destPath, ".npmrc");

fs.writeFileSync(npmrcPath, npmrcContent, "utf8");

console.log(`File saved to: ${npmrcPath}`);
