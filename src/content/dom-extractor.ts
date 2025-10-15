// DOM Extraction Engine - extracts form data from web pages

import { Field, Entity, ExtractedData } from '../shared/types';

export class FormExtractor {
  private fieldIdCounter = 0;

  async extractPageData(): Promise<ExtractedData> {
    const forms = document.querySelectorAll('form');
    const allFields: Field[] = [];

    if (forms.length > 0) {
      // Extract from forms
      for (const form of forms) {
        const fields = await this.extractFormFields(form);
        allFields.push(...fields);
      }
    } else {
      // Extract from loose input fields (no form wrapper)
      const inputs = document.querySelectorAll('input, select, textarea');
      for (const input of inputs) {
        const field = this.analyzeField(input as HTMLElement);
        if (field) allFields.push(field);
      }
    }

    // Group fields into entities
    const entities = await this.groupIntoEntities(allFields);

    return {
      entities,
      timestamp: new Date()
    };
  }

  private async extractFormFields(form: HTMLElement): Promise<Field[]> {
    const fields: Field[] = [];
    const inputs = form.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea, [contenteditable="true"]'
    );

    for (const input of inputs) {
      const field = this.analyzeField(input as HTMLElement);
      if (field && field.value) {
        fields.push(field);
      }
    }

    return fields;
  }

  private analyzeField(element: HTMLElement): Field | null {
    const label = this.findLabel(element);
    const name = element.getAttribute('name') || element.id || `field_${this.fieldIdCounter++}`;
    const type = this.getFieldType(element);
    const value = this.getFieldValue(element);

    // Skip if no value
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const id = this.generateFieldId(element);
    const xpath = this.getXPath(element);
    const required = element.hasAttribute('required') || element.getAttribute('aria-required') === 'true';
    const validation = element.getAttribute('pattern') || undefined;

    return {
      id,
      name,
      label,
      type,
      value,
      xpath,
      required,
      validation,
      toggleState: true,
      editable: true
    };
  }

  private findLabel(element: HTMLElement): string {
    // Strategy 1: Explicit <label for="...">
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return this.cleanText(label.textContent || '');
    }

    // Strategy 2: Parent <label>
    const parentLabel = element.closest('label');
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      // Remove the input itself from label text
      const inputClone = clone.querySelector('input, select, textarea');
      if (inputClone) inputClone.remove();
      return this.cleanText(clone.textContent || '');
    }

    // Strategy 3: aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return this.cleanText(ariaLabel);

    // Strategy 4: aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return this.cleanText(labelElement.textContent || '');
    }

    // Strategy 5: Placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return this.cleanText(placeholder);

    // Strategy 6: Name attribute
    const name = element.getAttribute('name');
    if (name) return this.humanizeName(name);

    // Strategy 7: Nearby text (prev sibling or parent)
    return this.findNearbyText(element);
  }

  private findNearbyText(element: HTMLElement): string {
    // Check previous sibling
    let prev = element.previousElementSibling;
    if (prev && (prev.tagName === 'SPAN' || prev.tagName === 'DIV' || prev.tagName === 'LABEL')) {
      const text = this.cleanText(prev.textContent || '');
      if (text) return text;
    }

    // Check parent's text
    const parent = element.parentElement;
    if (parent) {
      const clone = parent.cloneNode(true) as HTMLElement;
      const inputClone = clone.querySelector('input, select, textarea');
      if (inputClone) inputClone.remove();
      const text = this.cleanText(clone.textContent || '');
      if (text && text.length < 50) return text;
    }

    return 'Unnamed Field';
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
    if (element.hasAttribute('contenteditable')) {
      return 'contenteditable';
    }
    return 'text';
  }

  private getFieldValue(element: HTMLElement): any {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'checkbox':
          return element.checked;
        case 'radio':
          return element.checked ? element.value : null;
        case 'date':
          return element.value;
        case 'number':
          return element.valueAsNumber || element.value;
        case 'file':
          return null; // Skip file inputs
        default:
          return element.value;
      }
    }

    if (element instanceof HTMLSelectElement) {
      return element.options[element.selectedIndex]?.text || element.value;
    }

    if (element instanceof HTMLTextAreaElement) {
      return element.value;
    }

    if (element.hasAttribute('contenteditable')) {
      return element.textContent?.trim();
    }

    return null;
  }

  private generateFieldId(element: HTMLElement): string {
    return element.id || element.getAttribute('name') || `gaya_field_${Date.now()}_${Math.random()}`;
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

  private cleanText(text: string): string {
    return text
      .replace(/\*/g, '') // Remove asterisks (required indicators)
      .replace(/:/g, '') // Remove colons
      .trim()
      .replace(/\s+/g, ' ');
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

  private async groupIntoEntities(fields: Field[]): Promise<Entity[]> {
    // Simple grouping logic - can be enhanced with AI
    const entities: Entity[] = [];

    // Look for common patterns
    const customerFields: Field[] = [];
    const vehicleFields: Field[] = [];
    const addressFields: Field[] = [];
    const otherFields: Field[] = [];

    for (const field of fields) {
      const label = field.label.toLowerCase();
      const name = field.name.toLowerCase();

      if (this.isPersonField(label, name)) {
        customerFields.push(field);
      } else if (this.isVehicleField(label, name)) {
        vehicleFields.push(field);
      } else if (this.isAddressField(label, name)) {
        addressFields.push(field);
      } else {
        otherFields.push(field);
      }
    }

    // Create customer entity
    if (customerFields.length > 0) {
      entities.push({
        id: `entity_customer_${Date.now()}`,
        type: 'customer',
        index: 0,
        name: 'Customer Information',
        fields: customerFields,
        toggleState: true
      });
    }

    // Create vehicle entities
    if (vehicleFields.length > 0) {
      entities.push({
        id: `entity_vehicle_${Date.now()}`,
        type: 'vehicle',
        index: 0,
        name: 'Vehicle Information',
        fields: vehicleFields,
        toggleState: true
      });
    }

    // Add address and other fields to customer if exists, or create new entity
    if (addressFields.length > 0 || otherFields.length > 0) {
      if (customerFields.length > 0) {
        entities[0].fields.push(...addressFields, ...otherFields);
      } else {
        entities.push({
          id: `entity_other_${Date.now()}`,
          type: 'custom',
          index: 0,
          name: 'Form Data',
          fields: [...addressFields, ...otherFields],
          toggleState: true
        });
      }
    }

    return entities;
  }

  private isPersonField(label: string, name: string): boolean {
    const personKeywords = [
      'name', 'first', 'last', 'middle', 'email', 'phone', 'birth', 'dob',
      'gender', 'ssn', 'social', 'suffix', 'prefix', 'maiden'
    ];
    return personKeywords.some(kw => label.includes(kw) || name.includes(kw));
  }

  private isVehicleField(label: string, name: string): boolean {
    const vehicleKeywords = [
      'vehicle', 'car', 'vin', 'make', 'model', 'year', 'plate', 'license plate'
    ];
    return vehicleKeywords.some(kw => label.includes(kw) || name.includes(kw));
  }

  private isAddressField(label: string, name: string): boolean {
    const addressKeywords = [
      'address', 'street', 'city', 'state', 'zip', 'postal', 'country'
    ];
    return addressKeywords.some(kw => label.includes(kw) || name.includes(kw));
  }
}

export const formExtractor = new FormExtractor();
