import { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { ZodSchema } from "zod";
import { BadRequestError } from "../errors/domain-error";

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid input data";
      throw new BadRequestError(message);
    }
    return result.data;
  }
}
