'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import LogViewer from './components/LogViewer';
import { LogEntry } from './types/log';

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleLogsLoaded = (newLogs: LogEntry[]) => {
    setLogs(newLogs);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Solarwinds Archive Viewer
          </h1>
          <p className="text-center text-gray-600">
            Upload and view Solarwinds (formerly Papertrail) log archives
          </p>
        </div>
        
        <FileUpload onLogsLoaded={handleLogsLoaded} />
        <LogViewer logs={logs} />
      </div>
      
      <footer className="text-center text-gray-400 mt-8">
        &copy; 2025 <a href="https://github.com/cyrus07424" target="_blank" className="hover:text-gray-600">cyrus</a>
      </footer>
    </div>
  );
}
