import type { FastifyError } from "fastify";
import type {
  FastifySchemaValidationError,
  SchemaErrorDataVar,
} from "fastify/types/schema";

export class AppError implements FastifyError {
  code: string;
  name: string;
  statusCode?: number | undefined;
  validationContext?: SchemaErrorDataVar | undefined;
  validation?: FastifySchemaValidationError[] | undefined;
  message: string;
  stack?: string | undefined;
  cause?: unknown;

  constructor() {
    this.message = "An unexpected error occurred.";
    this.code = "APP_ERROR";
    this.name = "AppError";
    this.statusCode = 500;
  }
}
