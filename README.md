# GAYA - AI Form Helper Chrome Extension

An intelligent Chrome extension that uses AI to extract, store, and fill form data across websites with a persistent interactive clipboard.

## Features

- **Super Copy**: Extract form data from any webpage with one click
- **Super Paste**: Intelligently fill forms using clipboard data
- **Interactive Clipboard**: View, edit, and manage extracted data
- **Smart Field Mapping**: AI-powered semantic field matching
- **Multi-Entity Support**: Handle multiple customers, vehicles, addresses
- **Persistent Storage**: Data saved locally across sessions

## Development

### Prerequisites

- Node.js 18+ (note: v20+ recommended for Vite)
- npm or yarn

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

This will create a `dist` folder with the compiled extension.

### Loading in Chrome

1. Build the extension (`npm run build`)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder

### Development Tips

- After making changes, run `npm run build` again
- Click the reload icon in `chrome://extensions/` to update the extension
- Check the console in the popup/sidepanel for debugging
- Use Chrome DevTools on web pages to debug content scripts

## Project Structure

```
formhelper/
├── src/
│   ├── background/          # Service worker
│   ├── content/             # Content scripts (DOM extraction/filling)
│   ├── popup/               # Extension popup UI
│   ├── sidepanel/           # Clipboard viewer UI
│   └── shared/              # Shared types and utilities
├── public/
│   ├── manifest.json        # Extension manifest
│   └── icons/               # Extension icons
├── popup.html               # Popup entry point
├── sidepanel.html           # Sidepanel entry point
└── vite.config.ts           # Build configuration
```

## Usage

### Super Copy

1. Navigate to a webpage with a form
2. Fill out the form (or use a form that's already filled)
3. Click the GAYA extension icon
4. Click "Super Copy"
5. Data is extracted and saved to clipboard

### Super Paste

1. Navigate to a different webpage with a form
2. Click the GAYA extension icon
3. Click "Super Paste"
4. Form fields are automatically filled

### See Clipboard

1. Click "See Clipboard" to open the side panel
2. View all extracted entities and fields
3. Toggle fields on/off for selective pasting
4. Click on values to edit them
5. Search for specific fields

## Roadmap

- [ ] OpenAI integration for advanced field mapping
- [ ] Document upload & OCR
- [ ] PDF form filling
- [ ] Default values system
- [ ] Saved records and search
- [ ] Team collaboration features

## License

ISC
