'use client';

import { useState } from 'react';
import { LogEntry } from '../types/log';

const sampleTSVLogs: LogEntry[] = [
  {
    id: "1889499905812090900",
    timestamp: "2025-08-05 21:25:05",
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
    timestamp: "2025-08-05 21:25:05",
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
    id: "1889499920000000000",
    timestamp: "2025-08-05 21:25:08",
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

export default function TestPage() {
  const [showSample, setShowSample] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Solarwinds Archive Viewer - Test Demo
          </h1>
          <p className="text-center text-gray-600">
            Demonstration of log parsing and viewing functionality
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Sample Data Test
          </h2>
          <button
            onClick={() => setShowSample(!showSample)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showSample ? 'Hide' : 'Show'} Sample Logs
          </button>
        </div>

        {showSample && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Sample Log Entries ({sampleTSVLogs.length} entries)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sampleTSVLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm text-gray-500">{log.timestamp}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.severity === 'Error' ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
                        }`}>
                          {log.severity}
                        </span>
                        <span className="text-xs text-gray-500">{log.app_name}</span>
                        <span className="text-xs text-gray-500">{log.source}</span>
                      </div>
                      <div className="text-sm text-gray-900">{log.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}