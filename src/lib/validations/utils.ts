/**
 * Validation utilities and helpers
 */

import { z } from 'zod';
import type { ApiError } from './schemas';

/**
 * Validate data against a Zod schema
 * Returns typed data or throws validation error
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Safe validate - returns result object instead of throwing
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod errors into a user-friendly object
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  
  return errors;
}

/**
 * Get first error message from Zod error
 */
export function getFirstError(error: z.ZodError): string {
  return error.issues[0]?.message || 'Validation failed';
}

/**
 * Create API error response
 */
export function createApiError(
  error: string,
  message?: string,
  code?: string
): ApiError {
  return { error, message, code };
}

/**
 * Validate request body in API route
 */
export async function validateRequestBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: ApiError }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: createApiError(
          'Validation failed',
          getFirstError(err),
          'VALIDATION_ERROR'
        ),
      };
    }
    return {
      error: createApiError(
        'Invalid request body',
        'Could not parse request body as JSON',
        'PARSE_ERROR'
      ),
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): { data: z.infer<T> } | { error: ApiError } {
  try {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const data = schema.parse(params);
    return { data };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: createApiError(
          'Invalid query parameters',
          getFirstError(err),
          'VALIDATION_ERROR'
        ),
      };
    }
    return {
      error: createApiError(
        'Invalid query parameters',
        undefined,
        'PARSE_ERROR'
      ),
    };
  }
}
