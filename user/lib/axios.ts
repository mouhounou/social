import axios, { AxiosError } from "axios";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (!error.response) {
      return Promise.reject(new ApiError("Impossible de joindre le serveur, vérifie ta connexion", 0));
    }
    const message = error.response.data?.message || "Une erreur est survenue";
    return Promise.reject(new ApiError(message, error.response.status));
  }
);
