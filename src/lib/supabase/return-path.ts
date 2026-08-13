const DEFAULT_RETURN_PATH = "/learn";
const MAX_RETURN_PATH_LENGTH = 2_048;
const UNSAFE_CHARACTER_PATTERN = /[\\\u0000-\u001f\u007f]/;

const decodeForValidation = (value: string): string | null => {
  let decoded = value;

  try {
    for (let pass = 0; pass < 3; pass += 1) {
      const next = decodeURIComponent(decoded);

      if (next === decoded) {
        break;
      }

      decoded = next;
    }

    return decoded;
  } catch {
    return null;
  }
};

export const isSafeReturnPath = (candidate: string): boolean => {
  if (
    candidate.length === 0 ||
    candidate.length > MAX_RETURN_PATH_LENGTH ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    UNSAFE_CHARACTER_PATTERN.test(candidate)
  ) {
    return false;
  }

  const decoded = decodeForValidation(candidate);

  if (
    !decoded ||
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    UNSAFE_CHARACTER_PATTERN.test(decoded)
  ) {
    return false;
  }

  return true;
};

export const resolveSafeReturnPath = (
  candidate: string | null | undefined,
  fallback = DEFAULT_RETURN_PATH,
): string => {
  if (candidate && isSafeReturnPath(candidate)) {
    return candidate;
  }

  return isSafeReturnPath(fallback) ? fallback : DEFAULT_RETURN_PATH;
};
