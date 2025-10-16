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
