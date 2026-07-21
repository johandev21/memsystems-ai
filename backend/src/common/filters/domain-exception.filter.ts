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
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (res as any).message || exception.message;
      return response.status(status).json({
        error: Array.isArray(message) ? message.join(', ') : message,
        code: 'http_exception',
      });
    }

    const err = exception as Error;
    this.logger.error(`Unhandled Exception: ${err?.message}`, err?.stack);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: err?.message || 'Internal server error',
      code: 'internal_error',
    });
  }
}
