import fs from "fs/promises";
import path from "path";
import { PageSizes, PDFDocument } from "pdf-lib";

const _MM_TO_PX = 2.8346666667;

const NUM_COLS = 4;
const NUM_ROWS = 2;
const HORIZONTAL_GAP = 3 * _MM_TO_PX;
const VERTICAL_GAP = 3 * _MM_TO_PX;
const MIN_HORIZONTAL_MARGIN = 6.35 * _MM_TO_PX;
const MIN_VERTICAL_MARGIN = 6.35 * _MM_TO_PX;

const PAGE_SIZE = portraitToLandscape(PageSizes.A4);
const [PAGE_WIDTH, PAGE_HEIGHT] = PAGE_SIZE;

const TYPICAL_CARD_WIDTH = 59 * _MM_TO_PX;
const TYPICAL_CARD_HEIGHT = 86 * _MM_TO_PX;
const INPUT_DIRECTORY = "img";
const OUT_FILE = "out.pdf";

main();

async function main() {
  const pdfDoc = await PDFDocument.create();

  const imageFiles = await fs.readdir(INPUT_DIRECTORY);
  const imageObjs = await Promise.all(
    imageFiles.map(async (file) => {
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

  const [horizontalMargin, verticalMargin] = calcActualMarginSize(
    cardWidth,
    cardHeight,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    NUM_COLS,
    HORIZONTAL_GAP,
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

function calcActualMarginSize(
  cardWidth,
  cardHeight,
  pageWidth,
  pageHeight,
  cols,
  horizontalGap,
  rows,
  verticalGap
) {
  const contentWidth = cols * cardWidth;
  const totalHorizontalGapSize = (cols - 1) * horizontalGap;
  const horizontalMargin = pageWidth - (contentWidth + totalHorizontalGapSize);

  const contentHeight = rows * cardHeight;
  const totalVerticalGapSize = (rows - 1) * verticalGap;
  const verticalMargin = pageHeight - (contentHeight + totalVerticalGapSize);

  return [horizontalMargin, verticalMargin];
}

function portraitToLandscape([width, height]) {
  return [height, width];
}
