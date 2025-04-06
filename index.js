import fs from "fs/promises";
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

main();

async function main() {
  const imageBytes = await fs.readFile("img/test.jpg");

  const pdfDoc = await PDFDocument.create();

  const imageObj = await pdfDoc.embedJpg(imageBytes);

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

  const cardScale = Math.min(
    maxCardWidth / imageObj.width,
    maxCardHeight / imageObj.height
  );

  const cardDims = imageObj.scale(cardScale);

  const [horizontalMargin, verticalMargin] = calcActualMarginSize(
    cardDims,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    NUM_COLS,
    HORIZONTAL_GAP,
    NUM_ROWS,
    VERTICAL_GAP
  );

  const page = pdfDoc.addPage(PAGE_SIZE);

  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      page.drawImage(imageObj, {
        x: horizontalMargin / 2 + j * (cardDims.width + HORIZONTAL_GAP),
        y: verticalMargin / 2 + i * (cardDims.height + VERTICAL_GAP),
        width: cardDims.width,
        height: cardDims.height,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile("out.pdf", pdfBytes);
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
  cardDims,
  pageWidth,
  pageHeight,
  cols,
  horizontalGap,
  rows,
  verticalGap
) {
  const contentWidth = cols * cardDims.width;
  const totalHorizontalGapSize = (cols - 1) * horizontalGap;
  const horizontalMargin = pageWidth - (contentWidth + totalHorizontalGapSize);

  const contentHeight = rows * cardDims.height;
  const totalVerticalGapSize = (rows - 1) * verticalGap;
  const verticalMargin = pageHeight - (contentHeight + totalVerticalGapSize);

  return [horizontalMargin, verticalMargin];
}

function portraitToLandscape([width, height]) {
  return [height, width];
}
