import { readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { diffLines } from "diff";

async function readTextFile(filePath) {
  try {
    const absolutePath = resolve(filePath);
    return {
      content: await readFile(absolutePath, "utf8"),
      filename: basename(absolutePath),
    };
  } catch (err) {
    console.error(`Error reading file "${filePath}":`, err.message);
    throw err;
  }
}

async function compareFiles(file1, file2) {
  try {
    const [
      { content: content1, filename: filename1 },
      { content: content2, filename: filename2 },
    ] = await Promise.all([readTextFile(file1), readTextFile(file2)]);

    const diffs = diffLines(content1, content2);

    // Filter and display only changed lines
    const changedLines = diffs.filter((part) => part.added || part.removed);

    if (changedLines.length === 0) {
      console.log("No differences found between files.");
      return;
    }

    changedLines.forEach((part) => {
      // Default color
      let color = "\x1b[0m";
      let fileSource = "";

      if (part.added) {
        // Green for added lines
        color = "\x1b[32m";
        fileSource = `[+${filename2}] `;
      } else if (part.removed) {
        // Red for removed lines
        color = "\x1b[31m";
        fileSource = `[-${filename1}] `;
      }

      // Write with filename prefix, color, value, reset color, and newline
      process.stdout.write(`${color}${fileSource}${part.value}\x1b[0m\n`);
    });
  } catch (error) {
    console.error("Error comparing files:", error.message);
    process.exit(1);
  }
}

function validateArgs(args) {
  if (args.length !== 2) {
    console.error("Usage: node index.js <file1> <file2>");
    process.exit(1);
  }
}

function main() {
  const [, , ...args] = process.argv;
  validateArgs(args);
  const [file1, file2] = args;

  compareFiles(file1, file2).catch(() => process.exit(1));
}

main();
