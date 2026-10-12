import { NextResponse } from "next/server";
import { logger } from "./logger";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(entity = "Resource") {
    super(`${entity} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  public readonly errors?: unknown;

  constructor(message = "Validation failed", errors?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Permission denied") {
    super(message, 403, "FORBIDDEN");
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    logger.warn(`API Error [${error.code}]: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError ? { details: error.errors } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  logger.error("Unhandled API Error", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    },
    { status: 500 }
  );
}
