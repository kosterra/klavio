export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const unauthorized = () => new HttpError(401, 'UNAUTHORIZED');
export const forbidden = () => new HttpError(403, 'FORBIDDEN');
export const notFound = () => new HttpError(404, 'NOT_FOUND');
export const badRequest = (code: string) => new HttpError(400, code);
