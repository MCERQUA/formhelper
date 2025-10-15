# GAYA Chrome Extension - Installation Guide

## Quick Start

The GAYA Chrome extension has been built and is ready to install!

### Installation Steps

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or click the three dots menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" ON in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `dist` folder in this project
   - Select the folder and click "Select Folder"

4. **Verify Installation**
   - You should see "GAYA - AI Form Helper" in your extensions list
   - The extension icon (purple "G") should appear in your toolbar
   - If not visible, click the puzzle piece icon and pin GAYA

### Testing the Extension

#### Test Super Copy

1. Go to any website with a form (e.g., a contact form, registration page)
2. Fill out some fields in the form
3. Click the GAYA extension icon in your toolbar
4. Click "Super Copy" button
5. You should see a green notification "Clipboard filled!"
6. The extension badge should show "1" indicating clipboard has data

#### Test Super Paste

1. Navigate to a different form on another page
2. Click the GAYA extension icon
3. Click "Super Paste" button
4. The form should auto-fill with your clipboard data
5. Check that fields are matched intelligently (e.g., "First Name" → "Given Name")

#### Test See Clipboard

1. Click the GAYA extension icon
2. Click "See Clipboard" button
3. The side panel opens showing your extracted data
4. Try:
   - Expanding/collapsing entity cards
   - Toggling individual fields on/off
   - Clicking on a value to edit it
   - Searching for fields

### Example Test Websites

Try these websites with forms:
- https://www.example.com (basic contact form)
- https://forms.gle/ (Google Forms)
- Any insurance quoting website
- Job application forms
- User registration pages

### Troubleshooting

**Extension doesn't appear:**
- Make sure Developer mode is enabled
- Try reloading the extension (click the refresh icon)
- Check for errors in the Console tab of `chrome://extensions/`

**Super Copy doesn't work:**
- Make sure the page has a form with filled fields
- Check the browser console (F12) for errors
- Try refreshing the page and loading the extension again

**Super Paste doesn't fill correctly:**
- Field mapping is currently rule-based (basic)
- Some complex forms may not map perfectly
- You can manually toggle fields off in "See Clipboard"
- Try editing values in the clipboard viewer

**No notification appears:**
- Make sure notifications are enabled for Chrome
- Check the browser console for JavaScript errors

### Development

To make changes to the extension:

1. Edit source files in `src/` folder
2. Run `npm run build`
3. Go to `chrome://extensions/`
4. Click the reload icon on the GAYA extension card

### Project Structure

```
dist/                    # Built extension (load this in Chrome)
├── manifest.json       # Extension configuration
├── background.js       # Service worker
├── content.js          # Content script (runs on web pages)
├── popup.html          # Extension popup
├── sidepanel.html      # Clipboard viewer
├── icons/              # Extension icons
└── assets/             # React bundles
```

### Features Implemented

✅ Super Copy - Extract form data from any page
✅ Super Paste - Intelligently fill forms
✅ Interactive Clipboard - View and edit extracted data
✅ Multi-entity support - Handle customers, vehicles, etc.
✅ Field toggles - Select which fields to paste
✅ Inline editing - Edit clipboard values
✅ Search - Filter clipboard data
✅ Persistent storage - Data saved across sessions
✅ Smart field mapping - Semantic matching (basic)

### Features Not Yet Implemented

⏳ OpenAI API integration (advanced field mapping)
⏳ Document upload & OCR
⏳ PDF form filling
⏳ Default values system
⏳ Saved records search
⏳ Team collaboration

### Next Steps

1. Test the extension on various websites
2. Collect feedback on field mapping accuracy
3. Identify edge cases and bugs
4. Integrate OpenAI API for better field mapping
5. Add document upload feature
6. Implement PDF form filling

Enjoy using GAYA!
