"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import FieldError from "@/components/ui/FieldError";
import { TURNSTILE_SITE_KEY } from "@/lib/constants";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TOKEN_FIELD = "cf-turnstile-response";
const TOKEN_WAIT = 8000;

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = {
  /** Champ à joindre au corps de la requête protégée. Attend la fin de la vérification si elle est en cours. */
  payload: () => Promise<Record<string, string>>;
  /** Un jeton ne sert qu'une fois : à appeler après chaque envoi qui laisse la page ouverte. */
  reset: () => void;
};

type Props = {
  action: string;
  ref: React.Ref<TurnstileHandle>;
  error?: string;
  /** « interaction-only » : le widget reste caché tant que le visiteur n'a rien à faire. */
  appearance?: "always" | "interaction-only";
};

let script: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  script ??= new Promise<TurnstileApi>((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = SCRIPT_URL;
    tag.async = true;
    tag.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile indisponible")));
    tag.onerror = () => {
      script = null;
      tag.remove();
      reject(new Error("Turnstile injoignable"));
    };
    document.head.append(tag);
  });
  return script;
}

export default function Turnstile({ action, ref, error, appearance = "always" }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  // Vrai quand aucun jeton n'arrivera tout seul : widget en échec, ou case à cocher par le visiteur.
  const stalled = useRef(false);
  const waiters = useRef<((token: string | null) => void)[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      async payload(): Promise<Record<string, string>> {
        const value =
          token.current || stalled.current
            ? token.current
            : await new Promise<string | null>((resolve) => {
                const done = (result: string | null) => {
                  clearTimeout(timer);
                  waiters.current = waiters.current.filter((waiter) => waiter !== done);
                  resolve(result);
                };
                const timer = setTimeout(() => done(null), TOKEN_WAIT);
                waiters.current.push(done);
              });
        // Sans jeton, la requête part quand même : c'est l'API qui décide si elle l'exige.
        return value ? { [TOKEN_FIELD]: value } : {};
      },
      reset() {
        token.current = null;
        if (!widget.current) return;
        stalled.current = false;
        window.turnstile?.reset(widget.current);
      },
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    token.current = null;
    stalled.current = false;

    const settle = (value: string | null) => {
      token.current = value;
      stalled.current = value === null;
      for (const waiter of [...waiters.current]) waiter(value);
    };

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widget.current = turnstile.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          appearance,
          language: "fr",
          // Le format habituel fait 300 px au minimum : sur un écran plus étroit, format compact.
          size: container.current.clientWidth >= 300 ? "flexible" : "compact",
          theme: "light",
          callback: (value: string) => settle(value),
          // Le widget redemande un jeton tout seul quand le précédent expire.
          "expired-callback": () => {
            token.current = null;
          },
          "error-callback": () => {
            settle(null);
            return true;
          },
          "before-interactive-callback": () => settle(null),
          "unsupported-callback": () => settle(null),
        });
      })
      .catch(() => {
        if (!cancelled) settle(null);
      });

    return () => {
      cancelled = true;
      settle(null);
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [action, appearance]);

  return (
    <div>
      {/* Dès 360 px d'écran, le widget garde ses 300 px en débordant, centré, dans les marges de la carte.
          w-0 min-w-full : ce débordement ne doit pas élargir la carte elle-même. */}
      <div className="flex w-0 min-w-full justify-center">
        <div
          ref={container}
          className={`w-full min-[360px]:min-w-[300px] ${appearance === "always" ? "min-h-[65px]" : ""}`}
        />
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
