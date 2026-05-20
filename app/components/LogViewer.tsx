'use client';

import { useState, useMemo } from 'react';
import { LogEntry } from '../types/log';
import { filterLogsByText, filterLogsByTimeRange } from '../utils/parser';

interface LogViewerProps {
  logs: LogEntry[];
}

export default function LogViewer({ logs }: LogViewerProps) {
  const [searchText, setSearchText] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDescending, setIsDescending] = useState(true);
  const [wrapMessage, setWrapMessage] = useState(false);

  const filteredLogs = useMemo(() => {
    let filtered = filterLogsByText(logs, searchText);
    filtered = filterLogsByTimeRange(filtered, startTime, endTime);
    return filtered;
  }, [logs, searchText, startTime, endTime]);

  const displayedLogs = useMemo(() => {
    return isDescending ? [...filteredLogs].reverse() : filteredLogs;
  }, [filteredLogs, isDescending]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('ja-JP');
    } catch {
      return timestamp;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'err':
        return 'text-red-600 bg-red-50';
      case 'warning':
      case 'warn':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
      case 'informational':
        return 'text-blue-600 bg-blue-50';
      case 'debug':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const messageClassName = wrapMessage
    ? 'text-sm text-gray-900 whitespace-pre-wrap break-words'
    : 'text-sm text-gray-900 truncate';

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-500 text-center">No logs to display. Please upload a file.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Log Viewer ({displayedLogs.length} of {logs.length} entries)
        </h2>
        
        {/* Search Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Text Search
            </label>
            <input
              id="search"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search in logs..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isDescending}
              onChange={(e) => setIsDescending(e.target.checked)}
              className="mr-2"
            />
            Show reverse order (from original file order)
          </label>
          <label className="inline-flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={wrapMessage}
              onChange={(e) => setWrapMessage(e.target.checked)}
              className="mr-2"
            />
            Wrap message text (show full content)
          </label>
        </div>

        {(searchText || startTime || endTime) && (
          <button
            onClick={() => {
              setSearchText('');
              setStartTime('');
              setEndTime('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Log Entries */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayedLogs.map((log) => (
          <div
            key={log.id}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm text-gray-500">{formatTimestamp(log.timestamp)}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  <span className="text-xs text-gray-500">{log.app_name}</span>
                  <span className="text-xs text-gray-500">{log.source}</span>
                </div>
                <div className={messageClassName}>
                  {log.message}
                </div>
              </div>
              <div className="text-xs text-gray-400 ml-2">
                {selectedLog?.id === log.id ? '−' : '+'}
              </div>
            </div>
            
            {selectedLog?.id === log.id && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Raw Data:</h4>
                <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(log.raw, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {displayedLogs.length === 0 && logs.length > 0 && (
        <p className="text-gray-500 text-center py-8">
          No logs match the current filters.
        </p>
      )}
    </div>
  );
}
