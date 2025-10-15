// DOM Filler Engine - fills forms with clipboard data

import { ClipboardData, FormField, FieldMapping, FillResult, FieldResult } from '../shared/types';

export class FormFiller {
  async fillForm(clipboardData: ClipboardData): Promise<FillResult> {
    const results: FieldResult[] = [];
    let filledCount = 0;
    const failedFields: FieldResult[] = [];

    try {
      // Find all fillable fields on the page
      const targetFields = await this.findTargetFields();

      // Create mappings
      const mappings = await this.createMappings(clipboardData, targetFields);

      // Fill each mapped field
      for (const mapping of mappings) {
        try {
          const element = this.findElementByXPath(mapping.targetField.xpath);

          if (!element) {
            failedFields.push({
              field: mapping.targetField.label,
              success: false,
              error: 'Element not found'
            });
            continue;
          }

          // Transform and set value
          const transformedValue = this.transformValue(mapping.sourceValue, mapping.transformation || 'none');
          await this.setFieldValue(element as HTMLElement, transformedValue, mapping.targetField.type);
          await this.triggerEvents(element as HTMLElement);

          filledCount++;
          results.push({
            field: mapping.targetField.label,
            success: true,
            value: transformedValue
          });

        } catch (error) {
          failedFields.push({
            field: mapping.targetField.label,
            success: false,
            error: (error as Error).message
          });
        }
      }

      return {
        success: failedFields.length === 0,
        totalFields: mappings.length,
        filledFields: filledCount,
        failedFields,
        errors: failedFields.map(f => f.error || 'Unknown error')
      };

    } catch (error) {
      return {
        success: false,
        totalFields: 0,
        filledFields: 0,
        failedFields: [],
        errors: [(error as Error).message]
      };
    }
  }

  private async findTargetFields(): Promise<FormField[]> {
    const fields: FormField[] = [];
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([readonly]), select:not([disabled]), textarea:not([readonly])'
    );

    let idCounter = 0;
    for (const input of inputs) {
      const element = input as HTMLElement;
      const label = this.findLabel(element);
      const name = element.getAttribute('name') || element.id || `field_${idCounter++}`;
      const type = this.getFieldType(element);
      const xpath = this.getXPath(element);
      const required = element.hasAttribute('required');

      fields.push({
        id: element.id || name,
        name,
        label,
        type,
        xpath,
        required
      });
    }

    return fields;
  }

  private async createMappings(clipboardData: ClipboardData, targetFields: FormField[]): Promise<FieldMapping[]> {
    const mappings: FieldMapping[] = [];

    // Flatten clipboard entities into a field map
    const clipboardFields = new Map<string, any>();
    for (const entity of clipboardData.entities) {
      for (const field of entity.fields) {
        if (field.toggleState !== false) {
          clipboardFields.set(field.label.toLowerCase(), field.value);
          clipboardFields.set(field.name.toLowerCase(), field.value);
        }
      }
    }

    // Match target fields with clipboard data
    for (const targetField of targetFields) {
      const targetLabel = targetField.label.toLowerCase();
      const targetName = targetField.name.toLowerCase();

      // Try exact match first
      let sourceValue = clipboardFields.get(targetLabel) || clipboardFields.get(targetName);

      // Try fuzzy match if no exact match
      if (!sourceValue) {
        sourceValue = this.findFuzzyMatch(targetLabel, clipboardFields);
      }

      if (sourceValue) {
        mappings.push({
          sourceField: targetLabel,
          sourceValue,
          targetField,
          transformation: this.determineTransformation(sourceValue, targetField.type),
          confidence: 1.0
        });
      }
    }

    return mappings;
  }

  private findFuzzyMatch(targetLabel: string, clipboardFields: Map<string, any>): any {
    // Simple keyword matching
    const keywords = targetLabel.split(/\s+/);

    for (const [key, value] of clipboardFields.entries()) {
      const keyWords = key.split(/\s+/);
      const matchCount = keywords.filter(kw => keyWords.some(kw2 => kw2.includes(kw) || kw.includes(kw2))).length;

      if (matchCount >= Math.min(2, keywords.length)) {
        return value;
      }
    }

    return null;
  }

  private determineTransformation(value: any, targetType: string): 'none' | 'date' | 'phone' | 'split' | 'combine' {
    if (targetType === 'date' && typeof value === 'string') {
      return 'date';
    }
    if (targetType === 'tel' && typeof value === 'string') {
      return 'phone';
    }
    return 'none';
  }

  private transformValue(value: any, transformation: string): any {
    switch (transformation) {
      case 'date':
        return this.formatDate(value);
      case 'phone':
        return this.formatPhone(value);
      default:
        return value;
    }
  }

  private formatDate(value: any): string {
    if (!value) return '';

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${month}/${day}/${year}`;
    } catch {
      return value;
    }
  }

  private formatPhone(value: any): string {
    if (!value) return '';

    const digits = String(value).replace(/\D/g, '');

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    return value;
  }

  private async setFieldValue(element: HTMLElement, value: any, _type: string): Promise<void> {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'checkbox':
          element.checked = Boolean(value);
          break;
        case 'radio':
          if (String(element.value).toLowerCase() === String(value).toLowerCase()) {
            element.checked = true;
          }
          break;
        case 'file':
          // Skip file inputs
          throw new Error('Cannot auto-fill file inputs');
        default:
          element.value = String(value);
      }
    } else if (element instanceof HTMLSelectElement) {
      // Try exact match first
      let matched = false;
      for (let i = 0; i < element.options.length; i++) {
        const option = element.options[i];
        if (option.value === value || option.text === value) {
          element.selectedIndex = i;
          matched = true;
          break;
        }
      }

      // Try case-insensitive match
      if (!matched) {
        const valueLower = String(value).toLowerCase();
        for (let i = 0; i < element.options.length; i++) {
          const option = element.options[i];
          if (option.value.toLowerCase() === valueLower || option.text.toLowerCase() === valueLower) {
            element.selectedIndex = i;
            matched = true;
            break;
          }
        }
      }

      // Try partial match
      if (!matched) {
        const valueLower = String(value).toLowerCase();
        for (let i = 0; i < element.options.length; i++) {
          const option = element.options[i];
          if (option.text.toLowerCase().includes(valueLower) || valueLower.includes(option.text.toLowerCase())) {
            element.selectedIndex = i;
            break;
          }
        }
      }
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = String(value);
    }
  }

  private async triggerEvents(element: HTMLElement): Promise<void> {
    const events = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new Event('blur', { bubbles: true })
    ];

    for (const event of events) {
      element.dispatchEvent(event);
      await this.sleep(50);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private findElementByXPath(xpath: string): Element | null {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue as Element;
    } catch {
      return null;
    }
  }

  private getXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.nodeName.toLowerCase();
      const pathIndex = index ? `[${index + 1}]` : '';
      parts.unshift(`${tagName}${pathIndex}`);

      current = current.parentElement;
    }

    return parts.length ? `/${parts.join('/')}` : '';
  }

  private findLabel(element: HTMLElement): string {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || '';
    }

    const parentLabel = element.closest('label');
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      const inputClone = clone.querySelector('input, select, textarea');
      if (inputClone) inputClone.remove();
      return clone.textContent?.trim() || '';
    }

    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    const name = element.getAttribute('name');
    if (name) return this.humanizeName(name);

    return 'Unnamed Field';
  }

  private humanizeName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private getFieldType(element: HTMLElement): string {
    if (element instanceof HTMLInputElement) {
      return element.type;
    }
    if (element instanceof HTMLSelectElement) {
      return 'select';
    }
    if (element instanceof HTMLTextAreaElement) {
      return 'textarea';
    }
    return 'text';
  }
}

export const formFiller = new FormFiller();
