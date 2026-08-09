"use client";

import { useState } from "react";

type FileTab = {
  id: string;
  label: string;
  content: string;
  language: string;
};

type FileTabsProps = {
  files: FileTab[];
  onFileChange?: (fileId: string, content: string) => void;
  renderPreview?: (activeFile: FileTab) => React.ReactNode;
};

export function FileTabs({ files: initialFiles, onFileChange, renderPreview }: FileTabsProps) {
  const [files, setFiles] = useState(initialFiles);
  const [activeId, setActiveId] = useState(initialFiles[0]?.id ?? "");
  const activeFile = files.find((file) => file.id === activeId) ?? files[0];

  function updateActiveContent(nextContent: string) {
    if (!activeFile) {
      return;
    }

    setFiles((current) =>
      current.map((file) =>
        file.id === activeFile.id ? { ...file, content: nextContent } : file,
      ),
    );

    if (onFileChange) {
      onFileChange(activeFile.id, nextContent);
    }
  }

  return (
    <section className="file-tabs">
      <div className="file-tab-row" role="tablist" aria-label="Lesson source files">
        {files.map((file, index) => {
          const isActive = file.id === activeFile?.id;
          return (
            <button
              key={file.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "is-active" : undefined}
              onClick={() => setActiveId(file.id)}
            >
              {String(index + 1).padStart(2, "0")} {file.label}
            </button>
          );
        })}
      </div>

      <div className="file-tab-content">
        <label htmlFor={`file-${activeFile?.id}-editor`}>
          {activeFile ? `${activeFile.label} (${activeFile.language})` : "File"}
        </label>
        {activeFile ? (
          <textarea
            id={`file-${activeFile.id}-editor`}
            value={activeFile.content}
            onChange={(event) => updateActiveContent(event.target.value)}
          />
        ) : null}
      </div>

      {renderPreview ? <div className="file-preview-wrap">{renderPreview(activeFile)}</div> : null}
    </section>
  );
}
