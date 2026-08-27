'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { LogEntry } from '../types/log';
import { filterLogsByText, filterLogsByTimeRange } from '../utils/parser';
import { parseAnsiString, hasAnsiCodes, stripAnsiCodes } from '../utils/ansi';

interface LogViewerProps {
  logs: LogEntry[];
}

const LINE_NUMBER_WIDTH = 48;
const TIMESTAMP_WIDTH = 160;
const LEVEL_WIDTH = 96;
const SOURCE_WIDTH = 128;
const MESSAGE_MIN_WIDTH = 640;

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
  const [showReversedOrder, setShowReversedOrder] = useState(false);
  const [wrapMessage, setWrapMessage] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [highlightText, setHighlightText] = useState('');
  const [messageScrollLeft, setMessageScrollLeft] = useState(0);
  const [messageContentWidth, setMessageContentWidth] = useState(MESSAGE_MIN_WIDTH);

  const listRef = useRef<HTMLDivElement>(null);
  const messageColumnRef = useRef<HTMLDivElement>(null);
  const messageMeasureRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const bottomScrollbarRef = useRef<HTMLDivElement>(null);

  const allSeverities = useMemo(() => {
    const s = new Set(logs.map(l => l.severity));
    return Array.from(s).sort();
  }, [logs]);

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
    : 'text-xs font-mono whitespace-nowrap inline-block';

  const baseGridColumns = showLineNumbers
    ? `${LINE_NUMBER_WIDTH}px ${TIMESTAMP_WIDTH}px ${LEVEL_WIDTH}px ${SOURCE_WIDTH}px minmax(0, 1fr)`
    : `${TIMESTAMP_WIDTH}px ${LEVEL_WIDTH}px ${SOURCE_WIDTH}px minmax(0, 1fr)`;

  const measureMessageWidth = useCallback(() => {
    if (wrapMessage) {
      setMessageContentWidth(MESSAGE_MIN_WIDTH);
      setMessageScrollLeft(0);
      if (bottomScrollbarRef.current) {
        bottomScrollbarRef.current.scrollLeft = 0;
      }
      return;
    }

    const columnWidth = messageColumnRef.current?.clientWidth ?? 0;
    let maxWidth = Math.max(MESSAGE_MIN_WIDTH, columnWidth);
    for (const element of messageMeasureRefs.current.values()) {
      maxWidth = Math.max(maxWidth, element.scrollWidth);
    }
    setMessageContentWidth(maxWidth);
    setMessageScrollLeft(prev => {
      const next = Math.max(0, Math.min(prev, maxWidth - columnWidth));
      if (bottomScrollbarRef.current && bottomScrollbarRef.current.scrollLeft !== next) {
        bottomScrollbarRef.current.scrollLeft = next;
      }
      return next;
    });
  }, [wrapMessage]);

  const setMessageMeasureRef = useCallback((logId: string, node: HTMLDivElement | null) => {
    if (node) {
      messageMeasureRefs.current.set(logId, node);
    } else {
      messageMeasureRefs.current.delete(logId);
    }
  }, []);

  useEffect(() => {
    measureMessageWidth();
  }, [measureMessageWidth, displayedLogs, highlightText, showLineNumbers]);

  useEffect(() => {
    const handleResize = () => measureMessageWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureMessageWidth]);

  const detailModal = selectedLog && (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedLog(null)}>
      <div
        className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Log details</div>
            <div className="text-xs text-gray-500">{formatTimestamp(selectedLog.timestamp)}</div>
          </div>
          <button onClick={() => setSelectedLog(null)} className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700">
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-block rounded border px-2 py-0.5 text-xs ${getSeverityColor(selectedLog.severity)}`}>
              {selectedLog.severity}
            </span>
            <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">{selectedLog.source}</span>
            <button
              onClick={() => copyToClipboard(stripAnsiCodes(selectedLog.message), 'message')}
              className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
            >
              Copy message
            </button>
            <button
              onClick={() => copyToClipboard(JSON.stringify(selectedLog.raw, null, 2), 'raw JSON')}
              className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
            >
              Copy raw JSON
            </button>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-gray-600">Full message:</div>
            <pre className="rounded bg-gray-900 p-3 text-xs text-gray-100 overflow-x-auto whitespace-pre-wrap break-words">
              <AnsiText text={selectedLog.message} />
            </pre>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-gray-600">Raw data:</div>
            <pre className="rounded bg-gray-100 p-3 text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(selectedLog.raw, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
        No logs to display. Upload or drag &amp; drop a file.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="bg-white border-b border-gray-200 p-3 space-y-2 flex-shrink-0">
        <div className="flex flex-wrap gap-2 items-end">
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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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

      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 bg-gray-50 font-mono text-xs">
        {displayedLogs.length === 0 ? (
          <div className="text-gray-400 text-center py-16">No logs match the current filters.</div>
        ) : (
          <div className="min-w-0">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100 text-gray-600">
              <div className="grid" style={{ gridTemplateColumns: baseGridColumns }}>
                {showLineNumbers && (
                  <div
                    className="px-2 py-1 text-right font-medium"
                    title="Click a line number to open log details in a dialog."
                  >
                    #
                  </div>
                )}
                <div className="px-2 py-1 font-medium whitespace-nowrap">Timestamp</div>
                <div className="px-2 py-1 font-medium">Level</div>
                <div className="px-2 py-1 font-medium whitespace-nowrap">Source</div>
                <div className="px-2 py-1 font-medium">Message</div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {displayedLogs.map((log, idx) => {
                const lineNum = showReversedOrder ? filteredLogs.length - idx : idx + 1;
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                return (
                  <div
                    key={log.id}
                    className={`grid transition-colors hover:bg-blue-50 ${rowBg} ${getRowBg(log.severity)}`}
                    style={{ gridTemplateColumns: baseGridColumns }}
                  >
                    {showLineNumbers && (
                      <button
                        type="button"
                        className="px-2 py-1 text-right text-gray-400 select-none hover:bg-blue-100"
                        onClick={() => setSelectedLog(log)}
                      >
                        {lineNum}
                      </button>
                    )}
                    <div className="px-2 py-1 text-gray-500 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <div className="px-2 py-1">
                      <span className={`inline-block max-w-full truncate px-1 rounded text-xs border align-middle ${getSeverityColor(log.severity)}`} title={log.severity}>
                        {log.severity}
                      </span>
                    </div>
                    <div className="px-2 py-1 text-gray-500 whitespace-nowrap truncate" title={log.source}>
                      {log.source}
                    </div>
                    <div ref={idx === 0 ? messageColumnRef : undefined} className="px-2 py-1 overflow-hidden">
                      <div
                        className={wrapMessage ? '' : 'will-change-transform'}
                        style={wrapMessage ? undefined : { transform: `translateX(-${messageScrollLeft}px)` }}
                      >
                        <div ref={(node) => setMessageMeasureRef(log.id, node)}>
                          <HighlightedAnsiText
                            text={log.message}
                            highlight={highlightText}
                            wrap={wrapMessage}
                            className={messageClassName}
                            onCopy={() => copyToClipboard(stripAnsiCodes(log.message), 'message')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!wrapMessage && displayedLogs.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-3 py-1 flex-shrink-0">
          <div ref={bottomScrollbarRef} className="overflow-x-auto" onScroll={(e) => setMessageScrollLeft(e.currentTarget.scrollLeft)}>
            <div style={{ width: `${messageContentWidth}px`, height: '1px' }} />
          </div>
        </div>
      )}

      {detailModal}

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
  className,
  onCopy,
}: {
  text: string;
  highlight: string;
  wrap: boolean;
  className?: string;
  onCopy: () => void;
}) {
  const contentClassName = wrap ? className : className;

  if (!highlight) {
    return (
      <span onDoubleClick={onCopy} title="Double-click to copy" className={contentClassName}>
        <AnsiText text={text} className={contentClassName} />
      </span>
    );
  }

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
    <span onDoubleClick={onCopy} title="Double-click to copy" className={contentClassName}>
      {parts.map((p, i) =>
        p.highlight
          ? <mark key={i} className="bg-yellow-300 text-gray-900">{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </span>
  );
}
