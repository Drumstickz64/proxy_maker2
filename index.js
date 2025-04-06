import fs from "fs/promises";
import path from "path";
import { PageSizes, PDFDocument } from "pdf-lib";

const NUM_COLS = 4;
const NUM_ROWS = 2;
const HORIZONTAL_GAP = mmToPx(3);
const VERTICAL_GAP = mmToPx(3);
const MIN_HORIZONTAL_MARGIN = mmToPx(6.35);
const MIN_VERTICAL_MARGIN = mmToPx(6.35);

const PAGE_SIZE = portraitToLandscape(PageSizes.A4);
const [PAGE_WIDTH, PAGE_HEIGHT] = PAGE_SIZE;

const TYPICAL_CARD_WIDTH = mmToPx(59);
const TYPICAL_CARD_HEIGHT = mmToPx(86);
const INPUT_DIRECTORY = "img";
const OUT_FILE = "out.pdf";

main();

async function main() {
  const pdfDoc = await PDFDocument.create();

  const imageFiles = await fs.readdir(INPUT_DIRECTORY);
  const imageObjs = await Promise.all(
    imageFiles
      .flatMap((file) => {
        if (!file.startsWith("X")) {
          return [file];
        }
        let multiplier;
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
          return [file];
        }

        return Array(multiplier).fill(file);
      })
      .map(async (file) => {
        const bytes = await fs.readFile(path.join(INPUT_DIRECTORY, file));
        return pdfDoc.embedJpg(bytes);
      })
  );

  const maxCardWidth = calcCardDim(
    PAGE_WIDTH,
    MIN_HORIZONTAL_MARGIN,
    NUM_COLS,
    HORIZONTAL_GAP
  );
  const maxCardHeight = calcCardDim(
    PAGE_HEIGHT,
    MIN_VERTICAL_MARGIN,
    NUM_ROWS,
    VERTICAL_GAP
  );

  // There is a method `PDFImage.scaleToFit` that does a similar thing to this
  // but uses actual dimensions of the image instead of the dimensions
  // of a typical Yu-Gi-Oh card
  //
  // A method that uses scaleToFit would (I assume) have a messed up layout if
  // any of the images had a different aspect-ratio than the others
  //
  // Where as this method would distort the image to keep the layout consistent
  const cardWidthScale = maxCardWidth / TYPICAL_CARD_WIDTH;
  const cardHeightScale = maxCardHeight / TYPICAL_CARD_HEIGHT;
  const cardScale = Math.min(cardWidthScale, cardHeightScale);

  let cardWidth = TYPICAL_CARD_WIDTH * cardScale;
  let cardHeight = TYPICAL_CARD_HEIGHT * cardScale;

  const horizontalMargin = calcActualMarginSize(
    cardWidth,
    PAGE_WIDTH,
    NUM_COLS,
    HORIZONTAL_GAP
  );
  const verticalMargin = calcActualMarginSize(
    cardHeight,
    PAGE_HEIGHT,
    NUM_ROWS,
    VERTICAL_GAP
  );

  const numPages = imageObjs.length / (NUM_COLS * NUM_ROWS);

  pageLoop: for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
    const page = pdfDoc.addPage(PAGE_SIZE);

    for (let row = 0; row < NUM_ROWS; row++) {
      for (let col = 0; col < NUM_COLS; col++) {
        const imageIndex =
          pageIndex * NUM_ROWS * NUM_COLS + row * NUM_COLS + col;

        if (imageIndex >= imageObjs.length) {
          break pageLoop;
        }
        const imageObj = imageObjs[imageIndex];
        page.drawImage(imageObj, {
          x: horizontalMargin / 2 + col * (cardWidth + HORIZONTAL_GAP),
          y: verticalMargin / 2 + row * (cardHeight + VERTICAL_GAP),
          width: cardWidth,
          height: cardHeight,
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(OUT_FILE, pdfBytes);
}

function calcCardDim(totalSize, margin, numItems, gapSize) {
  let contentSize = calcContentSize(totalSize, margin, numItems, gapSize);

  return contentSize / numItems;
}

function calcContentSize(totalSize, margin, numItems, gapSize) {
  let totalGapSize = (numItems - 1) * gapSize;

  return totalSize - (margin + totalGapSize);
}

function calcActualMarginSize(cardSize, pageSize, numCards, gap) {
  const contentSize = numCards * cardSize;
  const totalGapSize = (numCards - 1) * gap;
  const margin = pageSize - (contentSize + totalGapSize);

  return margin;
}

function mmToPx(mm) {
  return mm * 2.8346666667;
}

function portraitToLandscape([width, height]) {
  return [height, width];
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
