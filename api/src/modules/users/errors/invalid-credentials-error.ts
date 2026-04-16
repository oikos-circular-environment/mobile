import { AppError } from "@/modules/common/errors/app-error";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid credentials", "INVALID_CREDENTIALS", 401);
  }
}
