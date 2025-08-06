// Types for Solarwinds/Papertrail log entries

export interface TSVLogEntry {
  event_id: string;
  timestamp1: string;
  timestamp2: string;
  token: string;
  app_name: string;
  ip: string;
  facility: string;
  severity: string;
  process: string;
  message: string;
}

export interface JSONLogEntry {
  receive_time: string;
  event_id: string;
  'sw.token.signature': string;
  syslog_host: string;
  sender_ip_str: string;
  'sw.remote.ip': string;
  syslog_appname: string;
  loghdr: string;
  logmsg: string;
  'sw.log_destination.id': number;
  syslog: {
    priority: string;
    timestampMillis: number;
    timestamp: string;
    host: string;
    appName: string;
    procId: string;
    severity: string;
    facility: string;
  };
  syslog_message: string;
  'swi.papertrail.original_destination': string;
  heroku?: {
    source: string;
    dyno: string;
  };
  syslog_priority: number;
  sender_ip: number;
  time: number;
  source_name: string;
}

// Unified log entry for display
export interface LogEntry {
  id: string;
  timestamp: string;
  app_name: string;
  source: string;
  severity: string;
  message: string;
  raw: TSVLogEntry | JSONLogEntry;
}

export type FileFormat = 'tsv' | 'json' | 'gzip';