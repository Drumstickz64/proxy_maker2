import fs from "fs/promises";
import path from "path";
import process from "process";

import { defaultArgs, generateProxy } from "./shared.js";

const INPUT_DIRECTORY = "img";
const OUT_FILE = "out.pdf";

main();

async function main() {
  const args = parseCliArgs();
  console.table(args);

  const imageFiles = await fs.readdir(INPUT_DIRECTORY);
  const images = [];
  for (const file of imageFiles) {
    const isSupported =
      path.extname(file) == ".jpg" || path.extname(file) == ".png";
    if (!isSupported) {
      console.log(`'${file}' is not a JPEG or PNG file, I will ignore it...`);
      continue;
    }

    let multiplier;
    if (!file.startsWith("X")) {
      multiplier = 1;
    } else {
      try {
        multiplier = parseMultiplier(file);
      } catch (e) {
        console.error(
          `detected that the file '${file}' should be repeated, but was unable to parse the multiplier`
        );
        console.log(
          "names of files you want to repeat should be: X<number> - <file name>"
        );
        console.log(
          "if you did not intend to make the file repeating, make sure it does not contain a capital X at the start of its name"
        );
        console.log("parsing error logged to file 'error.log'");
        fs.writeFile("error.log", e.message);
      }
    }

    let type;
    switch (path.extname(file)) {
      case ".jpg":
        type = "JPEG";
        break;
      case ".png":
        type = "PNG";
        break;
      default:
        console.warn(
          `unsupported image format '${path.extname(file)}', I will skip it...`
        );
        continue;
    }

    const bytes = await fs.readFile(path.join(INPUT_DIRECTORY, file));
    for (let i = 0; i < multiplier; i++) {
      images.push({
        bytes,
        type,
      });
    }
  }

  const proxy = await generateProxy(images, args);
  await fs.writeFile(OUT_FILE, proxy);

  console.log(`generated proxy file successfully! I wrote it to '${OUT_FILE}'`);
}

function parseCliArgs() {
  const args = { ...defaultArgs };

  const cliArgs = process.argv.slice(2);
  if (cliArgs.findIndex((argsString) => argsString == "--help") != -1) {
    printHelpMessage();
    process.exit();
  }

  for (let arg of cliArgs) {
    const [argName, value, ok] = parseCliArg(arg);
    if (!ok) {
      console.log(`invalid command line argument '${arg}', I will skip it`);
      continue;
    }

    switch (argName) {
      case "--num-cols":
        args.numCols = value;
        break;
      case "--num-rows":
        args.numRows = value;
        break;
      case "--horizontal-gap":
        args.horizontalGap = mmToPx(value);
        break;
      case "--vertical-gap":
        args.verticalGap = mmToPx(value);
        break;
      case "--min-horizontal-margin":
        args.minHorizontalMargin = mmToPx(value);
        break;
      case "--min-vertical-margin":
        args.minVerticalMargin = mmToPx(value);
        break;
      default:
        console.error(
          `unrecognized command line argument '${arg}', I will skip it`
        );
        break;
    }
  }

  return args;
}

function printHelpMessage() {
  console.log(
    `Usage: pnpm run gen [args]

Args:
  --help
  --num-cols
  --num-rows
  --horizontal-gap
  --vertical-gap
  --min-horizontal-margin
  --min-vertical-margin
`.trim()
  );
}

function parseCliArg(arg) {
  if (!arg.startsWith("--")) {
    return [null, null, false];
  }

  const [key, rawValue] = arg.split("=");

  const value = Number(rawValue);
  if (isNaN(value)) {
    return [null, null, false];
  }

  return [key, value, true];
}

function parseMultiplier(file) {
  let multiplierStr = file.split(" - ")[0];
  multiplierStr = multiplierStr.substring(1);
  let multiplier = parseInt(multiplierStr);

  if (isNaN(multiplier)) {
    throw EvalError(`invalid multiplier string ${multiplierStr}`);
  }

  return multiplier;
}
