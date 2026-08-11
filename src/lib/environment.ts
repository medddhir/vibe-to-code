type EnvironmentInput = {
  explicitReview?: string;
  nodeEnvironment?: string;
  vercelEnvironment?: string;
};

export function resolveCurriculumReviewMode({
  explicitReview,
  nodeEnvironment,
  vercelEnvironment,
}: EnvironmentInput) {
  if (explicitReview === "true") {
    return true;
  }

  if (explicitReview === "false") {
    return false;
  }

  return (
    vercelEnvironment === "preview" ||
    vercelEnvironment === "development" ||
    nodeEnvironment === "development"
  );
}

export function getCurriculumReviewMode() {
  return resolveCurriculumReviewMode({
    explicitReview: process.env.NEXT_PUBLIC_UNLOCK_PUBLISHED_LESSONS,
    nodeEnvironment: process.env.NODE_ENV,
    vercelEnvironment: process.env.VERCEL_ENV,
  });
}
