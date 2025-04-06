# Print Pack

A NodeJS utility to generate Yu-Gi-Oh proxy files.

## Dependencies

- NodeJS (tested with 23.11.0)
- pnpm (tested with 10.7.1)

## Usage

1. Put your card images in a folder named 'img'
2. Run the 'run.bat' file if you're on Windows
3. Otherwise, run the following:

```sh
pnpm i
pnpm run gen
```

This will generate a 'out.pdf' file with the generated proxy.

## Repeating a card

To repeat a card, simply prepend a "X<number> - " to the file name, for example:

```
Card1.jpg => X3 - Card1.jpg
Monster Reborn.png => X256 - Monster Reborn.png
```

## Supported image formats

This application only supports:

- Jpeg files
- Png files
