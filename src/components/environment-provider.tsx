"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { isStagingCoursePreviewHost } from "@/lib/staging-preview";

const CurriculumReviewContext = createContext(false);
const subscribeToHost = () => () => {};
const getServerHostSnapshot = () => false;
const getBrowserHostSnapshot = () =>
  isStagingCoursePreviewHost(window.location.hostname);

export function EnvironmentProvider({
  curriculumReview,
  children,
}: {
  curriculumReview: boolean;
  children: ReactNode;
}) {
  const stagingPreview = useSyncExternalStore(
    subscribeToHost,
    getBrowserHostSnapshot,
    getServerHostSnapshot,
  );

  return (
    <CurriculumReviewContext.Provider value={curriculumReview || stagingPreview}>
      {children}
    </CurriculumReviewContext.Provider>
  );
}

export function useCurriculumReviewMode() {
  return useContext(CurriculumReviewContext);
}
