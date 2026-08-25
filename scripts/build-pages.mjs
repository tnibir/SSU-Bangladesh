import { cp, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "NSIS-Current State & Projection");
const outputFlag = process.argv.indexOf("--output");

if (outputFlag >= 0 && !process.argv[outputFlag + 1]) {
  throw new Error("--output requires a directory path");
}

const output = path.resolve(outputFlag >= 0 ? process.argv[outputFlag + 1] : path.join(root, "_site"));
const contains = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

if (output === path.parse(output).root || contains(output, root) || contains(source, output)) {
  throw new Error(`Refusing unsafe Pages output path: ${output}`);
}

await rm(output, { recursive: true, force: true });
await cp(source, output, {
  recursive: true,
  filter: sourcePath => {
    const name = path.basename(sourcePath);
    return name !== ".DS_Store" && !name.startsWith("~$");
  }
});
