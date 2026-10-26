/**
 * Returns the nearest directory among [dir] and its ancestors whose basename is one of
 * [names], or [undefined] if there is none. E.g. with names ["+share+", "+clone+"],
 * "/ws/fe-1/+share+/app/foo" resolves to "/ws/fe-1/+share+".
 */
export function findAncestorDir(
  dir: string,
  names: readonly string[],
): string | undefined {
  const parts = dir.split("/");
  for (let i = parts.length; i > 0; i--) {
    const basename = parts[i - 1];
    if (basename !== "" && names.includes(basename)) {
      return parts.slice(0, i).join("/");
    }
  }
  return undefined;
}
