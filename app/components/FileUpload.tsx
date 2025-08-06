'use client';

import { useState } from 'react';
import { LogEntry } from '../types/log';
import { parseLogFile } from '../utils/parser';

interface FileUploadProps {
  onLogsLoaded: (logs: LogEntry[]) => void;
}

export default function FileUpload({ onLogsLoaded }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const logs = await parseLogFile(file);
      onLogsLoaded(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload Solarwinds Archive
      </h2>
      
      <div className="mb-4">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Select archive file (TSV, JSON, or GZIP)
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".tsv,.json,.gz,.txt"
          onChange={handleFileChange}
          disabled={isLoading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
      </div>

      {isLoading && (
        <div className="flex items-center text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Processing file...
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
          Error: {error}
        </div>
      )}

      <div className="text-sm text-gray-600 mt-4">
        <p>Supported formats:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>TSV files with Solarwinds log format</li>
          <li>JSON files with Papertrail/Solarwinds format</li>
          <li>GZIP archives containing TSV or JSON files</li>
        </ul>
      </div>
    </div>
  );
}