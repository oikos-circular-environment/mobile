import { AppError } from "@/modules/common/errors/app-error";

export class UserAlreadyExistsError extends AppError {
  constructor() {
    super();
    this.name = UserAlreadyExistsError.name;
    this.code = "USER_ALREADY_EXISTS";
    this.statusCode = 409;
    this.message = "Email is already in use.";
  }
}
