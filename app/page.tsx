'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import LogViewer from './components/LogViewer';
import { LogEntry } from './types/log';
import { parseLogFile } from './utils/parser';

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      const parsed = await parseLogFile(file);
      setLogs(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Global drag & drop handlers
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) setIsDragging(false);
    };
    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) await handleFile(file);
    };
    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [handleFile]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-base font-bold text-gray-900">Solarwinds Archive Viewer</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Open File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".tsv,.json,.gz,.txt"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) { await handleFile(file); e.target.value = ''; }
            }}
          />
          {fileName && (
            <span className="text-sm text-gray-600 truncate max-w-60" title={fileName}>
              📄 {fileName}
            </span>
          )}
        </div>
        {isLoading && (
          <span className="text-sm text-blue-600 flex items-center gap-1">
            <span className="inline-block w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            Loading...
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600">⚠ {error}</span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          Drag &amp; drop a file anywhere · TSV / JSON / GZIP
        </span>
        <a href="https://github.com/cyrus07424" target="_blank" className="text-xs text-gray-400 hover:text-gray-600">
          © cyrus
        </a>
      </header>

      {/* Main area */}
      <main className="flex-1 min-h-0 flex flex-col">
        {logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 p-8">
            <div className="text-6xl">📋</div>
            <p className="text-xl font-medium">No logs loaded</p>
            <p className="text-sm">Open a file or drag &amp; drop it anywhere on this page</p>
            <p className="text-xs text-gray-500">Supported: TSV, JSON, GZIP archives</p>
          </div>
        ) : (
          <LogViewer logs={logs} />
        )}
      </main>

      {/* Drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/30 border-4 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl px-12 py-8 text-center shadow-2xl">
            <div className="text-5xl mb-3">📂</div>
            <p className="text-2xl font-bold text-gray-900">Drop to open</p>
          </div>
        </div>
      )}
    </div>
  );
}

