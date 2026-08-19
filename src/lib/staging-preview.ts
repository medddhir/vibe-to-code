export const STAGING_PREVIEW_HOSTNAME = "staging.vibe-to-code.tech";
export const PRODUCTION_HOSTNAME = "vibe-to-code.tech";

const normalizeHost = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  const match = /^([^/:\s]+?)(?::\d+)?\.?$/.exec(normalized);

  return match?.[1] ?? null;
};

export const isStagingCoursePreviewHost = (
  host: string | null | undefined,
): boolean => normalizeHost(host) === STAGING_PREVIEW_HOSTNAME;

export const shouldUseRemoteProgressSync = (
  configured: boolean,
  host: string | null | undefined,
): boolean => {
  const normalizedHost = normalizeHost(host);

  if (normalizedHost === STAGING_PREVIEW_HOSTNAME) return false;
  return configured || normalizedHost === PRODUCTION_HOSTNAME;
};
