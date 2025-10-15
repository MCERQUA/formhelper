# GAYA: AI-Powered Interactive Clipboard Chrome Extension
## Complete Development Plan

---

## Executive Summary

**GAYA** (Get All Your Applications) is an intelligent Chrome extension that revolutionizes form filling through an AI-powered, persistent, interactive clipboard system. Unlike traditional form fillers, GAYA uses AI to read, understand, and intelligently store form data in a locally-saved clipboard that persists across sessions and websites, enabling seamless data transfer with smart field mapping.

**Core Innovation**: An ongoing, interactive clipboard that acts as a smart data repository, allowing users to:
- Extract data from any webpage with one click
- Store extracted data persistently in a structured, editable format
- View and manage multiple data entities (customers, households, vehicles, etc.)
- Intelligently paste data into forms across different websites
- Upload documents to extract data directly into the clipboard
- Map data to PDF forms automatically
- Set default values for auto-filling missing fields

**Target Users**: Insurance agents, mortgage brokers, healthcare administrators, legal assistants, HR professionals, and anyone dealing with repetitive form filling across multiple platforms.

**Value Proposition**: Reduce form-filling time by 70-90% through intelligent data extraction, persistent storage, and context-aware auto-fill.

---

## 1. Core Feature Set (Based on Image Analysis)

### 1.1 Interactive Clipboard Panel

The heart of GAYA is a persistent side panel that displays:

**Visual Design:**
- GAYA branded header with user context (e.g., "Personal Line")
- Status indicator: "Your clipboard has data" (green checkmark)
- Primary actions: "See Clipboard" | "Super Copy" buttons
- Trash icon for clearing clipboard
- Minimalist, non-intrusive design

**Clipboard Data Structure:**
```typescript
interface ClipboardData {
  id: string;
  timestamp: Date;
  sourceUrl: string;
  entities: Entity[];
  metadata: {
    extractionMethod: 'manual' | 'document' | 'form';
    version: string;
  };
}

interface Entity {
  type: 'customer' | 'household' | 'vehicle' | 'property' | 'custom';
  index: number;
  name: string;
  fields: Field[];
  toggleState: boolean; // For selective pasting
}

interface Field {
  name: string;
  value: any;
  semanticType: string;
  confidence: number;
  toggleState: boolean; // Individual field toggle
  editable: boolean;
}
```

### 1.2 Super Copy - Intelligent Data Extraction

**Functionality:**
- Click "Super Copy" button to extract all visible form data
- AI analyzes the page and identifies:
  - Form fields and their values
  - Semantic meaning of each field
  - Relationships between fields (e.g., household members)
  - Entity groupings (customers, vehicles, addresses)

**Visual Feedback:**
```
"Super Pasting..." loading indicator
↓
"Clipboard filled" success notification (green checkmark)
↓
"Your clipboard has data." status
```

**What Gets Captured:**
- Text inputs (name, address, email, phone)
- Dropdowns (marital status, state, gender)
- Radio buttons (Yes/No selections)
- Checkboxes (product selections, agreements)
- Date fields (DOB, effective dates)
- Multi-entity data (multiple household members)
- Structured data (vehicles with VIN, make, model)

### 1.3 See Clipboard - Data Viewer & Editor

**Interactive Modal/Panel** showing organized data:

**Layout:**
```
Progressive [Extension Name]
├── Search bar: "Look up items - separate with comma"
├── Organized Sections (Collapsible):
│   ├── Households (4)
│   │   ├── Customer - Albert Spears
│   │   ├── Household 2 - Camie Spears
│   │   ├── Household 3 - Maria Spears
│   │   └── [+ ADD MORE PEOPLE]
│   ├── Cars (3)
│   │   ├── Car 1 - 2018 ACURA MDX
│   │   ├── Car 2 - 2021 JEEP CHEROKEE
│   │   └── Car 3 - 2022 CHEVROLET EQUINOX
│   └── [Other entity types...]
└── Actions:
    ├── [Clear Clipboard]
    └── [Super Paste]
```

**Field Display with Toggles:**
Each field shows:
- Field name (semantic)
- Current value
- Purple toggle switch (on/off for selective pasting)
- Copy icon for individual field copying
- Inline editing capability

**Example from images:**
```
First Name:     [Albert]                    [Toggle: ON]
Middle Name:    [Peter]                     [Toggle: ON]
Last Name:      [Jones]                     [Toggle: ON]
Suffix:         [Sr]                        [Toggle: ON]
Date of Birth:  [09/12/1979]               [Toggle: ON]
Gender:         [Male]                      [Toggle: ON]
Email:          [ezlynxtestemail@gmail.com] [Toggle: ON]
Phone Number:   [217-565-1312]             [Toggle: ON]
```

**Editing Features:**
- Click any value to edit
- Changes persist in local storage
- Validation warnings for invalid data
- Undo/redo capability

### 1.4 Super Paste - Intelligent Form Filling

**Modes of Operation:**

**1. Super Paste (Full Auto-fill):**
- Analyzes target form structure
- Maps clipboard data to form fields semantically
- Fills all matching fields automatically
- Shows "Super Pasting..." progress indicator
- Handles:
  - Text inputs
  - Dropdowns (maps values intelligently)
  - Radio buttons
  - Checkboxes
  - Date formats (auto-converts)
  - Multi-entity forms (fills household members, vehicles)

**2. Super Paste to PDF:**
- Extension menu: "Super Paste to PDF"
- Shows modal: "Choose PDF templates from the list below"
- Templates organized by carrier:
  ```
  Acord Personal Lines
  ├── ☐ Acord 80: Homeowner Application
  └── ☑ Acord 90: Personal Auto Application

  [Super Paste to PDF button]
  ```
- AI maps clipboard data to PDF form fields
- Downloads filled PDF

**3. Field-Level Intelligence:**
- Combines input fields (e.g., "450 NW 1st Ave" + "Miami" + "FL" + "33120" → complete address)
- Splits data from divided inputs (e.g., full address → street, city, state, zip)
- Converts formats:
  - Date formats: MM/DD/YYYY ↔ DD/MM/YYYY ↔ YYYY-MM-DD
  - Phone formats: (555) 123-4567 ↔ 555-123-4567 ↔ 5551234567
  - Name parsing: "John Doe" ↔ separate first/last fields
- Handles dropdowns and radio buttons intelligently

### 1.5 Document Upload & OCR

**Feature: "Upload Documents - Instantly Fill your Clipboard"**

**Functionality:**
- "Attach Files (Max 5, 10MB each)" button in clipboard panel
- Supported formats: PDF, PNG, JPG, DOCX
- AI extracts structured data from documents:
  - Insurance cards
  - Driver's licenses
  - Application forms
  - Medical records
  - Financial documents
- Extracted data populates clipboard automatically

**UI Flow:**
```
[Attach Files button] → File picker → Processing →
"Your clipboard has data" → See Clipboard (data populated)
```

### 1.6 Default Values System

**Feature: "Edit Default Values to Autofill Missing Data"**

**Functionality:**
- Set default values for common fields
- When pasting, GAYA fills missing fields with defaults
- Visual indicators show which fields were auto-filled with defaults

**UI:**
- Extension menu option: "Edit default values"
- Modal shows form fields with current defaults
- Click "+" icon next to any field to set default:
  ```
  Type a default value
  Type a default value for [Mailing City]
  [________________________]
  [Cancel]  [Save Default Value]
  ```

**Example Defaults:**
- Suffix: "Sr"
- Date of Birth: "MM/DD/YYYY"
- Gender: "Male"
- Common addresses, phone numbers, etc.

**Smart Behavior:**
- Defaults marked with green "+" indicator
- Only applied when field is empty
- User can override at any time
- Saved per user account

### 1.7 Saved Records & History

**Feature: "Retrieve your Saved Records"**

**Functionality:**
- Search bar: allows lookup by email, name, or identifier
- Example: `marc@gaya.ai` → retrieves all saved clipboard data for Marc
- Historical data persistence
- Quick-load previous clipboard states

**Storage:**
- Indexed by customer email/identifier
- Timestamp-based versioning
- Easy retrieval and restoration

### 1.8 Extension Menu Options

**Dropdown Menu (accessible via extension icon):**
```
GAYA
jp@gaya.ai
v3.5.42

├── ✓ Your clipboard has data
├── 📝 Portal
├── 📎 Upload file
├── ⬇ Super Paste to PDF
├── ⚙ Edit default values
└── 🔄 Check for updates
```

---

## 2. Technical Architecture

### 2.1 Chrome Extension Structure

```
gaya/
├── manifest.json (Manifest V3)
├── src/
│   ├── background/
│   │   ├── service-worker.ts        # Background script
│   │   ├── ai-engine.ts             # LLM integration
│   │   ├── field-mapper.ts          # Semantic field mapping
│   │   └── storage-manager.ts       # IndexedDB operations
│   ├── content/
│   │   ├── content-script.ts        # Injected into pages
│   │   ├── dom-extractor.ts         # Form data extraction
│   │   ├── dom-filler.ts            # Form filling logic
│   │   └── ui-overlay.ts            # Clipboard panel UI
│   ├── popup/
│   │   ├── popup.tsx                # Extension popup
│   │   └── popup.css
│   ├── sidepanel/
│   │   ├── ClipboardPanel.tsx       # Main clipboard UI
│   │   ├── EntityViewer.tsx         # Entity display component
│   │   ├── FieldEditor.tsx          # Field editing component
│   │   └── SearchBar.tsx            # Search/filter component
│   ├── shared/
│   │   ├── types.ts                 # TypeScript definitions
│   │   ├── utils.ts                 # Utility functions
│   │   ├── formatters.ts            # Data format converters
│   │   └── validators.ts            # Data validation
│   └── api/
│       ├── openai-client.ts         # OpenAI API integration
│       ├── ocr-service.ts           # Document processing
│       └── pdf-mapper.ts            # PDF form filling
├── public/
│   ├── icons/
│   └── manifest.json
└── tests/
```

### 2.2 Data Storage Architecture

**Local Storage (IndexedDB):**
```typescript
// Schema design
interface GayaDatabase {
  clipboards: {
    key: string;              // UUID
    value: ClipboardData;
    timestamp: Date;
    userId: string;
  };

  savedRecords: {
    key: string;              // email or identifier
    value: ClipboardData[];
    lastAccessed: Date;
  };

  defaultValues: {
    key: string;              // field semantic type
    value: any;
    userId: string;
  };

  extractionHistory: {
    key: string;
    url: string;
    timestamp: Date;
    success: boolean;
    fieldsExtracted: number;
  };

  userSettings: {
    key: string;
    preferences: UserPreferences;
  };
}

interface UserPreferences {
  autoFillEnabled: boolean;
  confirmBeforePaste: boolean;
  saveHistory: boolean;
  defaultFormats: {
    dateFormat: string;
    phoneFormat: string;
    addressFormat: string;
  };
}
```

**Storage Limits:**
- IndexedDB: ~1GB per extension (sufficient for clipboard history)
- Encryption for sensitive data (SSN, financial info)
- Automatic cleanup of old records (configurable retention)

### 2.3 AI Integration Architecture

**LLM Provider: OpenAI GPT-4o**

**Use Cases:**

**1. Form Field Semantic Understanding:**
```typescript
async function analyzeFormFields(html: string): Promise<SemanticField[]> {
  const prompt = `
Analyze this HTML form and extract semantic meaning:

${html}

For each input field, provide:
1. Semantic type (e.g., "first_name", "email", "phone", "date_of_birth")
2. Current value (if any)
3. Field constraints (required, pattern, min/max)
4. Confidence score (0-1)

Return as JSON array.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**2. Field Mapping (Clipboard → Target Form):**
```typescript
async function mapFields(
  clipboardData: ClipboardData,
  targetFields: FormField[]
): Promise<FieldMapping[]> {
  const prompt = `
You have clipboard data:
${JSON.stringify(clipboardData, null, 2)}

Target form has these fields:
${JSON.stringify(targetFields, null, 2)}

Map clipboard data to target fields. Handle:
- Semantic matching (e.g., "Given Name" → "First Name")
- Format conversion (dates, phones, addresses)
- Data splitting/combining (full name ↔ first/last)
- Multi-entity mapping (household members to separate sections)

Return JSON array of mappings:
{
  "mappings": [
    {
      "sourceField": "clipboardPath",
      "targetField": "formFieldId",
      "transformation": "none|date|phone|split|combine",
      "confidence": 0.95
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content).mappings;
}
```

**3. Document OCR & Extraction:**
```typescript
async function extractDocumentData(fileBase64: string): Promise<ExtractedData> {
  const prompt = `
Extract structured data from this document image.
Identify entities like: person info, addresses, vehicles, dates, policy numbers.

Return JSON with entities and fields:
{
  "entities": [
    {
      "type": "person",
      "fields": [
        {"name": "first_name", "value": "John"},
        {"name": "last_name", "value": "Doe"}
      ]
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${fileBase64}` }
          }
        ]
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**4. PDF Form Mapping:**
```typescript
async function mapToPDF(
  clipboardData: ClipboardData,
  pdfTemplate: PDFTemplate
): Promise<PDFFieldMapping[]> {
  const prompt = `
Map clipboard data to Acord ${pdfTemplate.acordNumber} PDF form.

Clipboard: ${JSON.stringify(clipboardData, null, 2)}
PDF Form Fields: ${JSON.stringify(pdfTemplate.fields, null, 2)}

Return mappings with proper Acord field names.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content).mappings;
}
```

**Cost Management:**
- Cache common form structures (reduce API calls)
- Use embeddings for quick semantic similarity (cheaper)
- Batch similar requests
- Implement request debouncing
- Fall back to rule-based mapping when confidence is high

**Estimated Costs per User:**
- Super Copy: ~$0.01-0.02 per extraction
- Super Paste: ~$0.02-0.03 per paste
- Document Upload: ~$0.05-0.10 per document
- **Total: ~$3-5 per user/month** (with active usage)

### 2.4 DOM Manipulation Engine

**Form Extraction:**
```typescript
class FormExtractor {
  async extractPageData(): Promise<ExtractedData> {
    const forms = document.querySelectorAll('form');
    const allFields: Field[] = [];

    for (const form of forms) {
      // Find all input elements
      const inputs = form.querySelectorAll(
        'input, select, textarea, [contenteditable="true"]'
      );

      for (const input of inputs) {
        const field = this.analyzeField(input as HTMLElement);
        if (field) allFields.push(field);
      }
    }

    // Group fields into entities using AI
    const entities = await this.groupIntoEntities(allFields);

    return { entities, timestamp: new Date() };
  }

  private analyzeField(element: HTMLElement): Field | null {
    // Extract field metadata
    const label = this.findLabel(element);
    const name = element.getAttribute('name') || element.id;
    const type = this.getFieldType(element);
    const value = this.getFieldValue(element);

    if (!value) return null; // Skip empty fields

    return {
      id: this.generateFieldId(element),
      name,
      label,
      type,
      value,
      xpath: this.getXPath(element),
      required: element.hasAttribute('required'),
      validation: element.getAttribute('pattern') || undefined
    };
  }

  private findLabel(element: HTMLElement): string {
    // Try multiple strategies
    // 1. Explicit <label for="...">
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    // 2. Parent <label>
    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.textContent?.trim() || '';

    // 3. aria-label or aria-labelledby
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // 4. Placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    // 5. Nearby text (heuristic)
    return this.findNearbyText(element);
  }

  private getFieldValue(element: HTMLElement): any {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'checkbox':
          return element.checked;
        case 'radio':
          if (element.checked) return element.value;
          return null;
        case 'date':
          return element.valueAsDate;
        case 'number':
          return element.valueAsNumber;
        default:
          return element.value;
      }
    }

    if (element instanceof HTMLSelectElement) {
      return element.value;
    }

    if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }

    return element.textContent?.trim();
  }

  private async groupIntoEntities(fields: Field[]): Promise<Entity[]> {
    // Use AI to group related fields into entities
    // E.g., "First Name", "Last Name", "DOB" → Person entity
    return await aiEngine.groupFields(fields);
  }
}
```

**Form Filling:**
```typescript
class FormFiller {
  async fillForm(
    clipboardData: ClipboardData,
    options: FillOptions = {}
  ): Promise<FillResult> {
    // 1. Analyze target form
    const targetFields = await this.analyzeTargetForm();

    // 2. Map clipboard to target fields using AI
    const mappings = await aiEngine.mapFields(clipboardData, targetFields);

    // 3. Apply default values for missing fields
    const enhancedMappings = await this.applyDefaults(mappings);

    // 4. Fill fields with proper event triggering
    const results = await this.executeFillings(enhancedMappings);

    // 5. Validate and report
    return this.validateResults(results);
  }

  private async executeFillings(
    mappings: FieldMapping[]
  ): Promise<FieldResult[]> {
    const results: FieldResult[] = [];

    for (const mapping of mappings) {
      try {
        const element = this.findElement(mapping.targetField);
        if (!element) {
          results.push({
            field: mapping.targetField.name,
            success: false,
            error: 'Element not found'
          });
          continue;
        }

        // Transform value if needed
        const value = this.transformValue(
          mapping.sourceValue,
          mapping.transformation
        );

        // Set value
        await this.setFieldValue(element, value);

        // Trigger events for validation
        await this.triggerEvents(element);

        results.push({
          field: mapping.targetField.name,
          success: true,
          value
        });

      } catch (error) {
        results.push({
          field: mapping.targetField.name,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  private async setFieldValue(
    element: HTMLElement,
    value: any
  ): Promise<void> {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'checkbox':
          element.checked = Boolean(value);
          break;
        case 'radio':
          if (element.value === value) {
            element.checked = true;
          }
          break;
        case 'file':
          // Skip file inputs (security)
          throw new Error('Cannot auto-fill file inputs');
        default:
          element.value = String(value);
      }
    } else if (element instanceof HTMLSelectElement) {
      // Try exact match first
      const option = Array.from(element.options).find(
        opt => opt.value === value || opt.text === value
      );
      if (option) {
        element.value = option.value;
      } else {
        // Try fuzzy match
        const fuzzyMatch = this.findFuzzyMatch(value, element.options);
        if (fuzzyMatch) element.value = fuzzyMatch.value;
      }
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = String(value);
    }
  }

  private async triggerEvents(element: HTMLElement): Promise<void> {
    // Trigger events that websites listen for
    const events = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new Event('blur', { bubbles: true })
    ];

    for (const event of events) {
      element.dispatchEvent(event);
      await this.sleep(50); // Small delay for event handlers
    }
  }

  private transformValue(value: any, transformation: string): any {
    switch (transformation) {
      case 'date':
        return this.formatDate(value);
      case 'phone':
        return this.formatPhone(value);
      case 'split_name':
        return this.splitName(value);
      case 'combine_address':
        return this.combineAddress(value);
      default:
        return value;
    }
  }
}
```

### 2.5 UI Components (React + TypeScript)

**ClipboardPanel.tsx:**
```tsx
import React, { useState, useEffect } from 'react';
import { ClipboardData, Entity } from '../shared/types';
import EntityViewer from './EntityViewer';
import SearchBar from './SearchBar';

const ClipboardPanel: React.FC = () => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load clipboard data from storage
    loadClipboardData();
  }, []);

  const loadClipboardData = async () => {
    const data = await chrome.storage.local.get('currentClipboard');
    setClipboardData(data.currentClipboard);
  };

  const handleSuperCopy = async () => {
    setIsLoading(true);
    try {
      // Send message to content script to extract data
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id!, {
        action: 'extractData'
      });

      setClipboardData(response.data);
      await chrome.storage.local.set({ currentClipboard: response.data });

      // Show success notification
      showNotification('Clipboard filled', 'success');
    } catch (error) {
      showNotification('Extraction failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperPaste = async () => {
    if (!clipboardData) return;

    setIsLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id!, {
        action: 'fillForm',
        data: clipboardData
      });

      showNotification('Form filled successfully', 'success');
    } catch (error) {
      showNotification('Paste failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearClipboard = async () => {
    setClipboardData(null);
    await chrome.storage.local.remove('currentClipboard');
  };

  return (
    <div className="clipboard-panel">
      <header className="panel-header">
        <div className="logo">GAYA</div>
        <div className="user-info">Personal Line</div>
      </header>

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner" />
          <span>Super Pasting...</span>
        </div>
      )}

      <div className="clipboard-status">
        {clipboardData ? (
          <>
            <span className="status-icon success">✓</span>
            <span>Your clipboard has data.</span>
            <button className="icon-btn" onClick={handleClearClipboard}>
              🗑️
            </button>
          </>
        ) : (
          <>
            <span className="status-icon">ℹ</span>
            <span>Clipboard is empty.</span>
          </>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-outline"
          onClick={() => setShowViewer(true)}
          disabled={!clipboardData}
        >
          👁 See Clipboard
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSuperCopy}
        >
          📋 Super Copy
        </button>
      </div>

      {clipboardData && (
        <div className="quick-actions">
          <button className="btn btn-success" onClick={handleSuperPaste}>
            📥 Super Paste
          </button>
        </div>
      )}

      {showViewer && clipboardData && (
        <div className="clipboard-viewer">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Look up items - separate with comma"
          />

          {clipboardData.entities
            .filter(e => matchesSearch(e, searchQuery))
            .map(entity => (
              <EntityViewer
                key={entity.id}
                entity={entity}
                onUpdate={handleEntityUpdate}
              />
            ))
          }
        </div>
      )}
    </div>
  );
};

export default ClipboardPanel;
```

**EntityViewer.tsx:**
```tsx
import React, { useState } from 'react';
import { Entity, Field } from '../shared/types';
import FieldEditor from './FieldEditor';

interface EntityViewerProps {
  entity: Entity;
  onUpdate: (entity: Entity) => void;
}

const EntityViewer: React.FC<EntityViewerProps> = ({ entity, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleFieldToggle = (fieldIndex: number) => {
    const updatedEntity = { ...entity };
    updatedEntity.fields[fieldIndex].toggleState =
      !updatedEntity.fields[fieldIndex].toggleState;
    onUpdate(updatedEntity);
  };

  const handleFieldEdit = (fieldIndex: number, newValue: any) => {
    const updatedEntity = { ...entity };
    updatedEntity.fields[fieldIndex].value = newValue;
    onUpdate(updatedEntity);
  };

  const getEntityIcon = () => {
    switch (entity.type) {
      case 'customer': return '👤';
      case 'household': return '👥';
      case 'vehicle': return '🚗';
      case 'property': return '🏠';
      default: return '📄';
    }
  };

  return (
    <div className="entity-card">
      <div
        className="entity-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <input
          type="checkbox"
          checked={entity.toggleState}
          onChange={(e) => {
            e.stopPropagation();
            onUpdate({ ...entity, toggleState: !entity.toggleState });
          }}
          className="entity-toggle"
        />
        <span className="entity-icon">{getEntityIcon()}</span>
        <span className="entity-name">{entity.name}</span>
        <span className="entity-count">
          {entity.fields.filter(f => f.value).length} fields
        </span>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div className="entity-fields">
          {entity.fields.map((field, index) => (
            <FieldEditor
              key={field.name}
              field={field}
              onToggle={() => handleFieldToggle(index)}
              onEdit={(value) => handleFieldEdit(index, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityViewer;
```

---

## 3. Implementation Roadmap

### Phase 1: Core Clipboard MVP (Weeks 1-6)

**Week 1-2: Extension Setup**
- [ ] Initialize Chrome Extension project (Manifest V3)
- [ ] Set up React + TypeScript + Vite build system
- [ ] Implement basic content script injection
- [ ] Create popup and side panel UI shells
- [ ] Set up IndexedDB storage schema

**Week 3-4: Super Copy (Data Extraction)**
- [ ] Build DOM extraction engine
- [ ] Implement form field detection
- [ ] Integrate OpenAI API for semantic analysis
- [ ] Create clipboard data structure
- [ ] Build basic UI to show extracted data
- [ ] Test on 10+ different insurance websites

**Week 5-6: Super Paste (Data Insertion)**
- [ ] Build field mapping algorithm
- [ ] Implement DOM filling engine with event triggering
- [ ] Add format transformation (dates, phones, addresses)
- [ ] Create paste confirmation UI
- [ ] Test paste accuracy on target forms

**Deliverable:** Working extension that can extract and paste basic form data

### Phase 2: Interactive Clipboard UI (Weeks 7-10)

**Week 7-8: Clipboard Viewer**
- [ ] Build entity grouping logic (AI-powered)
- [ ] Create expandable entity cards UI
- [ ] Implement field-level toggles
- [ ] Add inline field editing
- [ ] Build search/filter functionality

**Week 9-10: Data Management**
- [ ] Implement saved records system
- [ ] Add search by email/identifier
- [ ] Create clear clipboard functionality
- [ ] Build clipboard history
- [ ] Add export/import capabilities

**Deliverable:** Fully interactive clipboard with editing and management

### Phase 3: Advanced Features (Weeks 11-16)

**Week 11-12: Document Upload & OCR**
- [ ] Build file upload interface
- [ ] Integrate OpenAI Vision API for OCR
- [ ] Extract structured data from documents
- [ ] Support multiple file formats (PDF, images)
- [ ] Test with insurance cards, licenses, forms

**Week 13-14: PDF Form Filling**
- [ ] Build PDF template library (Acord forms)
- [ ] Create PDF field mapping system
- [ ] Implement "Super Paste to PDF" feature
- [ ] Add template selection UI
- [ ] Generate and download filled PDFs

**Week 15-16: Default Values & Smart Features**
- [ ] Build default values system
- [ ] Create default value editor UI
- [ ] Implement auto-fill with defaults
- [ ] Add smart suggestions based on history
- [ ] Create field validation system

**Deliverable:** Full-featured extension with document processing and PDF support

### Phase 4: Intelligence & Optimization (Weeks 17-20)

**Week 17-18: AI Enhancements**
- [ ] Fine-tune field mapping accuracy
- [ ] Implement multi-entity handling (households, vehicles)
- [ ] Add smart field combination/splitting
- [ ] Create confidence scoring system
- [ ] Build user correction feedback loop

**Week 19-20: Performance & UX**
- [ ] Optimize API calls (caching, batching)
- [ ] Improve extraction speed (<2s target)
- [ ] Add keyboard shortcuts
- [ ] Create onboarding tutorial
- [ ] Build settings and preferences

**Deliverable:** Polished, production-ready extension

### Phase 5: Testing & Launch (Weeks 21-24)

**Week 21-22: Testing**
- [ ] Unit tests for core functions
- [ ] E2E tests with Playwright
- [ ] Test on 50+ real-world websites
- [ ] Beta testing with 20-50 users
- [ ] Bug fixes and refinements

**Week 23-24: Launch Preparation**
- [ ] Chrome Web Store listing
- [ ] Marketing website
- [ ] Documentation and tutorials
- [ ] Pricing and payment integration
- [ ] Submit for review

**Deliverable:** Public launch on Chrome Web Store

---

## 4. Key Technical Challenges & Solutions

### Challenge 1: Field Semantic Understanding

**Problem:** Forms use inconsistent labels (e.g., "First Name" vs "Given Name" vs "fname")

**Solution:**
- Use OpenAI embeddings for semantic similarity
- Build a knowledge graph of field type synonyms
- Learn from user corrections over time
- Confidence scoring (>0.8 = auto-fill, <0.8 = ask user)

### Challenge 2: Multi-Entity Forms

**Problem:** Forms with multiple household members, vehicles, etc.

**Solution:**
- AI-powered entity detection and grouping
- Iterate through entity arrays in clipboard
- Match entity sections in target form (by index or labels)
- Handle dynamic form sections (e.g., "Add another person")

### Challenge 3: Format Conversions

**Problem:** Different date formats, phone formats, address structures

**Solution:**
```typescript
const formatters = {
  date: {
    detect: (value: string) => { /* regex patterns */ },
    convert: (value: string, targetFormat: string) => { /* date parsing */ }
  },
  phone: {
    detect: (value: string) => /^\d{10}$|^\(\d{3}\)/.test(value),
    convert: (value: string, targetFormat: string) => {
      const digits = value.replace(/\D/g, '');
      switch (targetFormat) {
        case 'xxx-xxx-xxxx': return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
        case '(xxx) xxx-xxxx': return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
        default: return digits;
      }
    }
  },
  address: {
    split: (fullAddress: string) => {
      // Use AI to parse: "123 Main St, Springfield, IL 62701"
      // → { street: "123 Main St", city: "Springfield", state: "IL", zip: "62701" }
    },
    combine: (components: AddressComponents) => {
      return `${components.street}, ${components.city}, ${components.state} ${components.zip}`;
    }
  }
};
```

### Challenge 4: Dynamic/SPA Websites

**Problem:** Modern websites use React, Vue, Angular with virtual DOM

**Solution:**
- Use MutationObserver to detect DOM changes
- Wait for form elements to render before extraction
- Re-run field detection after navigation
- Handle Shadow DOM and iframes

### Challenge 5: Security & Privacy

**Problem:** Handling sensitive PII data

**Solution:**
- Client-side encryption for storage
- No data sent to servers except for AI processing
- Clear data retention policies (auto-delete after 30 days)
- User control over what data is saved
- Comply with GDPR, CCPA

---

## 5. Monetization Strategy

### Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 Super Copy/Paste per month<br>Basic clipboard (1 record)<br>Manual form filling |
| **Pro** | $19/mo | Unlimited Copy/Paste<br>Unlimited clipboard history<br>Document upload (20/mo)<br>Default values<br>Priority support |
| **Team** | $15/user/mo | Everything in Pro<br>Shared clipboards<br>Team templates<br>Usage analytics<br>Min 5 users |
| **Enterprise** | Custom | Everything in Team<br>SSO/SAML<br>Custom integrations<br>API access<br>Dedicated support<br>SLA |

### Revenue Projections (Year 1)

**Conservative:**
- Month 1-3: 100 users (beta) → $0 revenue
- Month 4-6: 500 users (50% free, 50% pro) → $4,750/mo
- Month 7-9: 2,000 users (60% free, 40% pro) → $15,200/mo
- Month 10-12: 5,000 users (65% free, 35% pro) → $33,250/mo

**Year 1 Total:** ~$180K ARR

**Optimistic (with marketing):**
- Year 1: 10,000 users → $400K ARR
- Year 2: 30,000 users → $1.2M ARR

### Cost Structure

**Fixed Costs (Monthly):**
- Cloud hosting (AWS/GCP): $500-1,000
- OpenAI API: $2,000-5,000 (varies with usage)
- Infrastructure (monitoring, CDN): $300-500
- Developer tools & services: $500
- Customer support: $2,000-4,000

**Variable Costs:**
- OpenAI API per user: ~$3-5/user/month (heavy usage)
- Storage: ~$0.10/user/month

**Gross Margin:** ~70-75%

---

## 6. Go-To-Market Strategy

### Target Market Segmentation

**Primary (Year 1):**
1. **Insurance Agents** (100K+ in US)
   - Pain: Fill 20-50 forms per week across multiple carriers
   - Value: Save 10-15 hours/week
   - ROI: $19/mo vs. $500+/mo in time saved

2. **Mortgage Brokers** (50K+ in US)
   - Pain: Duplicate data entry across lender portals
   - Value: Faster application processing
   - ROI: Close more deals per month

3. **Healthcare Administrators** (200K+ in US)
   - Pain: Patient data entry across EHR systems
   - Value: Reduce errors and save time
   - ROI: Compliance and efficiency

**Secondary (Year 2):**
4. Legal assistants, HR professionals, real estate agents

### Marketing Channels

**1. Content Marketing:**
- Blog: "How insurance agents save 10 hours/week"
- YouTube tutorials: "Fill Progressive forms in 30 seconds"
- Case studies: Real user testimonials
- SEO for keywords: "form filler extension", "insurance form automation"

**2. Community & Forums:**
- Reddit: r/InsuranceAgents, r/productivity
- Facebook Groups: Insurance agent communities
- LinkedIn: Target job titles

**3. Partnerships:**
- Agency management systems (AMS) integration
- Insurance carrier partnerships (official integration)
- Referral program (give $10, get $10)

**4. Paid Acquisition:**
- Google Ads: Target "form filler" keywords
- LinkedIn Ads: Target insurance agents, loan officers
- Sponsored content on insurance industry websites

**5. Product-Led Growth:**
- Free tier with generous limits
- In-product prompts to upgrade
- Viral features (share clipboard templates)

### Launch Strategy

**Phase 1: Private Beta (Month 1-2)**
- Recruit 50-100 insurance agents
- Gather feedback and iterate
- Build case studies

**Phase 2: Public Beta (Month 3-4)**
- Chrome Web Store launch (beta label)
- Product Hunt launch
- Press outreach to insurance tech blogs

**Phase 3: Full Launch (Month 5)**
- Remove beta label
- Paid advertising campaign
- Partnership announcements
- Webinar series for target industries

---

## 7. Success Metrics

### Key Performance Indicators (KPIs)

**Adoption Metrics:**
- Weekly Active Users (WAU)
- Daily Active Users (DAU)
- DAU/WAU ratio (stickiness)
- Install → activation rate (>60% target)
- Activation → paid conversion (>20% target)

**Usage Metrics:**
- Super Copy per user per week (target: 10+)
- Super Paste success rate (target: >90%)
- Forms filled per user per month (target: 50+)
- Time saved per user per week (target: 10+ hours)

**Quality Metrics:**
- Field mapping accuracy (target: >95%)
- Paste success rate (target: >90%)
- User-reported errors (target: <5%)
- Support ticket volume (target: <2% of users)

**Business Metrics:**
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- LTV:CAC ratio (target: >3:1)
- Churn rate (target: <5% monthly)
- Net Revenue Retention (NRR) (target: >100%)

### Success Milestones

**Month 3:** 500 users, 90% paste success rate
**Month 6:** 2,000 users, $15K MRR, <5% churn
**Month 12:** 5,000 users, $75K MRR, profitability
**Year 2:** 20,000 users, $300K MRR, Series A readiness

---

## 8. Risk Analysis & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Chrome Web Store rejection | High | Low | Follow all guidelines, thorough review before submission |
| OpenAI API rate limits | High | Medium | Multiple provider fallbacks, aggressive caching |
| Website blocking automation | Medium | Medium | User-driven interaction model, no background automation |
| Poor field mapping accuracy | High | Medium | Continuous fine-tuning, user feedback loop |
| Performance issues | Medium | Low | Lazy loading, code splitting, performance budgets |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | Generous free tier, strong marketing, clear value prop |
| High churn rate | High | Medium | Excellent onboarding, customer success, continuous improvement |
| Competitor enters market | Medium | High | Strong brand, network effects, feature velocity |
| Data breach | High | Low | Security-first design, regular audits, encryption |
| Regulatory changes | Medium | Low | Legal counsel, compliance-first, privacy by design |

### Competitive Risks

**Existing Competitors:**
- RoboForm, LastPass (password managers with form fill)
- Grammarly (browser extension model)
- Industry-specific tools (insurance-specific autofill)

**Competitive Advantages:**
1. **AI-First:** Built for the LLM era with intelligent field mapping
2. **Interactive Clipboard:** Persistent, editable data storage vs. one-time fill
3. **Multi-Entity Support:** Handle complex forms (households, vehicles)
4. **Document Upload:** Extract data from images/PDFs
5. **Industry Specialization:** Deep focus on insurance use cases initially

---

## 9. Future Roadmap (Year 2+)

### Q1 2026: Advanced AI Features
- [ ] Custom LLM fine-tuned on insurance forms
- [ ] Predictive auto-fill (suggest values before user types)
- [ ] Natural language commands ("Fill this form for John")
- [ ] Multi-language support

### Q2 2026: Integrations
- [ ] Zapier integration
- [ ] API for third-party integrations
- [ ] Webhooks for workflow automation
- [ ] AMS (Agency Management System) native integrations

### Q3 2026: Collaboration Features
- [ ] Team workspaces
- [ ] Shared clipboard templates
- [ ] Role-based access control
- [ ] Activity logs and audit trails

### Q4 2026: Enterprise Features
- [ ] SSO/SAML authentication
- [ ] Custom data retention policies
- [ ] Compliance certifications (SOC 2, HIPAA)
- [ ] White-labeling for partners

### 2027: Platform Expansion
- [ ] Firefox extension
- [ ] Edge extension
- [ ] Mobile app (iOS/Android)
- [ ] Desktop app (Windows/Mac)
- [ ] Browser-agnostic web platform

---

## 10. Appendix

### A. Technology Stack Summary

**Frontend:**
- React 18 + TypeScript
- TailwindCSS for styling
- Zustand for state management
- Vite for building

**Backend/API:**
- Chrome Extension APIs
- IndexedDB for local storage
- OpenAI GPT-4o for AI
- pdf-lib for PDF generation

**Infrastructure:**
- Chrome Web Store for distribution
- (Optional) Cloud backend for sync features
- Stripe for payments

**Development:**
- Git + GitHub
- GitHub Actions for CI/CD
- Playwright for E2E testing
- Vitest for unit testing

### B. Detailed User Flows

**Flow 1: First-Time User**
```
1. Install extension from Chrome Web Store
2. Click extension icon → Onboarding tutorial appears
3. Navigate to insurance quoting site
4. Fill out a form manually (as usual)
5. Click "Super Copy" → Data extracted to clipboard
6. Navigate to another carrier's site
7. Click "Super Paste" → Form auto-filled
8. User sees time saved, prompted to upgrade
```

**Flow 2: Power User with Document**
```
1. User has customer's driver's license photo
2. Open extension panel
3. Click "Attach Files" → Upload license
4. AI extracts: Name, DOB, License #, Address
5. Data populates clipboard automatically
6. Navigate to carrier site
7. "Super Paste" → All fields filled instantly
8. User makes minor edits if needed
9. Submit form
```

**Flow 3: Team Collaboration**
```
1. Agency manager creates "Standard Auto Quote" template
2. Sets default values for agency info
3. Shares template link with team
4. Agent opens template → Clipboard pre-populated
5. Agent adds customer-specific data
6. Super Paste into carrier site
7. Agency manager sees analytics (forms filled, time saved)
```

### C. Security & Privacy Details

**Data Encryption:**
- AES-256 encryption for sensitive fields (SSN, DL#, financial)
- Local key derivation (never sent to servers)
- Encrypted at rest in IndexedDB

**Data Retention:**
- Default: 30 days auto-delete
- User configurable: 7, 30, 90 days, or never
- "Clear All Data" option in settings

**Privacy Compliance:**
- GDPR: Right to access, deletion, portability
- CCPA: Do Not Sell opt-out
- HIPAA: BAA available for enterprise (if handling PHI)

**Permissions Requested:**
- `storage`: For clipboard data
- `activeTab`: For form extraction/filling on current page
- `scripting`: For content script injection
- (No `<all_urls>` permission - only active tab)

### D. API Cost Optimization

**Strategies:**
1. **Caching:**
   - Cache form structure analysis (same site = same structure)
   - Cache semantic mappings for common field types
   - Cache embeddings for field names

2. **Batching:**
   - Batch multiple field analyses in one API call
   - Process entire form at once vs. field-by-field

3. **Fallbacks:**
   - Use rule-based matching for high-confidence cases
   - Only call LLM for ambiguous mappings
   - Use smaller/cheaper models (GPT-3.5) for simple tasks

4. **User Feedback Loop:**
   - Learn from corrections to improve local rules
   - Reduce need for AI over time

**Expected Cost Reduction:**
- Initial: $5/user/month → Target: $2/user/month (60% reduction)

---

## Summary

GAYA is positioned to transform form filling through an innovative **interactive clipboard** approach powered by AI. By focusing on the insurance industry initially and building a product that truly saves time, GAYA can capture a significant market and expand to adjacent industries.

**Next Steps:**
1. Finalize technical architecture and API choices
2. Build Phase 1 MVP (6 weeks)
3. Recruit beta testers from insurance agencies
4. Iterate based on feedback
5. Launch publicly on Chrome Web Store
6. Execute go-to-market strategy

**Key Success Factors:**
- Exceptional field mapping accuracy (>95%)
- Delightful user experience (fast, intuitive)
- Strong industry focus (insurance first)
- Robust security and compliance
- Aggressive customer acquisition and retention

With this plan, GAYA can become the go-to productivity tool for professionals who deal with repetitive form filling, starting with insurance agents and expanding to a massive market opportunity.
