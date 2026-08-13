const LESSON_PROGRESS_EVENT = "vibe-to-code:lesson-progress";
const LESSON_PROGRESS_STORAGE_PREFIX = "vibe-to-code:lesson-progress:v1";

const inMemoryProgress = new Map<string, string>();
const memoryOnlyProgress = new Set<string>();

type LessonProgressEventDetail = {
  lessonId?: string;
  storageKey?: string;
};

export const getLessonStoragePrefix = (lessonId: string) =>
  `${LESSON_PROGRESS_STORAGE_PREFIX}:${lessonId}:lesson-v`;

export const getLessonStorageKey = (lessonId: string, lessonVersion: number) =>
  `${getLessonStoragePrefix(lessonId)}${lessonVersion}`;

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function dispatchLessonProgress(detail: LessonProgressEventDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(LESSON_PROGRESS_EVENT, { detail }));
}

export function readLessonProgressSnapshot(storageKey: string) {
  if (typeof window === "undefined") {
    return "";
  }

  if (memoryOnlyProgress.has(storageKey)) {
    return inMemoryProgress.get(storageKey) ?? "";
  }

  const storage = getLocalStorage();
  if (!storage) {
    memoryOnlyProgress.add(storageKey);
    return inMemoryProgress.get(storageKey) ?? "";
  }

  try {
    return storage.getItem(storageKey) ?? inMemoryProgress.get(storageKey) ?? "";
  } catch {
    memoryOnlyProgress.add(storageKey);
    return inMemoryProgress.get(storageKey) ?? "";
  }
}

export function writeLessonProgressSnapshot(storageKey: string, value: string) {
  inMemoryProgress.set(storageKey, value);

  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.setItem(storageKey, value);
    } catch {
      memoryOnlyProgress.add(storageKey);
      // The in-memory copy keeps the lesson usable when storage is blocked or full.
    }
  } else {
    memoryOnlyProgress.add(storageKey);
  }

  dispatchLessonProgress({ storageKey });
}

export function subscribeToLessonProgress(
  storageKey: string,
  callback: () => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const versionMarker = ":lesson-v";
  const lessonPrefix = storageKey.slice(
    0,
    storageKey.lastIndexOf(versionMarker) + versionMarker.length,
  );

  function handleLocalProgress(event: Event) {
    const detail = (event as CustomEvent<LessonProgressEventDetail>).detail;
    if (
      detail?.storageKey === storageKey ||
      (detail?.lessonId && lessonPrefix === getLessonStoragePrefix(detail.lessonId))
    ) {
      callback();
    }
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) {
      callback();
    }
  }

  window.addEventListener(LESSON_PROGRESS_EVENT, handleLocalProgress);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(LESSON_PROGRESS_EVENT, handleLocalProgress);
    window.removeEventListener("storage", handleStorage);
  };
}

function collectStoredKeys(prefix: string) {
  const keys = new Set<string>();

  for (const key of inMemoryProgress.keys()) {
    if (key.startsWith(prefix)) {
      keys.add(key);
    }
  }

  const storage = getLocalStorage();
  if (!storage) {
    return keys;
  }

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) {
        keys.add(key);
      }
    }
  } catch {
    // A blocked storage API should not prevent the in-memory reset.
  }

  return keys;
}

export function clearStoredLessonProgress(lessonId: string) {
  const prefix = getLessonStoragePrefix(lessonId);
  const keys = collectStoredKeys(prefix);
  const storage = getLocalStorage();

  for (const key of keys) {
    inMemoryProgress.delete(key);
    memoryOnlyProgress.delete(key);

    if (storage) {
      try {
        storage.removeItem(key);
      } catch {
        // The in-memory reset still succeeds when persistent storage is blocked.
      }
    }
  }

  dispatchLessonProgress({ lessonId });
}

export function clearStoredLessonProgressForLessons(
  lessonIds: readonly string[],
) {
  for (const lessonId of new Set(lessonIds)) {
    clearStoredLessonProgress(lessonId);
  }
}
