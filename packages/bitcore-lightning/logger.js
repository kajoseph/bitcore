import fs from 'fs';
import { log as config } from './config.js';

// Bitwise log levels
const LOG_LEVEL = {
  error: 0,
  warn: 1,
  info: 3,
  debug: 7
}

class Logger {
  level = LOG_LEVEL[config.level || 'info'];

  constructor() {
    // We need to make sure the dir for the log file exists.
    let dir = config.file.split('/');
    dir = dir.slice(0, -1); // remove the file from the dir
    dir = dir.join('/');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
  }

  _baseLog(level, message, data) {
    if (this.level & LOG_LEVEL[level] !== LOG_LEVEL[level]) {
      return;
    }

    let fullMessage = `[${new Date().toISOString()}] ${level.toUpperCase()} :: ${message}`;
    
    if (data instanceof Error) {
      data = data.stack;
    }

    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }

    if (data) {
      fullMessage += ' :: ' + data;
    }

    console[level](fullMessage);
    fs.appendFileSync(config.file, fullMessage + '\n', { });
  }

  info(message, data) {
    this._baseLog('info', message, data);
  }

  debug(message, data) {
    if (config.level === 'debug') {
      this._baseLog('debug', message, data);
    }
  }

  warn(message, data) {
    this._baseLog('warn', message, data);
  }

  error(message, data) {
    this._baseLog('error', message, data);
  }
}

export let logger = new Logger();
export default logger;