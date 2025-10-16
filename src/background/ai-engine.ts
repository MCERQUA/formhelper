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
  private config: any = null;

  async initialize() {
    try {
      const result = await chrome.storage.sync.get('apiConfig');
      this.config = result.apiConfig;

      if (!this.config || (!this.config.openaiKey && !this.config.anthropicKey)) {
        throw new AppError(
          'No API key configured',
          'NO_API_KEY',
          'Please configure your OpenAI or Anthropic API key in the extension settings (right-click extension icon → Options)',
          false
        );
      }

      if (this.config.openaiKey) {
        this.openai = new OpenAI({
          apiKey: this.config.openaiKey,
          dangerouslyAllowBrowser: true
        });
        logger.info('OpenAI initialized');
      }

    } catch (error) {
      throw ErrorHandler.handle(error, 'AIEngine.initialize');
    }
  }

  async mapFields(sourceFields: any[], targetFields: any[]): Promise<FieldMapping[]> {
    if (!this.openai) await this.initialize();

    const prompt = `Map source fields to target fields based on semantic meaning.

Source fields (from clipboard):
${JSON.stringify(sourceFields.slice(0, 20), null, 2)}

Target fields (on current page):
${JSON.stringify(targetFields.slice(0, 20), null, 2)}

Rules:
- Match by semantic meaning, NOT exact labels
- "First Name" = "Given Name" = "fname" = "first_name"
- "DOB" = "Date of Birth" = "birthdate" = "dob"
- "Phone" = "Phone Number" = "telephone" = "mobile"
- Identify any transformations needed (date formats, phone formats, etc.)
- Only create mappings with confidence > 0.6

Return ONLY valid JSON:
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
        model: this.config?.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at semantic field mapping for form filling. Always respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content || '{}';
      logger.debug('AI response:', response);

      const parsed = JSON.parse(response);
      return parsed.mappings || [];

    } catch (error) {
      logger.error('Error mapping fields:', error);
      throw ErrorHandler.handle(error, 'AIEngine.mapFields');
    }
  }
}

export const aiEngine = new AIEngine();
