export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly context?: Record<string, any>;
  public readonly correlationId: string;

  constructor(
    code: string,
    message: string,
    status: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.context = context;
    this.correlationId = global.correlationId || 'unknown';

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTH_ERROR', message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTH_ERROR', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', `${resource}${id ? ` ${id}` : ''} not found`, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super('DATABASE_ERROR', message, 500, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super('EXTERNAL_ERROR', `${service}: ${message}`, 503);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super('RATE_LIMIT', message, 429);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}
