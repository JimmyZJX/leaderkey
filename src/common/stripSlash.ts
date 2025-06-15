const RE_TRAILING_SLASH = /\/$/;
export function stripSlash(basename: string) {
  return basename.replace(RE_TRAILING_SLASH, "");
}
