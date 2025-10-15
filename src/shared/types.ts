// Core data structures for GAYA extension

export interface Field {
  id: string;
  name: string;
  label: string;
  type: string;
  value: any;
  xpath: string;
  required: boolean;
  validation?: string;
  semanticType?: string;
  confidence?: number;
  toggleState?: boolean;
  editable?: boolean;
}

export interface Entity {
  id: string;
  type: 'customer' | 'household' | 'vehicle' | 'property' | 'custom';
  index: number;
  name: string;
  fields: Field[];
  toggleState: boolean;
}

export interface ClipboardData {
  id: string;
  timestamp: Date;
  sourceUrl: string;
  entities: Entity[];
  metadata: {
    extractionMethod: 'manual' | 'document' | 'form';
    version: string;
    fieldsExtracted: number;
  };
}

export interface FieldMapping {
  sourceField: string;
  sourceValue: any;
  targetField: FormField;
  transformation?: 'none' | 'date' | 'phone' | 'split' | 'combine' | 'address';
  confidence: number;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  xpath: string;
  required: boolean;
  value?: any;
}

export interface ExtractedData {
  entities: Entity[];
  timestamp: Date;
}

export interface FillResult {
  success: boolean;
  totalFields: number;
  filledFields: number;
  failedFields: FieldResult[];
  errors: string[];
}

export interface FieldResult {
  field: string;
  success: boolean;
  value?: any;
  error?: string;
}

export interface UserPreferences {
  autoFillEnabled: boolean;
  confirmBeforePaste: boolean;
  saveHistory: boolean;
  defaultFormats: {
    dateFormat: string;
    phoneFormat: string;
    addressFormat: string;
  };
}

export interface SavedRecord {
  id: string;
  identifier: string; // email or name
  clipboardData: ClipboardData;
  lastAccessed: Date;
}

export interface DefaultValue {
  fieldSemanticType: string;
  value: any;
  userId: string;
}

// Message types for communication between scripts
export type MessageAction =
  | 'extractData'
  | 'fillForm'
  | 'openSidePanel'
  | 'updateClipboard'
  | 'clearClipboard'
  | 'searchRecords';

export interface Message {
  action: MessageAction;
  data?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
