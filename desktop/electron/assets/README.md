# Assets

## icon.svg
Source SVG icon (32x32 purple microphone).

## Generating icon files for Windows build

You need `icon.ico` and `icon.png` for the Electron builder and tray respectively.

### Using ImageMagick (if available):
```bash
convert icon.svg -resize 256x256 icon.png
convert icon.png -define icon:auto-resize="256,128,96,64,48,32,16" icon.ico
```

### Using online tools:
1. Upload `icon.svg` to https://convertio.co/svg-ico/
2. Save as `icon.ico` in this directory

### Quick Python alternative (requires Pillow + cairosvg):
```bash
pip install cairosvg Pillow
python -c "
import cairosvg, io
from PIL import Image

png_bytes = cairosvg.svg2png(url='icon.svg', output_width=256, output_height=256)
img = Image.open(io.BytesIO(png_bytes))
img.save('icon.png')
img.save('icon.ico', format='ICO', sizes=[(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)])
"
```

The `icon.png` (32x32) is used for the system tray at runtime.
The `icon.ico` is embedded in the Windows installer/executable.
