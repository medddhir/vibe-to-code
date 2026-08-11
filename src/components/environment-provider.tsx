"use client";

import { createContext, useContext, type ReactNode } from "react";

const CurriculumReviewContext = createContext(false);

export function EnvironmentProvider({
  curriculumReview,
  children,
}: {
  curriculumReview: boolean;
  children: ReactNode;
}) {
  return (
    <CurriculumReviewContext.Provider value={curriculumReview}>
      {children}
    </CurriculumReviewContext.Provider>
  );
}

export function useCurriculumReviewMode() {
  return useContext(CurriculumReviewContext);
}
