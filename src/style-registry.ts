/**
 * Style Registry
 *
 * Provides a shared, JS-object-based alternative to CSS @import for sharing
 * reusable styles across components. Styles are registered under a namespace
 * and exposed to every component as `$styles` on its evaluation context.
 *
 * Companion helper `styleObjectToCss` converts plain style objects to a CSS
 * declaration string suitable for the `style` attribute, enabling
 * `:style="{ ...$styles.theme.card, ...overrides }"` in templates.
 */

type StyleObject = Record<string, unknown>;
type StyleNamespace = Record<string, StyleObject>;

const registry: Record<string, StyleNamespace> = {};

/**
 * Register or extend a namespace of reusable style objects.
 * Re-calling with the same namespace merges; same key overrides.
 */
export function defineStyles(namespace: string, styles: StyleNamespace): void {
  registry[namespace] = { ...(registry[namespace] ?? {}), ...styles };
}

/**
 * Return the live registry. Components hold this reference as `$styles`,
 * so styles defined after a component mounts are visible on its next render.
 */
export function getStyles(): Record<string, StyleNamespace> {
  return registry;
}

/**
 * For tests only — drop all registered namespaces.
 */
export function clearStyles(): void {
  for (const key in registry) delete registry[key];
}

function toKebabCase(key: string): string {
  // CSS custom properties pass through unchanged
  if (key.startsWith("--")) return key;
  // WebkitTransform -> -webkit-transform; borderRadius -> border-radius
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Convert a style object into a CSS declaration string.
 *
 * - camelCase keys become kebab-case (`borderRadius` -> `border-radius`)
 * - leading-uppercase keys become vendor-prefixed (`WebkitTransform` -> `-webkit-transform`)
 * - keys starting with `--` pass through (custom properties)
 * - `null`, `undefined`, and `false` values are skipped (handy for conditional spreads)
 * - nested objects are skipped (selectors/media queries belong in `<style>`)
 * - numbers are stringified as-is — no automatic `px` suffix; pass `"16px"` or `"1rem"` explicitly
 */
export function styleObjectToCss(styles: StyleObject): string {
  const parts: string[] = [];
  for (const key in styles) {
    const value = styles[key];
    if (value === null || value === undefined || value === false) continue;
    if (typeof value === "object") continue;
    parts.push(`${toKebabCase(key)}: ${value}`);
  }
  return parts.join("; ");
}
