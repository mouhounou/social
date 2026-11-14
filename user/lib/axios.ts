import axios, { AxiosError } from "axios";

export class ApiError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status: number, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; field?: string }>) => {
    if (!error.response) {
      return Promise.reject(new ApiError("Impossible de joindre le serveur, vérifie ta connexion", 0));
    }
    const message = error.response.data?.message || "Une erreur est survenue";
    return Promise.reject(new ApiError(message, error.response.status, error.response.data?.field));
  }
);
