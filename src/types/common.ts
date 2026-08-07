// Mirrors the ApiResponse<T> envelope wrapping every zivdah-api response:
// { status, message, statusCode, data }
export interface ApiResponse<T> {
  status: string;
  message: string;
  statusCode: number;
  data: T;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface PagedQuery {
  page: number;
  size: number;
}
