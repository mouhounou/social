const KEY = "solola:recovery";

type Recovery = { email: string; resetToken?: string };

export function getRecovery(): Recovery | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function setRecovery(data: Recovery) {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function clearRecovery() {
  sessionStorage.removeItem(KEY);
}
