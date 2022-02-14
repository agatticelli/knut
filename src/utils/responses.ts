const responseBuilder = (statusCode: number, data: any) => ({
  statusCode,
  body: JSON.stringify(data),
});
const error = (statusCode: number, message: string) => responseBuilder(statusCode, { message });

export const ok = (data: any) => responseBuilder(200, data);
export const created = (data: any) => responseBuilder(201, data);
export const noContent = () => responseBuilder(204, {});

export const badRequest = (message = 'Bad request') => error(400, message);
export const notFound = (message = 'Not found') => error(404, message);
export const internalServerError = (message = 'Internal server error') => error(500, message);
