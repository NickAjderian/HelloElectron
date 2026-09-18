import { appendFileSync, mkdirSync } from 'fs';
import os from 'os';
import path from 'path';

const logDirectory = path.join(
  process.env.APPDATA || os.tmpdir(),
  'HelloElectron',
  'logs'
);
const logFile = path.join(logDirectory, 'main.log');

export function log(level, message, details) {
  const timestamp = new Date().toISOString();
  const detailText = details === undefined
    ? ''
    : ` ${details instanceof Error ? details.stack || details.message : JSON.stringify(details)}`;
  const line = `[${timestamp}] [${level}] ${message}${detailText}\n`;

  try {
    mkdirSync(logDirectory, { recursive: true });
    appendFileSync(logFile, line, 'utf8');
  } catch (writeError) {
    console.error('Unable to write application log:', writeError);
  }

  if (level === 'ERROR') {
    console.error(message, details);
  } else {
    console.log(message, details ?? '');
  }
}

export function getLogFile() {
  return logFile;
}