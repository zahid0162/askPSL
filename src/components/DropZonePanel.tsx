import React, { useRef, useState } from 'react';
import {
  FileJson,
  FolderOpen,
  FileArchive,
  Database,
  Trash2,
  Upload,
} from 'lucide-react';

interface DropZonePanelProps {
  hasFiles: boolean;
  isProcessing: boolean;
  progress: { processed: number; total: number; currentFile: string } | null;
  onFilesSelected: (files: File[]) => void;
  onLoadSampleData: () => void;
  onClearAll: () => void;
}

async function traverseFileTree(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => resolve([file]),
        () => resolve([])
      );
    });
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries: FileSystemEntry[] = [];
    const readBatch = (): Promise<void> =>
      new Promise((resolve) => {
        reader.readEntries(
          async (batch) => {
            if (batch.length === 0) {
              resolve();
            } else {
              entries.push(...batch);
              await readBatch();
              resolve();
            }
          },
          () => resolve()
        );
      });
    await readBatch();
    const nested = await Promise.all(entries.map(traverseFileTree));
    return nested.flat();
  }
  return [];
}

export function DropZonePanel({
  hasFiles,
  isProcessing,
  progress,
  onFilesSelected,
  onLoadSampleData,
  onClearAll,
}: DropZonePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }
      if (entries.length > 0) {
        const collected = (await Promise.all(entries.map(traverseFileTree))).flat();
        if (collected.length > 0) {
          onFilesSelected(collected);
          return;
        }
      }
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
  };

  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={`rounded-xl border transition-colors ${
        isDragging
          ? 'border-emerald-700 bg-emerald-50/40'
          : 'border-slate-200 bg-white'
      } ${hasFiles ? 'p-4' : 'p-8'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".json,application/json"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is supported across Chromium/Firefox/Safari
        webkitdirectory=""
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleInputChange}
        className="hidden"
      />

      {!hasFiles ? (
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-emerald-700">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Merge PSL Match JSON Files into One ML-Ready CSV
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl">
            Drop all your Pakistan Super League match{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              .json
            </code>{' '}
            files, a full folder, or a Cricsheet{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
              .zip
            </code>{' '}
            archive. Everything runs locally in your browser with zero file-size upload limits.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileJson className="h-4 w-4" aria-hidden="true" />
              <span>Select JSON Files</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderOpen className="h-4 w-4 text-slate-600" aria-hidden="true" />
              <span>Select Folder</span>
            </button>

            <button
              type="button"
              onClick={() => zipInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileArchive className="h-4 w-4 text-slate-600" aria-hidden="true" />
              <span>Upload ZIP Archive</span>
            </button>

            <button
              type="button"
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Database className="h-4 w-4 text-slate-600" aria-hidden="true" />
              <span>Load Sample PSL Matches</span>
            </button>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            Supports Cricsheet v1.0 &amp; legacy JSON schemas · Custom nested match JSON · 100% client-side processing
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-emerald-700">
              <FileJson className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900">
                Drop more .json files, folders, or .zip archives anywhere here
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Files are merged into a unified dataset automatically
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add JSONs</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add Folder</span>
            </button>

            <button
              type="button"
              onClick={() => zipInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileArchive className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Add ZIP</span>
            </button>

            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && progress && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
            <span className="truncate max-w-md">
              Parsing <span className="font-mono">{progress.currentFile}</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {progress.processed} / {progress.total} ({progressPct}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-700 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
