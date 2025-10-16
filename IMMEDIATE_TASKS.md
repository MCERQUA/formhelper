# FormHelper - Immediate Implementation Tasks
**Priority:** CRITICAL - All tasks must be completed NOW
**Deadline:** TODAY

---

## CRITICAL BLOCKING ISSUES (Must Fix First)

### 1. Fix Message Connection Error ⚠️ BLOCKING
**Issue:** "Could not establish connection. Receiving end does not exist"
**Impact:** Extension completely non-functional

**Files to Create/Modify:**

#### Create: `src/shared/logger.ts`
```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  debug(...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  }

  info(...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info('[INFO]', new Date().toISOString(), ...args);
    }
  }

  warn(...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  }

  error(...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error('[ERROR]', new Date().toISOString(), ...args);
    }
  }
}

export const logger = new Logger();
```

#### Create: `src/shared/error-handler.ts`
```typescript
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ErrorHandler {
  static handle(error: unknown, context: string = 'Unknown'): AppError {
    logger.error(`Error in ${context}:`, error);

    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        'UNKNOWN_ERROR',
        'An unexpected error occurred. Please try again.',
        true
      );
    }

    return new AppError(
      'Unknown error',
      'UNKNOWN_ERROR',
      'An unexpected error occurred. Please try again.',
      true
    );
  }

  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn(`Retry ${i + 1}/${maxRetries} failed:`, error);

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}
```

#### Create: `src/shared/api-client.ts`
```typescript
import { logger } from './logger';
import { ErrorHandler } from './error-handler';

export class APIClient {
  private static async ensureContentScriptReady(tabId: number): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (error) {
      logger.info('Content script not ready, injecting...');

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  static async sendToContentScript<T = any>(
    tabId: number,
    message: any
  ): Promise<T> {
    return ErrorHandler.retry(async () => {
      await this.ensureContentScriptReady(tabId);

      const response = await chrome.tabs.sendMessage(tabId, message);

      if (!response || !response.success) {
        throw new Error(response?.error || 'Request failed');
      }

      return response.data;
    }, 3, 500);
  }

  static async sendToBackground<T = any>(message: any): Promise<T> {
    return ErrorHandler.retry(async () => {
      const response = await chrome.runtime.sendMessage(message);

      if (!response || !response.success) {
        throw new Error(response?.error || 'Request failed');
      }

      return response.data;
    }, 3, 500);
  }
}
```

#### Update: `src/popup/Popup.tsx`
Replace the `handleSuperCopy` function:
```typescript
import { APIClient } from '../shared/api-client';
import { ErrorHandler } from '../shared/error-handler';

const handleSuperCopy = async () => {
  setIsLoading(true);
  setMessage('Extracting data...');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      throw new Error('No active tab');
    }

    const data = await APIClient.sendToContentScript(tab.id, { action: 'extractData' });

    setClipboardData(data);
    setMessage('Clipboard filled!');

  } catch (error) {
    const appError = ErrorHandler.handle(error, 'SuperCopy');
    setMessage(appError.userMessage);
  } finally {
    setIsLoading(false);
    setTimeout(() => setMessage(''), 3000);
  }
};
```

Do the same for `handleSuperPaste`.

#### Update: `src/content/content-script.ts`
Add ping handler at the top:
```typescript
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ success: true });
    return true;
  }

  handleMessage(message)
    .then(response => sendResponse(response))
    .catch(error => sendResponse({ success: false, error: error.message }));

  return true;
});
```

---

### 2. Create API Configuration Interface ⚠️ BLOCKING
**Issue:** No way to configure AI API keys
**Impact:** AI features cannot work

#### Create: `public/options.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FormHelper Settings</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/options/index.tsx"></script>
</body>
</html>
```

#### Create: `src/options/index.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options';
import '../styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
```

#### Create: `src/options/Options.tsx`
```typescript
import React, { useState, useEffect } from 'react';

interface APIConfig {
  provider: 'openai' | 'anthropic';
  openaiKey: string;
  anthropicKey: string;
  model: string;
}

export default function Options() {
  const [config, setConfig] = useState<APIConfig>({
    provider: 'openai',
    openaiKey: '',
    anthropicKey: '',
    model: 'gpt-4o'
  });

  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    chrome.storage.sync.get('apiConfig', (result) => {
      if (result.apiConfig) {
        setConfig(result.apiConfig);
      }
    });
  }, []);

  const handleSave = async () => {
    await chrome.storage.sync.set({ apiConfig: config });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult('');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.openaiKey}`
        }
      });

      if (response.ok) {
        setTestResult('✓ Connection successful!');
      } else {
        setTestResult('✗ Invalid API key');
      }
    } catch (error) {
      setTestResult('✗ Connection failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>FormHelper Configuration</h1>
        <p style={styles.subtitle}>Configure your AI provider to enable intelligent form filling</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>AI Provider</h2>

        <div style={styles.field}>
          <label style={styles.label}>Provider</label>
          <select
            value={config.provider}
            onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
            style={styles.select}
          >
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="anthropic">Anthropic (Claude 3.5)</option>
          </select>
        </div>

        {config.provider === 'openai' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>OpenAI API Key</label>
              <input
                type="password"
                value={config.openaiKey}
                onChange={(e) => setConfig({ ...config, openaiKey: e.target.value })}
                placeholder="sk-..."
                style={styles.input}
              />
              <p style={styles.hint}>
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Model</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                style={styles.select}
              >
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Faster, cheaper)</option>
              </select>
            </div>
          </>
        )}

        {config.provider === 'anthropic' && (
          <div style={styles.field}>
            <label style={styles.label}>Anthropic API Key</label>
            <input
              type="password"
              value={config.anthropicKey}
              onChange={(e) => setConfig({ ...config, anthropicKey: e.target.value })}
              placeholder="sk-ant-..."
              style={styles.input}
            />
            <p style={styles.hint}>
              Get your API key from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                Anthropic Console
              </a>
            </p>
          </div>
        )}

        {testResult && (
          <div style={{
            ...styles.alert,
            ...(testResult.includes('✓') ? styles.alertSuccess : styles.alertError)
          }}>
            {testResult}
          </div>
        )}

        <div style={styles.actions}>
          <button onClick={handleTest} disabled={testing} style={styles.buttonSecondary}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button onClick={handleSave} style={styles.buttonPrimary}>
            Save Configuration
          </button>
        </div>

        {saved && (
          <div style={{ ...styles.alert, ...styles.alertSuccess }}>
            ✓ Configuration saved successfully!
          </div>
        )}
      </div>

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>Cost Estimate</h3>
        <ul style={styles.infoList}>
          <li>Form extraction: ~$0.01-0.02 per page</li>
          <li>Form filling: ~$0.02-0.03 per page</li>
          <li>Average user: ~$3-5 per month</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#0f172a'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1e3a8a'
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0'
  },
  section: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 20px 0',
    color: '#0f172a'
  },
  field: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#0f172a'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit'
  },
  hint: {
    fontSize: '12px',
    color: '#64748b',
    margin: '6px 0 0 0'
  },
  link: {
    color: '#1e3a8a',
    textDecoration: 'none'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#1e3a8a',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '16px'
  },
  alertSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1px solid #059669'
  },
  alertError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #dc2626'
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    padding: '20px'
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#1e40af'
  },
  infoList: {
    fontSize: '14px',
    color: '#1e40af',
    margin: '0',
    paddingLeft: '20px'
  }
};
```

#### Update: `public/manifest.json`
Add options page:
```json
{
  "options_page": "options.html"
}
```

---

### 3. Implement AI Field Mapping ⚠️ BLOCKING
**Issue:** No intelligent field mapping
**Impact:** Forms won't fill correctly

#### Create: `src/background/ai-engine.ts`
```typescript
import OpenAI from 'openai';
import { logger } from '../shared/logger';
import { ErrorHandler, AppError } from '../shared/error-handler';

export interface SemanticField {
  id: string;
  semanticType: string;
  label: string;
  selector: string;
  confidence: number;
}

export interface FieldMapping {
  sourceFieldId: string;
  targetFieldId: string;
  transformation?: string;
  confidence: number;
}

export class AIEngine {
  private openai: OpenAI | null = null;

  async initialize() {
    const result = await chrome.storage.sync.get('apiConfig');
    const config = result.apiConfig;

    if (!config?.openaiKey) {
      throw new AppError(
        'No API key configured',
        'NO_API_KEY',
        'Please configure your OpenAI API key in the extension settings',
        false
      );
    }

    this.openai = new OpenAI({
      apiKey: config.openaiKey,
      dangerouslyAllowBrowser: true
    });

    logger.info('AI Engine initialized');
  }

  async mapFields(sourceFields: any[], targetFields: any[]): Promise<FieldMapping[]> {
    if (!this.openai) await this.initialize();

    const prompt = `Map source fields to target fields based on semantic meaning.

Source fields:
${JSON.stringify(sourceFields.slice(0, 20), null, 2)}

Target fields:
${JSON.stringify(targetFields.slice(0, 20), null, 2)}

Rules:
- Match by semantic meaning, not labels
- "First Name" = "Given Name" = "fname"
- "DOB" = "Date of Birth" = "birthdate"
- Identify transformations needed

Return JSON:
{
  "mappings": [
    {
      "sourceFieldId": "src_1",
      "targetFieldId": "tgt_1",
      "transformation": "none",
      "confidence": 0.95
    }
  ]
}`;

    try {
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at semantic field mapping. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const response = completion.choices[0].message.content || '{}';
      const parsed = JSON.parse(response);

      return parsed.mappings || [];

    } catch (error) {
      logger.error('Error mapping fields:', error);
      throw ErrorHandler.handle(error, 'AIEngine.mapFields');
    }
  }
}

export const aiEngine = new AIEngine();
```

#### Update: `src/content/dom-filler.ts`
Update the `fillForm` method to use AI:
```typescript
import { aiEngine } from '../background/ai-engine';

async fillForm(clipboardData: ClipboardData): Promise<FillResult> {
  try {
    // Extract target fields
    const targetFields = this.detectFormFields();

    // Use AI to map fields
    const sourceFields = this.flattenClipboardFields(clipboardData);
    const mappings = await aiEngine.mapFields(sourceFields, targetFields);

    // Apply mappings
    let filledCount = 0;
    for (const mapping of mappings) {
      if (mapping.confidence > 0.7) {
        await this.fillField(mapping);
        filledCount++;
      }
    }

    return {
      success: true,
      filledFields: filledCount,
      totalFields: targetFields.length
    };

  } catch (error) {
    logger.error('Fill error:', error);
    throw error;
  }
}
```

---

### 4. Remove Purple Colors & Emojis ⚠️ CRITICAL
**Issue:** Childish, unprofessional UI
**Impact:** Not suitable for corporate use

#### Update: `src/popup/Popup.tsx`
Replace ALL styles:
```typescript
const styles = {
  container: {
    width: '320px',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#ffffff',
    color: '#0f172a'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  logo: {
    margin: '0',
    fontSize: '20px',
    fontWeight: '600' as const,
    color: '#1e3a8a'  // Navy instead of purple
  },
  tagline: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#64748b'
  },
  message: {
    padding: '12px',
    marginBottom: '12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#1e40af',
    textAlign: 'center' as const
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    marginBottom: '16px'
  },
  statusIcon: {
    fontSize: '16px',
    color: '#059669',  // Professional green
    marginRight: '8px'
  },
  statusIconEmpty: {
    fontSize: '16px',
    color: '#94a3b8',
    marginRight: '8px'
  },
  statusText: {
    flex: 1,
    fontSize: '14px',
    color: '#0f172a'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    color: '#64748b'
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  button: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    width: '100%'
  },
  primaryButton: {
    backgroundColor: '#1e3a8a',  // Navy
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1'
  },
  info: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  infoText: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#64748b'
  }
};
```

Replace button text (remove emojis):
```typescript
// Before: "📋 Form Copy"
// After: "Copy Form Data"

<button
  style={{ ...styles.button, ...styles.primaryButton }}
  onClick={handleSuperCopy}
  disabled={isLoading}
>
  Copy Form Data
</button>

<button
  style={{ ...styles.button, ...styles.secondaryButton }}
  onClick={handleSuperPaste}
  disabled={isLoading || !clipboardData}
>
  Paste to Form
</button>

<button
  style={{ ...styles.button, ...styles.secondaryButton }}
  onClick={handleOpenSidePanel}
  disabled={!clipboardData}
>
  View Clipboard
</button>
```

#### Update: `src/sidepanel/SidePanel.tsx`
Do the same - remove ALL emojis and purple colors, replace with professional navy/gray scheme.

---

### 5. Add Field Selection Overlay 🔴 MISSING CORE FEATURE

#### Create: `src/content/field-overlay.ts`
```typescript
import { logger } from '../shared/logger';

export interface FormField {
  id: string;
  element: HTMLElement;
  label: string;
  value: any;
}

class FieldOverlay {
  private container: HTMLDivElement | null = null;
  private selectedFields: Set<string> = new Set();
  private fields: FormField[] = [];

  show(fields: FormField[]) {
    this.fields = fields;
    this.selectedFields = new Set(fields.map(f => f.id));
    this.createOverlay();

    fields.forEach(field => {
      const checkbox = this.createCheckbox(field);
      this.container?.appendChild(checkbox);
    });
  }

  private createOverlay() {
    // Remove existing
    this.hide();

    this.container = document.createElement('div');
    this.container.id = 'formhelper-overlay';

    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '999998',
      pointerEvents: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.02)'
    });

    document.body.appendChild(this.container);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '× Close Overlay';
    Object.assign(closeBtn.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      backgroundColor: '#1e3a8a',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '999999',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });
    closeBtn.onclick = () => this.hide();
    this.container.appendChild(closeBtn);
  }

  private createCheckbox(field: FormField): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'formhelper-field-checkbox';

    const rect = field.element.getBoundingClientRect();

    Object.assign(wrapper.style, {
      position: 'absolute',
      top: `${rect.top + window.scrollY - 30}px`,
      left: `${rect.left + window.scrollX}px`,
      backgroundColor: '#1e3a8a',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      pointerEvents: 'auto',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: '999999'
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = `fh-check-${field.id}`;

    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        this.selectedFields.add(field.id);
        wrapper.style.backgroundColor = '#1e3a8a';
      } else {
        this.selectedFields.delete(field.id);
        wrapper.style.backgroundColor = '#94a3b8';
      }
    });

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = field.label;
    label.style.cursor = 'pointer';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    return wrapper;
  }

  hide() {
    this.container?.remove();
    this.container = null;
  }

  getSelectedFields(): string[] {
    return Array.from(this.selectedFields);
  }

  getSelectedFieldData(): FormField[] {
    return this.fields.filter(f => this.selectedFields.has(f.id));
  }
}

export const fieldOverlay = new FieldOverlay();
```

#### Update: `src/content/content-script.ts`
Add overlay command:
```typescript
import { fieldOverlay } from './field-overlay';

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.action) {
    case 'ping':
      return { success: true };

    case 'extractData':
      return await handleExtractData();

    case 'showOverlay':
      return await handleShowOverlay();

    case 'fillForm':
      return await handleFillForm(message.data);

    default:
      return { success: false, error: 'Unknown action' };
  }
}

async function handleShowOverlay(): Promise<MessageResponse> {
  try {
    const fields = await formExtractor.extractPageData();
    const flatFields = fields.entities.flatMap(e =>
      e.fields.map(f => ({
        id: f.id,
        element: document.querySelector(f.selector) as HTMLElement,
        label: f.label,
        value: f.value
      }))
    ).filter(f => f.element);

    fieldOverlay.show(flatFields);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

Add button to popup to show overlay:
```typescript
<button
  style={{ ...styles.button, ...styles.secondaryButton }}
  onClick={async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await APIClient.sendToContentScript(tab.id, { action: 'showOverlay' });
    }
  }}
>
  Select Fields
</button>
```

---

## PRIORITY 2: Core Features

### 6. Format Transformation Engine

#### Create: `src/shared/formatters.ts`
```typescript
export class DataFormatter {
  static normalizePhone(value: string, format: string = 'US'): string {
    const digits = value.replace(/\D/g, '');

    if (format === 'US' && digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }

    return value;
  }

  static convertDate(value: string, targetFormat: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (targetFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return value;
    }
  }

  static splitName(fullName: string): { first: string, middle?: string, last: string } {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 2) {
      return { first: parts[0], last: parts[1] };
    } else if (parts.length >= 3) {
      return {
        first: parts[0],
        middle: parts.slice(1, -1).join(' '),
        last: parts[parts.length - 1]
      };
    }

    return { first: fullName, last: '' };
  }

  static combineName(first: string, middle?: string, last?: string): string {
    return [first, middle, last].filter(Boolean).join(' ');
  }

  static parseAddress(fullAddress: string): {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } {
    // Simple regex-based parsing
    const zipMatch = fullAddress.match(/\b\d{5}(-\d{4})?\b/);
    const stateMatch = fullAddress.match(/\b[A-Z]{2}\b/);

    return {
      street: fullAddress.split(',')[0]?.trim(),
      city: fullAddress.split(',')[1]?.trim(),
      state: stateMatch?.[0],
      zip: zipMatch?.[0]
    };
  }
}
```

---

### 7. Multi-Entity Detection

#### Update: `src/content/dom-extractor.ts`
Add entity grouping:
```typescript
async extractPageData(): Promise<ExtractedData> {
  const allFields = this.findAllFormFields();

  // Group into entities
  const entities = this.groupIntoEntities(allFields);

  return {
    timestamp: new Date(),
    entities
  };
}

private groupIntoEntities(fields: Field[]): Entity[] {
  const entities: Entity[] = [];
  const nameFields = fields.filter(f =>
    f.label.toLowerCase().includes('name') ||
    f.semanticType?.includes('name')
  );

  // Detect multiple people by repeated name patterns
  const people: Entity[] = [];
  let currentPerson: Field[] = [];

  fields.forEach(field => {
    if (field.label.toLowerCase().includes('first name')) {
      if (currentPerson.length > 0) {
        people.push({
          id: `person_${people.length}`,
          type: people.length === 0 ? 'customer' : 'household',
          name: this.getPersonName(currentPerson),
          fields: currentPerson,
          toggleState: true
        });
      }
      currentPerson = [field];
    } else {
      currentPerson.push(field);
    }
  });

  if (currentPerson.length > 0) {
    people.push({
      id: `person_${people.length}`,
      type: people.length === 0 ? 'customer' : 'household',
      name: this.getPersonName(currentPerson),
      fields: currentPerson,
      toggleState: true
    });
  }

  return people;
}

private getPersonName(fields: Field[]): string {
  const firstName = fields.find(f => f.label.toLowerCase().includes('first'))?.value || '';
  const lastName = fields.find(f => f.label.toLowerCase().includes('last'))?.value || '';
  return `${firstName} ${lastName}`.trim() || 'Unknown';
}
```

---

### 8. Update package.json Dependencies

#### Update: `package.json`
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "openai": "^4.28.0",
    "@anthropic-ai/sdk": "^0.15.0",
    "date-fns": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@types/chrome": "^0.0.260",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0"
  }
}
```

Run:
```bash
npm install
npm run build
```

---

## IMMEDIATE ACTION CHECKLIST

Execute in this exact order:

- [ ] 1. Create `src/shared/logger.ts`
- [ ] 2. Create `src/shared/error-handler.ts`
- [ ] 3. Create `src/shared/api-client.ts`
- [ ] 4. Update `src/popup/Popup.tsx` - fix message handling
- [ ] 5. Update `src/content/content-script.ts` - add ping handler
- [ ] 6. Create `public/options.html`
- [ ] 7. Create `src/options/index.tsx`
- [ ] 8. Create `src/options/Options.tsx`
- [ ] 9. Update `public/manifest.json` - add options_page
- [ ] 10. Create `src/background/ai-engine.ts`
- [ ] 11. Update `src/content/dom-filler.ts` - integrate AI
- [ ] 12. Update ALL styles in `src/popup/Popup.tsx` - remove purple/emojis
- [ ] 13. Update ALL styles in `src/sidepanel/SidePanel.tsx` - remove purple/emojis
- [ ] 14. Create `src/content/field-overlay.ts`
- [ ] 15. Update `src/content/content-script.ts` - add overlay handler
- [ ] 16. Create `src/shared/formatters.ts`
- [ ] 17. Update `src/content/dom-extractor.ts` - add entity grouping
- [ ] 18. Update `package.json` - add dependencies
- [ ] 19. Run `npm install`
- [ ] 20. Run `npm run build`
- [ ] 21. Test in Chrome: Load unpacked extension from `dist/`
- [ ] 22. Configure API key in options page
- [ ] 23. Test Super Copy on a form
- [ ] 24. Test overlay selection
- [ ] 25. Test Super Paste
- [ ] 26. Fix any errors that appear
- [ ] 27. Repeat testing until working

---

## TEST PROCEDURE

After completing all tasks:

1. **Load Extension:**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist/` folder

2. **Configure API:**
   - Right-click extension icon
   - Click "Options"
   - Enter OpenAI API key
   - Click "Test Connection"
   - Click "Save Configuration"

3. **Test Copy:**
   - Go to any form (e.g., a sign-up page)
   - Fill in some fields
   - Click extension icon
   - Click "Copy Form Data"
   - Verify "Clipboard filled!" message

4. **Test Overlay:**
   - Click "Select Fields"
   - Verify overlay appears
   - Uncheck some fields
   - Close overlay

5. **Test Paste:**
   - Go to different form
   - Click extension icon
   - Click "Paste to Form"
   - Verify fields are filled

6. **Debug Errors:**
   - Open DevTools (F12)
   - Check Console for errors
   - Check Background page console
   - Fix errors and rebuild

---

**EVERYTHING ABOVE MUST BE DONE NOW**
**NO TIMELINES - START IMMEDIATELY**
**FINISH TODAY**
