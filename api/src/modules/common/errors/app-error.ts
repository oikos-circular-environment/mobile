export class AppError extends Error {
  private code: string;
  private statusCode: number;

  constructor(message?: string, code?: string, statusCode?: number) {
    super(message);
    this.code = code || "APP_ERROR";
    this.statusCode = statusCode || 400;
  }
}
