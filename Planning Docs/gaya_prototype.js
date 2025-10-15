// ============================================
// GAYA.AI CLONE - CORE PROTOTYPE
// Demonstrates key functionality
// ============================================

// ============================================
// 1. FORM FIELD EXTRACTOR
// ============================================

class FormExtractor {
  /**
   * Extracts all form fields from the current page
   */
  static extractFields() {
    const fields = [];
    
    // Get all input elements
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach((element, index) => {
      // Skip hidden and submit buttons
      if (element.type === 'hidden' || element.type === 'submit') return;
      
      const field = {
        id: element.id || `field_${index}`,
        name: element.name || '',
        type: element.type || element.tagName.toLowerCase(),
        value: this.getFieldValue(element),
        label: this.getFieldLabel(element),
        placeholder: element.placeholder || '',
        required: element.required || false,
        xpath: this.getXPath(element),
        semanticType: null // Will be filled by AI
      };
      
      fields.push(field);
    });
    
    return fields;
  }
  
  /**
   * Get the value of a form field
   */
  static getFieldValue(element) {
    if (element.tagName === 'SELECT') {
      return element.options[element.selectedIndex]?.value || '';
    }
    if (element.type === 'checkbox') {
      return element.checked;
    }
    if (element.type === 'radio') {
      return element.checked ? element.value : null;
    }
    return element.value;
  }
  
  /**
   * Find the label associated with a form field
   */
  static getFieldLabel(element) {
    // Try to find label element
    let label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
    
    // Try parent label
    label = element.closest('label');
    if (label) return label.textContent.replace(element.value, '').trim();
    
    // Try preceding sibling
    let prev = element.previousElementSibling;
    if (prev?.tagName === 'LABEL') return prev.textContent.trim();
    
    // Use placeholder or name as fallback
    return element.placeholder || element.name || element.id || 'Unknown Field';
  }
  
  /**
   * Generate XPath for an element (for reliable re-selection)
   */
  static getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const parts = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = element.previousElementSibling;
      
      while (sibling) {
        if (sibling.tagName === element.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      
      const tagName = element.tagName.toLowerCase();
      const part = `${tagName}[${index}]`;
      parts.unshift(part);
      element = element.parentNode;
    }
    
    return '/' + parts.join('/');
  }
}

// ============================================
// 2. AI FIELD MAPPER (Simulated)
// ============================================

class AIFieldMapper {
  /**
   * Map source fields to target fields using semantic understanding
   * In production, this would call GPT-4 or Claude
   */
  static async mapFields(sourceFields, targetFields) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mappings = [];
    
    // Simple heuristic mapping (in production, use LLM)
    sourceFields.forEach(sourceField => {
      const bestMatch = this.findBestMatch(sourceField, targetFields);
      if (bestMatch) {
        mappings.push({
          source: sourceField,
          target: bestMatch,
          confidence: bestMatch.confidence,
          needsTransform: this.needsTransformation(sourceField, bestMatch)
        });
      }
    });
    
    return mappings;
  }
  
  /**
   * Find best matching field using semantic similarity
   */
  static findBestMatch(sourceField, targetFields) {
    const sourceTerms = this.extractSemanticTerms(sourceField);
    let bestMatch = null;
    let highestScore = 0;
    
    targetFields.forEach(targetField => {
      const targetTerms = this.extractSemanticTerms(targetField);
      const score = this.calculateSimilarity(sourceTerms, targetTerms);
      
      if (score > highestScore && score > 0.3) {
        highestScore = score;
        bestMatch = {
          ...targetField,
          confidence: score
        };
      }
    });
    
    return bestMatch;
  }
  
  /**
   * Extract semantic terms from field metadata
   */
  static extractSemanticTerms(field) {
    const text = `${field.label} ${field.name} ${field.placeholder}`.toLowerCase();
    
    // Normalize common variations
    const normalized = text
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return new Set(normalized.split(' '));
  }
  
  /**
   * Calculate similarity between two sets of terms
   */
  static calculateSimilarity(terms1, terms2) {
    // Common field name mappings
    const synonyms = {
      'first': ['fname', 'given', 'firstname'],
      'last': ['lname', 'surname', 'lastname', 'family'],
      'email': ['mail', 'e-mail'],
      'phone': ['tel', 'telephone', 'mobile', 'cell'],
      'dob': ['dateofbirth', 'birthdate', 'birthday'],
      'ssn': ['socialsecurity', 'social'],
      'zip': ['zipcode', 'postal', 'postalcode']
    };
    
    let intersection = 0;
    terms1.forEach(term1 => {
      if (terms2.has(term1)) {
        intersection++;
        return;
      }
      
      // Check synonyms
      Object.entries(synonyms).forEach(([key, values]) => {
        if (term1.includes(key) || values.some(v => term1.includes(v))) {
          terms2.forEach(term2 => {
            if (term2.includes(key) || values.some(v => term2.includes(v))) {
              intersection += 0.8; // Partial credit for synonym match
            }
          });
        }
      });
    });
    
    const union = terms1.size + terms2.size;
    return union > 0 ? (2 * intersection) / union : 0;
  }
  
  /**
   * Determine if data transformation is needed
   */
  static needsTransformation(sourceField, targetField) {
    // Check if data formats differ
    const dateTypes = ['date', 'datetime', 'datetime-local'];
    const phoneTypes = ['tel', 'phone'];
    
    if (dateTypes.includes(sourceField.type) !== dateTypes.includes(targetField.type)) {
      return 'date_format';
    }
    if (phoneTypes.includes(sourceField.type) !== phoneTypes.includes(targetField.type)) {
      return 'phone_format';
    }
    
    return false;
  }
}

// ============================================
// 3. AUTO-FILL ENGINE
// ============================================

class AutoFiller {
  /**
   * Fill target form fields with mapped data
   */
  static async fillFields(mappings) {
    let successCount = 0;
    let failCount = 0;
    
    for (const mapping of mappings) {
      try {
        const targetElement = this.findElement(mapping.target);
        
        if (!targetElement) {
          console.warn(`Element not found: ${mapping.target.xpath}`);
          failCount++;
          continue;
        }
        
        // Transform data if needed
        let value = mapping.source.value;
        if (mapping.needsTransform) {
          value = this.transformData(value, mapping.needsTransform);
        }
        
        // Fill the field
        await this.setFieldValue(targetElement, value);
        
        // Highlight filled field (visual feedback)
        this.highlightField(targetElement);
        
        successCount++;
      } catch (error) {
        console.error(`Error filling field:`, error);
        failCount++;
      }
    }
    
    return { successCount, failCount, total: mappings.length };
  }
  
  /**
   * Find element using XPath
   */
  static findElement(field) {
    try {
      const result = document.evaluate(
        field.xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    } catch (error) {
      // Fallback to ID or name
      return document.getElementById(field.id) || 
             document.querySelector(`[name="${field.name}"]`);
    }
  }
  
  /**
   * Set value for different input types
   */
  static async setFieldValue(element, value) {
    if (element.tagName === 'SELECT') {
      // Find matching option
      const options = Array.from(element.options);
      const matchingOption = options.find(opt => 
        opt.value === value || opt.text === value
      );
      if (matchingOption) {
        element.value = matchingOption.value;
      }
    } else if (element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else if (element.type === 'radio') {
      if (element.value === value) {
        element.checked = true;
      }
    } else {
      element.value = value;
    }
    
    // Trigger events to ensure site's JS detects the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // Small delay for dependent fields to update
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  /**
   * Transform data between formats
   */
  static transformData(value, transformType) {
    switch (transformType) {
      case 'date_format':
        // Convert between date formats
        return this.convertDateFormat(value);
      case 'phone_format':
        // Normalize phone number
        return this.normalizePhone(value);
      default:
        return value;
    }
  }
  
  static convertDateFormat(dateStr) {
    // Try to parse and reformat
    const date = new Date(dateStr);
    if (!isNaN(date)) {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    return dateStr;
  }
  
  static normalizePhone(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return phone;
  }
  
  /**
   * Visual feedback for filled fields
   */
  static highlightField(element) {
    const originalBorder = element.style.border;
    element.style.border = '2px solid #4CAF50';
    element.style.transition = 'border 0.3s';
    
    setTimeout(() => {
      element.style.border = originalBorder;
    }, 2000);
  }
}

// ============================================
// 4. SMART CLIPBOARD
// ============================================

class SmartClipboard {
  constructor() {
    this.data = null;
  }
  
  /**
   * Super Copy - Extract all data from current page
   */
  async copy() {
    console.log('🔍 Extracting form data...');
    
    const fields = FormExtractor.extractFields();
    
    this.data = {
      timestamp: new Date().toISOString(),
      sourceUrl: window.location.href,
      fields: fields,
      metadata: {
        fieldsFound: fields.length,
        pageTitle: document.title
      }
    };
    
    console.log(`✅ Copied ${fields.length} fields to clipboard`);
    return this.data;
  }
  
  /**
   * Super Paste - Auto-fill current page with clipboard data
   */
  async paste() {
    if (!this.data) {
      console.error('❌ No data in clipboard. Use copy() first.');
      return;
    }
    
    console.log('🎯 Analyzing target form...');
    
    const targetFields = FormExtractor.extractFields();
    
    console.log('🤖 Mapping fields with AI...');
    const mappings = await AIFieldMapper.mapFields(this.data.fields, targetFields);
    
    console.log(`📝 Found ${mappings.length} field mappings`);
    
    console.log('✨ Auto-filling form...');
    const result = await AutoFiller.fillFields(mappings);
    
    console.log(`✅ Successfully filled ${result.successCount}/${result.total} fields`);
    
    return result;
  }
  
  /**
   * Show current clipboard contents
   */
  showClipboard() {
    if (!this.data) {
      console.log('📋 Clipboard is empty');
      return;
    }
    
    console.log('📋 Clipboard Contents:');
    console.table(this.data.fields.map(f => ({
      Label: f.label,
      Type: f.type,
      Value: f.value
    })));
  }
}

// ============================================
// 5. DEMO USAGE
// ============================================

// Initialize the smart clipboard
const clipboard = new SmartClipboard();

// Make it globally accessible for easy testing
window.gayaClipboard = clipboard;

console.log(`
╔════════════════════════════════════════╗
║   GAYA.AI CLONE - PROTOTYPE LOADED    ║
╚════════════════════════════════════════╝

🎯 Available Commands:
   gayaClipboard.copy()   - Extract data from current form
   gayaClipboard.paste()  - Auto-fill current form
   gayaClipboard.showClipboard() - View clipboard contents

📝 Example Workflow:
   1. Navigate to a form page
   2. gayaClipboard.copy()
   3. Navigate to another form page
   4. gayaClipboard.paste()

💡 In production, this would:
   - Use GPT-4/Claude for smarter field mapping
   - Handle complex scenarios (iframes, dynamic fields)
   - Store data encrypted in IndexedDB
   - Sync across browser tabs
   - Adapt to UI changes automatically
`);

// Export for use in browser extension context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormExtractor,
    AIFieldMapper,
    AutoFiller,
    SmartClipboard
  };
}