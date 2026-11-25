export const PASSWORD_MIN = 5;
export const USERNAME_HINT = "3 à 30 caractères : lettres, chiffres, _ ou .";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// « Le Boss » devient « le_boss » : on adapte la saisie au lieu de la refuser.
export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_.]/g, "");
}

export function nameError(value: string) {
  return value.trim() ? "" : "Indique ton nom";
}

export function usernameError(value: string) {
  if (!value.trim()) return "Choisis un nom d'utilisateur";
  const username = normalizeUsername(value);
  if (username.length < 3) return "Au moins 3 caractères : lettres, chiffres, _ ou .";
  if (username.length > 30) return "30 caractères maximum";
  return "";
}

export function emailError(value: string) {
  if (!value.trim()) return "Indique ton email";
  return EMAIL_RE.test(value.trim()) ? "" : "Adresse email invalide";
}

export function passwordError(value: string) {
  if (!value) return "Choisis un mot de passe";
  return value.length < PASSWORD_MIN ? `Au moins ${PASSWORD_MIN} caractères` : "";
}

// Ne garde que les champs en erreur et donne le premier, dans l'ordre du formulaire.
export function collectErrors<F extends string>(checks: Record<F, string>) {
  const errors: Partial<Record<F, string>> = {};
  let first: F | undefined;
  for (const field of Object.keys(checks) as F[]) {
    if (!checks[field]) continue;
    errors[field] = checks[field];
    first ??= field;
  }
  return { errors, first };
}

export function focusField(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLElement) field.focus();
}
