// Theme preference. Read on the server so the correct palette is in the HTML
// before first paint — a client-side toggle alone would flash the wrong theme
// on every navigation.
//
// A plain cookie, not localStorage: the server has to see it to render
// data-theme, and localStorage isn't readable during SSR.

export const THEME_COOKIE = "mindspace-theme";

/** "system" is represented by the absence of the cookie, so it needs no value. */
export type Theme = "light" | "dark";

export function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}
