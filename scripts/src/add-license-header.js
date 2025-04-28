import fs from "fs";
import { glob } from "glob";

const licenseHeader = `/*
 * Copyright 2025 Saulo V. Alvarenga. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
`;

const packagePath = process.argv[2];

const globPatterns = [
  `${packagePath}/dist/**/*.ts`,
  `${packagePath}/dist/**/*.js`,
  `!${packagePath}/**/node_modules/**/*`,
];

function addLicenseHeader(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");

  if (!fileContent.includes(licenseHeader)) {
    const newContent = licenseHeader + "\n" + fileContent;
    fs.writeFileSync(filePath, newContent, "utf8");
  }
}

globPatterns.forEach((pattern) => {
  glob.sync(pattern).forEach((filePath) => {
    addLicenseHeader(filePath);
  });
});

console.log("License header addition complete.");
