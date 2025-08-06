'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import LogViewer from './components/LogViewer';
import { LogEntry } from './types/log';

// Sample data for demonstration
const sampleLogs: LogEntry[] = [
  {
    id: "1889499905812090900",
    timestamp: "2025-08-05T21:25:05.000Z",
    app_name: "my-app-name",
    source: "heroku/web.1",
    severity: "Info",
    message: "Idling",
    raw: {
      event_id: "1889499905812090900",
      timestamp1: "2025-08-05 21:25:05",
      timestamp2: "2025-08-05 21:25:05",
      token: "14114195911",
      app_name: "my-app-name",
      ip: "52.44.5.217",
      facility: "Local0",
      severity: "Info",
      process: "heroku/web.1",
      message: "Idling"
    }
  },
  {
    id: "1889499905812090901",
    timestamp: "2025-08-05T21:25:05.000Z",
    app_name: "my-app-name",
    source: "heroku/web.1",
    severity: "Info",
    message: "State changed from up to down",
    raw: {
      event_id: "1889499905812090901",
      timestamp1: "2025-08-05 21:25:05",
      timestamp2: "2025-08-05 21:25:05",
      token: "14114195911",
      app_name: "my-app-name",
      ip: "52.44.5.217",
      facility: "Local0",
      severity: "Info",
      process: "heroku/web.1",
      message: "State changed from up to down"
    }
  },
  {
    id: "1889499910098747420",
    timestamp: "2025-08-05T21:25:06.000Z",
    app_name: "my-app-name",
    source: "heroku/web.1",
    severity: "Info",
    message: "Stopping all processes with SIGTERM",
    raw: {
      event_id: "1889499910098747420",
      timestamp1: "2025-08-05 21:25:06",
      timestamp2: "2025-08-05 21:25:06",
      token: "14114195911",
      app_name: "my-app-name",
      ip: "34.237.99.82",
      facility: "Local0",
      severity: "Info",
      process: "heroku/web.1",
      message: "Stopping all processes with SIGTERM"
    }
  },
  {
    id: "1889499914632646656",
    timestamp: "2025-08-05T21:25:07.000Z",
    app_name: "my-app-name",
    source: "heroku/web.1",
    severity: "Info",
    message: "Process exited with status 143",
    raw: {
      event_id: "1889499914632646656",
      timestamp1: "2025-08-05 21:25:07",
      timestamp2: "2025-08-05 21:25:07",
      token: "14114195911",
      app_name: "my-app-name",
      ip: "35.174.132.118",
      facility: "Local0",
      severity: "Info",
      process: "heroku/web.1",
      message: "Process exited with status 143"
    }
  },
  {
    id: "1889499920000000000",
    timestamp: "2025-08-05T21:25:08.000Z",
    app_name: "my-app-name",
    source: "heroku/web.1",
    severity: "Error",
    message: "Application crashed with exit code 1",
    raw: {
      event_id: "1889499920000000000",
      timestamp1: "2025-08-05 21:25:08",
      timestamp2: "2025-08-05 21:25:08",
      token: "14114195911",
      app_name: "my-app-name",
      ip: "35.174.132.118",
      facility: "Local0",
      severity: "Error",
      process: "heroku/web.1",
      message: "Application crashed with exit code 1"
    }
  }
];

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleLogsLoaded = (newLogs: LogEntry[]) => {
    setLogs(newLogs);
  };

  const loadSampleData = () => {
    setLogs(sampleLogs);
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
        
        {/* Demo button */}
        {logs.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
                <p className="text-sm text-yellow-700">Try the viewer with sample log data</p>
              </div>
              <button
                onClick={loadSampleData}
                className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        )}
        
        <LogViewer logs={logs} />
      </div>
      
      <footer className="text-center text-gray-400 mt-8">
        &copy; 2025 <a href="https://github.com/cyrus07424" target="_blank" className="hover:text-gray-600">cyrus</a>
      </footer>
    </div>
  );
}
