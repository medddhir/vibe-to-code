const JSON_CONTENT_TYPE = "application/json";

export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    const requestOrigin = new URL(request.url).origin;
    const suppliedOrigin = new URL(origin).origin;
    const fetchSite = request.headers.get("sec-fetch-site");

    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
      return false;
    }

    return suppliedOrigin === requestOrigin;
  } catch {
    return false;
  }
}

export function hasJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type");
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === JSON_CONTENT_TYPE;
}

export function isBodyWithinLimit(request: Request, maximumBytes: number) {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return true;
  }

  const parsed = Number(contentLength);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= maximumBytes;
}

export function isUuid(value: string | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );
}
