# Quill icon concepts

Source SVGs for the Quill app-icon exploration. **`nib.svg` is the chosen icon**
— it's the source the app icon set (`src-tauri/icons/*`) and the tray glyphs
(`tray/`) are generated from. The rest are kept for reference / future
revisions; do not delete.

Palette is baked as literal hex (an icon is a static raster):
ink accent `#4A3AD4`, deep ink `#221C57`, light ink `#A99EFF`, page `#F5F5FB`,
white `#FFFFFF`, inkwell tile `#14121F`–`#1B1A30`.

| File | Concept |
| --- | --- |
| `nib.svg` ✅ | Fountain-pen nib — chosen. Reads cleanest at tray/taskbar size. |
| `ink-drop.svg` | Ink drop whose tail curls into a Q, over the signature stroke. |
| `q-monogram.svg` | Page-white Q whose tail extends into the ink stroke + nib. |
| `refined-feather.svg` | Geometric feather distilled to vane + barbs + nib. |
| `ink-stroke-q.svg` | One calligraphic stroke looping into a Q. |
| `nib-on-page.svg` | Nib writing on a floating page tile. |
| `current-feather.svg` | The earlier in-app `QuillMark` feather (baseline). |

To regenerate the app icon set after editing `nib.svg`:

```bash
bun run tauri icon design/icon-concepts/nib.svg -o src-tauri/icons
# then remove the mobile output Quill doesn't use:
rm -rf src-tauri/icons/ios src-tauri/icons/android
```

Tray glyphs are generated from `tray/*.svg` (see that folder).
