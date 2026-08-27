'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { LogEntry } from '../types/log';
import { filterLogsByText, filterLogsByTimeRange } from '../utils/parser';
import { parseAnsiString, hasAnsiCodes, stripAnsiCodes } from '../utils/ansi';

interface LogViewerProps {
  logs: LogEntry[];
}

function AnsiText({ text, className }: { text: string; className?: string }) {
  if (!hasAnsiCodes(text)) {
    return <span className={className}>{text}</span>;
  }
  const segments = parseAnsiString(text);
  return (
    <span className={className}>
      {segments.map((seg, i) => (
        <span key={i} style={seg.style}>{seg.text}</span>
      ))}
    </span>
  );
}

export default function LogViewer({ logs }: LogViewerProps) {
  const [searchText, setSearchText] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showReversedOrder, setShowReversedOrder] = useState(true);
  const [wrapMessage, setWrapMessage] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [highlightText, setHighlightText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Unique severities for filter
  const allSeverities = useMemo(() => {
    const s = new Set(logs.map(l => l.severity));
    return Array.from(s).sort();
  }, [logs]);

  // Unique sources for filter
  const allSources = useMemo(() => {
    const s = new Set(logs.map(l => l.source));
    return Array.from(s).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let filtered = filterLogsByText(logs, searchText);
    filtered = filterLogsByTimeRange(filtered, startTime, endTime);
    if (severityFilter.length > 0) {
      filtered = filtered.filter(l => severityFilter.includes(l.severity));
    }
    if (sourceFilter) {
      filtered = filtered.filter(l => l.source === sourceFilter);
    }
    return filtered;
  }, [logs, searchText, startTime, endTime, severityFilter, sourceFilter]);

  const displayedLogs = useMemo(() => {
    return showReversedOrder ? [...filteredLogs].reverse() : filteredLogs;
  }, [filteredLogs, showReversedOrder]);

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
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
      case 'informational':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRowBg = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'err':
      case 'critical':
        return 'border-l-4 border-l-red-400';
      case 'warning':
      case 'warn':
        return 'border-l-4 border-l-yellow-400';
      default:
        return 'border-l-4 border-l-transparent';
    }
  };

  const toggleSeverityFilter = (severity: string) => {
    setSeverityFilter(prev =>
      prev.includes(severity) ? prev.filter(s => s !== severity) : [...prev, severity]
    );
  };

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(`Copied ${label}`);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  }, []);

  const copyAllVisible = () => {
    const text = displayedLogs
      .map(l => `${l.timestamp}\t${l.severity}\t${l.source}\t${stripAnsiCodes(l.message)}`)
      .join('\n');
    copyToClipboard(text, `${displayedLogs.length} lines`);
  };

  const scrollToTop = () => { listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); };
  const scrollToBottom = () => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); };

  const clearFilters = () => {
    setSearchText('');
    setStartTime('');
    setEndTime('');
    setSeverityFilter([]);
    setSourceFilter('');
    setHighlightText('');
  };

  const hasFilters = searchText || startTime || endTime || severityFilter.length > 0 || sourceFilter;

  const messageClassName = wrapMessage
    ? 'text-xs font-mono whitespace-pre-wrap break-all'
    : 'text-xs font-mono truncate';

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
        No logs to display. Upload or drag &amp; drop a file.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 p-3 space-y-2 flex-shrink-0">
        <div className="flex flex-wrap gap-2 items-end">
          {/* Text Search */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search logs..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/* Highlight */}
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-medium text-gray-500 mb-1">Highlight</label>
            <input
              type="text"
              value={highlightText}
              onChange={(e) => setHighlightText(e.target.value)}
              placeholder="Highlight text..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          </div>
          {/* Start Time */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/* End Time */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/* Source filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All sources</option>
              {allSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Severity filter chips */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-xs text-gray-500 mr-1">Severity:</span>
          {allSeverities.map(sev => (
            <button
              key={sev}
              onClick={() => toggleSeverityFilter(sev)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                severityFilter.includes(sev)
                  ? getSeverityColor(sev) + ' font-semibold'
                  : 'text-gray-500 bg-white border-gray-300 hover:border-gray-400'
              }`}
            >
              {sev}
            </button>
          ))}
          <span className="ml-3 flex gap-3">
            <label className="inline-flex items-center text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showReversedOrder} onChange={(e) => setShowReversedOrder(e.target.checked)} className="mr-1" />
              Newest first
            </label>
            <label className="inline-flex items-center text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={wrapMessage} onChange={(e) => setWrapMessage(e.target.checked)} className="mr-1" />
              Wrap
            </label>
            <label className="inline-flex items-center text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showLineNumbers} onChange={(e) => setShowLineNumbers(e.target.checked)} className="mr-1" />
              Line #
            </label>
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {filteredLogs.length.toLocaleString()} / {logs.length.toLocaleString()} entries
            </span>
            {copyFeedback && <span className="text-xs text-green-600">{copyFeedback}</span>}
            <button onClick={copyAllVisible} className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded">
              Copy visible
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700">
                Clear filters
              </button>
            )}
          </span>
        </div>
      </div>

      {/* Log List */}
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 bg-gray-50 font-mono text-xs">
        {displayedLogs.length === 0 ? (
          <div className="text-gray-400 text-center py-16">No logs match the current filters.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
              <tr>
                {showLineNumbers && <th className="px-2 py-1 text-right w-12 border-b border-gray-200 font-medium">#</th>}
                <th className="px-2 py-1 text-left border-b border-gray-200 font-medium whitespace-nowrap">Timestamp</th>
                <th className="px-2 py-1 text-left border-b border-gray-200 font-medium w-16">Level</th>
                <th className="px-2 py-1 text-left border-b border-gray-200 font-medium whitespace-nowrap">Source</th>
                <th className="px-2 py-1 text-left border-b border-gray-200 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {displayedLogs.map((log, idx) => {
                const lineNum = showReversedOrder ? filteredLogs.length - idx : idx + 1;
                const isSelected = selectedLog?.id === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${getRowBg(log.severity)}`}
                      onClick={() => setSelectedLog(isSelected ? null : log)}
                    >
                      {showLineNumbers && (
                        <td className="px-2 py-1 text-right text-gray-400 select-none border-b border-gray-100">{lineNum}</td>
                      )}
                      <td className="px-2 py-1 text-gray-500 whitespace-nowrap border-b border-gray-100">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-2 py-1 border-b border-gray-100">
                        <span className={`inline-block px-1 rounded text-xs border ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-gray-500 whitespace-nowrap max-w-32 truncate border-b border-gray-100" title={log.source}>
                        {log.source}
                      </td>
                      <td className={`px-2 py-1 border-b border-gray-100 ${wrapMessage ? 'whitespace-pre-wrap break-all' : 'truncate max-w-0'}`}>
                        <HighlightedAnsiText
                          text={log.message}
                          highlight={highlightText}
                          wrap={wrapMessage}
                          onCopy={() => copyToClipboard(stripAnsiCodes(log.message), 'message')}
                        />
                      </td>
                    </tr>
                    {isSelected && (
                      <tr key={`${log.id}-detail`} className="bg-blue-50">
                        <td colSpan={showLineNumbers ? 5 : 4} className="p-3 border-b border-blue-200">
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => copyToClipboard(stripAnsiCodes(log.message), 'message')}
                              className="text-xs px-2 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Copy message
                            </button>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(log.raw, null, 2), 'raw JSON')}
                              className="text-xs px-2 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Copy raw JSON
                            </button>
                          </div>
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-gray-600">Full message:</span>
                            <pre className="mt-1 text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words">
                              <AnsiText text={log.message} />
                            </pre>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-600">Raw data:</span>
                            <pre className="mt-1 text-xs bg-gray-100 text-gray-700 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.raw, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer scroll controls */}
      <div className="bg-white border-t border-gray-200 px-3 py-1 flex gap-2 justify-end flex-shrink-0">
        <button onClick={scrollToTop} className="text-xs text-gray-500 hover:text-gray-700">↑ Top</button>
        <button onClick={scrollToBottom} className="text-xs text-gray-500 hover:text-gray-700">↓ Bottom</button>
      </div>
    </div>
  );
}

function HighlightedAnsiText({
  text,
  highlight,
  wrap,
  onCopy,
}: {
  text: string;
  highlight: string;
  wrap: boolean;
  onCopy: () => void;
}) {
  const className = wrap ? 'whitespace-pre-wrap break-all' : undefined;

  if (!highlight) {
    return (
      <span onDoubleClick={onCopy} title="Double-click to copy">
        <AnsiText text={text} className={className} />
      </span>
    );
  }

  // Strip ANSI for highlighting purposes, then reassemble with highlights on plain text
  const plain = stripAnsiCodes(text);
  const lowerPlain = plain.toLowerCase();
  const lowerHighlight = highlight.toLowerCase();

  const parts: { text: string; highlight: boolean }[] = [];
  let i = 0;
  while (i < plain.length) {
    const idx = lowerPlain.indexOf(lowerHighlight, i);
    if (idx === -1) {
      parts.push({ text: plain.slice(i), highlight: false });
      break;
    }
    if (idx > i) parts.push({ text: plain.slice(i, idx), highlight: false });
    parts.push({ text: plain.slice(idx, idx + highlight.length), highlight: true });
    i = idx + highlight.length;
  }

  return (
    <span onDoubleClick={onCopy} title="Double-click to copy" className={className}>
      {parts.map((p, i) =>
        p.highlight
          ? <mark key={i} className="bg-yellow-300 text-gray-900">{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </span>
  );
}

