import { AppError } from "@/modules/common/errors/app-error";

export class UserAlreadyExistsError extends AppError {
  constructor() {
    super("Email already in use.");
    this.name = "UserAlreadyExistsError";
    this.statusCode = 409;
  }
}
