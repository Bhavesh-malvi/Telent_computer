import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
    this.cache = new Map(); // Add caching
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getLogFileName(type) {
    const today = new Date().toISOString().split('T')[0];
    return `${type}_${today}.log`;
  }

  log(type, data) {
    try {
      const logFile = path.join(this.logsDir, this.getLogFileName(type));
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        ...data
      };

      // Append to log file
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📝 [${type.toUpperCase()}] Log saved:`, logEntry);
      }
    } catch (error) {
      console.error('Failed to save log:', error.message);
    }
  }

  // Log birthday wishes
  logBirthdayWishes(data) {
    this.log('birthday_wishes', data);
  }

  // Log fee reminders
  logFeeReminders(data) {
    this.log('fee_reminders', data);
  }

  // Get logs for a specific type and date
  getLogs(type, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logsDir, `${type}_${targetDate}.log`);
      
      if (!fs.existsSync(logFile)) {
        return [];
      }

      const content = fs.readFileSync(logFile, 'utf8');
      return content.trim().split('\n').map(line => JSON.parse(line));
    } catch (error) {
      console.error('Failed to read logs:', error.message);
      return [];
    }
  }

  // Get today's summary with caching
  getTodaySummary() {
    const cacheKey = 'today_summary';
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const birthdayLogs = this.getLogs('birthday_wishes', today);
    const feeLogs = this.getLogs('fee_reminders', today);

    const summary = {
      date: today,
      birthday_wishes: birthdayLogs.length > 0 ? birthdayLogs[birthdayLogs.length - 1] : null,
      fee_reminders: feeLogs.length > 0 ? feeLogs[feeLogs.length - 1] : null
    };
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: summary,
      timestamp: Date.now()
    });
    
    return summary;
  }

  // Get weekly summary
  getWeeklySummary() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const summary = {
      period: `${weekAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`,
      birthday_wishes: {
        total_runs: 0,
        total_successful: 0,
        total_failed: 0,
        average_success_rate: 0
      },
      fee_reminders: {
        total_runs: 0,
        total_successful: 0,
        total_failed: 0,
        average_success_rate: 0
      }
    };

    // Calculate for each day
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const birthdayLogs = this.getLogs('birthday_wishes', dateStr);
      const feeLogs = this.getLogs('fee_reminders', dateStr);

      if (birthdayLogs.length > 0) {
        const lastLog = birthdayLogs[birthdayLogs.length - 1];
        summary.birthday_wishes.total_runs++;
        summary.birthday_wishes.total_successful += lastLog.successful || 0;
        summary.birthday_wishes.total_failed += lastLog.failed || 0;
      }

      if (feeLogs.length > 0) {
        const lastLog = feeLogs[feeLogs.length - 1];
        summary.fee_reminders.total_runs++;
        summary.fee_reminders.total_successful += lastLog.successful || 0;
        summary.fee_reminders.total_failed += lastLog.failed || 0;
      }
    }

    // Calculate averages
    if (summary.birthday_wishes.total_runs > 0) {
      const total = summary.birthday_wishes.total_successful + summary.birthday_wishes.total_failed;
      summary.birthday_wishes.average_success_rate = total > 0 ? 
        Math.round((summary.birthday_wishes.total_successful / total) * 100) : 0;
    }

    if (summary.fee_reminders.total_runs > 0) {
      const total = summary.fee_reminders.total_successful + summary.fee_reminders.total_failed;
      summary.fee_reminders.average_success_rate = total > 0 ? 
        Math.round((summary.fee_reminders.total_successful / total) * 100) : 0;
    }

    return summary;
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
