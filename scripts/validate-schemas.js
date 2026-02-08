/**
 * Validates that JSON schema files are well-formed.
 * Run as part of CI to catch schema errors early.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const schemasDir = join(import.meta.dirname, "..", "schemas");
const files = readdirSync(schemasDir).filter((f) => f.endsWith(".json"));

let hasErrors = false;

for (const file of files) {
  const path = join(schemasDir, file);
  try {
    const content = readFileSync(path, "utf-8");
    const schema = JSON.parse(content);

    // Basic schema structure checks
    if (!schema.$schema) {
      console.error(`${file}: missing $schema property`);
      hasErrors = true;
    }
    if (!schema.type && !schema.$defs) {
      console.error(`${file}: missing top-level type or $defs property`);
      hasErrors = true;
    }

    console.log(`${file}: valid`);
  } catch (e) {
    console.error(`${file}: ${e.message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log(`\nAll ${files.length} schemas validated successfully.`);
