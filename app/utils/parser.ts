import * as pako from 'pako';
import { TSVLogEntry, JSONLogEntry, LogEntry } from '../types/log';

// Parse gzip file and return the decompressed content
export async function parseGzipFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  try {
    const decompressed = pako.inflate(uint8Array, { to: 'string' });
    return decompressed;
  } catch (error) {
    throw new Error('Failed to decompress gzip file');
  }
}

// Parse TSV content into log entries
export function parseTSVContent(content: string): LogEntry[] {
  const lines = content.trim().split('\n');
  const entries: LogEntry[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const columns = line.split('\t');
    if (columns.length < 10) continue;
    
    const tsvEntry: TSVLogEntry = {
      event_id: columns[0],
      timestamp1: columns[1],
      timestamp2: columns[2],
      token: columns[3],
      app_name: columns[4],
      ip: columns[5],
      facility: columns[6],
      severity: columns[7],
      process: columns[8],
      message: columns[9]
    };
    
    const logEntry: LogEntry = {
      id: tsvEntry.event_id,
      timestamp: tsvEntry.timestamp1,
      app_name: tsvEntry.app_name,
      source: tsvEntry.process,
      severity: tsvEntry.severity,
      message: tsvEntry.message,
      raw: tsvEntry
    };
    
    entries.push(logEntry);
  }
  
  return entries;
}

// Parse JSON content into log entries
export function parseJSONContent(content: string): LogEntry[] {
  const lines = content.trim().split('\n');
  const entries: LogEntry[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const jsonEntry: JSONLogEntry = JSON.parse(line);
      
      const logEntry: LogEntry = {
        id: jsonEntry.event_id,
        timestamp: jsonEntry.receive_time,
        app_name: jsonEntry.syslog_host,
        source: jsonEntry.syslog_appname,
        severity: jsonEntry.syslog?.severity || 'Info',
        message: jsonEntry.logmsg,
        raw: jsonEntry
      };
      
      entries.push(logEntry);
    } catch (error) {
      console.warn('Failed to parse JSON line:', line);
    }
  }
  
  return entries;
}

// Detect file format and parse accordingly
export async function parseLogFile(file: File): Promise<LogEntry[]> {
  let content: string;
  
  if (file.name.endsWith('.gz')) {
    content = await parseGzipFile(file);
  } else {
    content = await file.text();
  }
  
  // Try to detect format by checking the first non-empty line
  const firstLine = content.trim().split('\n')[0];
  
  if (firstLine.startsWith('{')) {
    // JSON format
    return parseJSONContent(content);
  } else {
    // Assume TSV format
    return parseTSVContent(content);
  }
}

// Filter logs by text search
export function filterLogsByText(logs: LogEntry[], searchText: string): LogEntry[] {
  if (!searchText.trim()) return logs;
  
  const searchLower = searchText.toLowerCase();
  return logs.filter(log => 
    log.message.toLowerCase().includes(searchLower) ||
    log.app_name.toLowerCase().includes(searchLower) ||
    log.source.toLowerCase().includes(searchLower) ||
    log.severity.toLowerCase().includes(searchLower)
  );
}

// Filter logs by time range
export function filterLogsByTimeRange(
  logs: LogEntry[], 
  startTime?: string, 
  endTime?: string
): LogEntry[] {
  if (!startTime && !endTime) return logs;
  
  return logs.filter(log => {
    const logTime = new Date(log.timestamp);
    
    if (startTime && logTime < new Date(startTime)) {
      return false;
    }
    
    if (endTime && logTime > new Date(endTime)) {
      return false;
    }
    
    return true;
  });
}