#!/usr/bin/env node

/**
 * Error Monitoring and Reporting Script
 * Monitors logs, aggregates errors, and generates reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const LOG_DIR = path.join(__dirname, '..', 'logs');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');
const COMBINED_LOG_FILE = path.join(LOG_DIR, 'combined.log');
const REPORT_DIR = path.join(__dirname, '..', 'reports');

class ErrorMonitor {
  constructor() {
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
  }

  /**
   * Analyze error logs and generate reports
   */
  analyzeErrors() {
    console.log('🔍 Analyzing error logs...');

    try {
      const errorLogs = this.readLogFile(ERROR_LOG_FILE);
      const combinedLogs = this.readLogFile(COMBINED_LOG_FILE);

      const analysis = {
        timestamp: new Date().toISOString(),
        summary: this.generateSummary(errorLogs, combinedLogs),
        topErrors: this.getTopErrors(errorLogs),
        errorTrends: this.analyzeErrorTrends(errorLogs),
        systemHealth: this.checkSystemHealth(combinedLogs),
      };

      this.saveReport('error-analysis.json', analysis);
      this.printSummary(analysis);

      return analysis;
    } catch (error) {
      console.error('❌ Error during analysis:', error.message);
      return null;
    }
  }

  /**
   * Monitor application health in real-time
   */
  monitorHealth(interval = 30000) {
    console.log('🏥 Starting health monitoring...');

    setInterval(() => {
      const health = this.checkSystemHealth(this.readLogFile(COMBINED_LOG_FILE));

      if (health.status === 'critical') {
        console.log('🚨 CRITICAL: System health is critical!');
        this.sendAlert('System health critical', health);
      } else if (health.status === 'warning') {
        console.log('⚠️  WARNING: System health issues detected');
      } else {
        console.log('✅ System health OK');
      }
    }, interval);
  }

  /**
   * Clean old log files
   */
  cleanupLogs(daysOld = 30) {
    console.log(`🧹 Cleaning logs older than ${daysOld} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const files = fs.readdirSync(LOG_DIR);
      let cleanedCount = 0;

      files.forEach(file => {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          cleanedCount++;
          console.log(`  Deleted: ${file}`);
        }
      });

      console.log(`✅ Cleaned ${cleanedCount} old log files`);
    } catch (error) {
      console.error('❌ Error cleaning logs:', error.message);
    }
  }

  /**
   * Generate error summary report
   */
  generateSummary(errorLogs, combinedLogs) {
    const errorCount = errorLogs.length;
    const totalRequests = combinedLogs.filter(log => log.level === 'info').length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      totalErrors: errorCount,
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      period: 'last 24 hours',
    };
  }

  /**
   * Get top occurring errors
   */
  getTopErrors(errorLogs) {
    const errorCounts = {};

    errorLogs.forEach(log => {
      const key = `${log.message || 'Unknown error'}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }

  /**
   * Analyze error trends over time
   */
  analyzeErrorTrends(errorLogs) {
    const hourlyStats = {};

    errorLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    return Object.entries(hourlyStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
  }

  /**
   * Check overall system health
   */
  checkSystemHealth(logs) {
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return logTime > oneHourAgo;
    });

    const errorCount = recentLogs.filter(log => log.level === 'error').length;
    const warningCount = recentLogs.filter(log => log.level === 'warn').length;
    const totalRequests = recentLogs.length;

    let status = 'healthy';
    let score = 100;

    if (errorCount > 10 || (errorCount / totalRequests) > 0.1) {
      status = 'critical';
      score = 20;
    } else if (errorCount > 5 || (errorCount / totalRequests) > 0.05) {
      status = 'warning';
      score = 60;
    } else if (warningCount > 20) {
      status = 'warning';
      score = 80;
    }

    return {
      status,
      score,
      errorCount,
      warningCount,
      totalRequests,
      errorRate: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 100) : 0,
    };
  }

  /**
   * Send alert notifications
   */
  sendAlert(title, data) {
    // In production, integrate with email/SMS/push notifications
    console.log(`🚨 ALERT: ${title}`);
    console.log(JSON.stringify(data, null, 2));

    // Example: Send to Slack, email, etc.
    // this.sendToSlack(title, data);
    // this.sendEmail(title, data);
  }

  /**
   * Read and parse log file
   */
  readLogFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            // Handle non-JSON log lines
            return {
              level: 'unknown',
              message: line,
              timestamp: new Date().toISOString(),
            };
          }
        });
    } catch (error) {
      console.error(`Error reading log file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Save report to file
   */
  saveReport(filename, data) {
    const reportPath = path.join(REPORT_DIR, filename);
    fs.writeFileSync(reportPath, JSON.stringify(data, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);
  }

  /**
   * Print summary to console
   */
  printSummary(analysis) {
    console.log('\n📊 Error Analysis Summary');
    console.log('='.repeat(50));
    console.log(`Total Errors: ${analysis.summary.totalErrors}`);
    console.log(`Total Requests: ${analysis.summary.totalRequests}`);
    console.log(`Error Rate: ${analysis.summary.errorRate}%`);
    console.log(`System Health: ${analysis.systemHealth.status.toUpperCase()} (${analysis.systemHealth.score}/100)`);

    if (analysis.topErrors.length > 0) {
      console.log('\n🔥 Top Errors:');
      analysis.topErrors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.error} (${error.count} times)`);
      });
    }

    console.log('\n✅ Analysis complete');
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  const monitor = new ErrorMonitor();

  switch (command) {
    case 'analyze':
      monitor.analyzeErrors();
      break;

    case 'monitor':
      const interval = parseInt(args[1]) || 30000;
      monitor.monitorHealth(interval);
      break;

    case 'cleanup':
      const days = parseInt(args[1]) || 30;
      monitor.cleanupLogs(days);
      break;

    case 'health':
      const logs = monitor.readLogFile(COMBINED_LOG_FILE);
      const health = monitor.checkSystemHealth(logs);
      console.log('🏥 System Health Check');
      console.log('='.repeat(30));
      console.log(`Status: ${health.status.toUpperCase()}`);
      console.log(`Score: ${health.score}/100`);
      console.log(`Errors: ${health.errorCount}`);
      console.log(`Warnings: ${health.warningCount}`);
      console.log(`Requests: ${health.totalRequests}`);
      console.log(`Error Rate: ${health.errorRate}%`);
      break;

    default:
      console.log('Usage: node error-monitor.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  analyze    - Analyze error logs and generate report');
      console.log('  monitor    - Monitor system health in real-time');
      console.log('  health     - Check current system health');
      console.log('  cleanup    - Clean old log files (default: 30 days)');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = ErrorMonitor;
