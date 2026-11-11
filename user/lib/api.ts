import type { Method } from "axios";
import { http } from "./axios";

export { ApiError } from "./axios";

type Options = { method?: Method; body?: unknown };

export async function api<T = unknown>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  const { data } = await http.request<T>({ url: path, method, data: body });
  return data;
}
