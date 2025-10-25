// Enhanced logging utility with structured logging
export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(level: string, message: string, context?: any) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || {},
      service: 'invoice-tracker-backend',
    };
  }

  info(message: string, context?: any) {
    const logEntry = this.formatLogEntry('INFO', message, context);
    console.log(JSON.stringify(logEntry));
  }

  warn(message: string, context?: any) {
    const logEntry = this.formatLogEntry('WARN', message, context);
    console.warn(JSON.stringify(logEntry));
  }

  error(message: string, context?: any) {
    const logEntry = this.formatLogEntry('ERROR', message, context);
    console.error(JSON.stringify(logEntry));
  }

  debug(message: string, context?: any) {
    const logEntry = this.formatLogEntry('DEBUG', message, context);
    console.debug(JSON.stringify(logEntry));
  }

  // Performance monitoring
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const logger = this;

    try {
      logger.info(`Starting ${operation}`);
      const result = await fn();
      const duration = Date.now() - startTime;

      logger.info(`Completed ${operation}`, {
        duration,
        status: 'success',
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`Failed ${operation}`, {
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}

// Performance metrics tracking
interface PerformanceMetric {
  operation: string;
  duration: number;
  status: 'success' | 'error';
  timestamp: number;
  errorType?: string;
  context?: any;
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics

  private constructor() {}

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only the last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter((m) => m.operation === operation);
    }
    return [...this.metrics];
  }

  getAveragePerformance(operation: string): {
    averageDuration: number;
    successRate: number;
    totalOperations: number;
  } {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        totalOperations: 0,
      };
    }

    const totalDuration = operationMetrics.reduce(
      (sum, m) => sum + m.duration,
      0
    );
    const successCount = operationMetrics.filter(
      (m) => m.status === 'success'
    ).length;

    return {
      averageDuration: totalDuration / operationMetrics.length,
      successRate: successCount / operationMetrics.length,
      totalOperations: operationMetrics.length,
    };
  }
}

export const logger = Logger.getInstance();
export const performanceTracker = PerformanceTracker.getInstance();
