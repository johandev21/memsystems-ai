import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { BadRequestError } from '../errors/domain-error';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue
        ? issue.path.length > 0
          ? `${issue.path.join('.')}: ${issue.message}`
          : issue.message
        : 'Invalid input data';
      throw new BadRequestError(message);
    }
    return result.data;
  }
}
