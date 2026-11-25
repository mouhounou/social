import type { Method } from "axios";
import { http } from "./axios";

export { ApiError } from "./axios";

type Options = {
  method?: Method;
  body?: unknown;
  /** Avancement de l'envoi, de 0 à 100 (utile pour les vidéos). */
  onUploadProgress?: (percent: number) => void;
};

export async function api<T = unknown>(path: string, { method = "GET", body, onUploadProgress }: Options = {}): Promise<T> {
  const { data } = await http.request<T>({
    url: path,
    method,
    data: body,
    onUploadProgress: onUploadProgress && ((e) => e.total && onUploadProgress(Math.round((e.loaded / e.total) * 100))),
  });
  return data;
}
