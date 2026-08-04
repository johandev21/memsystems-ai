import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../errors/domain-error';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainError) {
      this.logger.warn(`DomainError [${exception.code}]: ${exception.message}`);
      return response.status(exception.status).json({
        error: exception.message,
        code: exception.code,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as
        string | { message?: string | string[] };
      const message =
        typeof res === 'string' ? res : (res.message ?? exception.message);
      return response.status(status).json({
        error: Array.isArray(message) ? message.join(', ') : message,
        code: 'http_exception',
      });
    }

    const err =
      exception instanceof Error ? exception : new Error('Unknown error');
    const safeMessage = redactSensitiveDetails(err.message);
    const safeStack = err.stack ? redactSensitiveDetails(err.stack) : undefined;
    this.logger.error(`Unhandled Exception: ${safeMessage}`, safeStack);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
      code: 'internal_error',
    });
  }
}

function redactSensitiveDetails(value: string): string {
  return value
    .replace(
      /params:\s*[\s\S]*?(?=\n(?:Error:|\s*at\s)|$)/i,
      'params: [REDACTED]',
    )
    .replace(/(sk-[A-Za-z0-9_-]{8,}|AIza[A-Za-z0-9_-]{8,})/g, '[REDACTED_KEY]');
}
