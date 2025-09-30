import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

interface ErrorLogData {
  errorId?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  errorInfo?: any;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  context?: any;
}

export async function POST(request: NextRequest) {
  try {
    const errorData: ErrorLogData = await request.json();
    
    // Validate required fields
    if (!errorData.message || !errorData.timestamp || !errorData.url) {
      return NextResponse.json(
        { error: 'Missing required error data fields' },
        { status: 400 }
      );
    }

    // Log the error with structured format
    console.error('🚨 CLIENT ERROR LOGGED:', {
      errorId: errorData.errorId || `client_${Date.now()}`,
      message: errorData.message,
      stack: errorData.stack?.split('\n').slice(0, 10).join('\n'), // First 10 lines
      componentStack: errorData.componentStack?.split('\n').slice(0, 5).join('\n'), // First 5 lines
      url: errorData.url,
      userAgent: errorData.userAgent,
      userId: errorData.userId || 'anonymous',
      timestamp: errorData.timestamp,
      context: errorData.context,
    });

    // In production, you would typically:
    // 1. Send to external error tracking service (Sentry, LogRocket, etc.)
    // 2. Store in database for analysis
    // 3. Send alerts for critical errors

    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external service
      // await sendToErrorTrackingService(errorData);
      
      // Example: Store in database
      // await storeErrorInDatabase(errorData);
      
      // Example: Send alert for critical errors
      // if (isCriticalError(errorData.message)) {
      //   await sendAlert(errorData);
      // }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      errorId: errorData.errorId || `client_${Date.now()}`,
      message: 'Error logged successfully',
    });

  } catch (error) {
    console.error('🚨 Error in error logging endpoint:', error);
    
    const { error: errorResponse } = handleApiError(error, {
      endpoint: '/api/errors',
      method: 'POST',
    });

    return errorResponse;
  }
}

// Helper function to determine if an error is critical
function isCriticalError(message: string): boolean {
  const criticalPatterns = [
    /database/i,
    /connection/i,
    /authentication/i,
    /authorization/i,
    /payment/i,
    /security/i,
  ];

  return criticalPatterns.some(pattern => pattern.test(message));
}

// Helper function to send to external error tracking service
async function sendToErrorTrackingService(errorData: ErrorLogData) {
  // Example implementation for Sentry
  try {
    // This would be your actual Sentry integration
    console.log('📤 Would send to Sentry:', {
      message: errorData.message,
      level: 'error',
      tags: {
        component: 'client',
        errorId: errorData.errorId,
      },
      extra: {
        stack: errorData.stack,
        componentStack: errorData.componentStack,
        url: errorData.url,
        userAgent: errorData.userAgent,
        userId: errorData.userId,
      },
    });
  } catch (error) {
    console.error('Failed to send to error tracking service:', error);
  }
}

// Helper function to store error in database
async function storeErrorInDatabase(errorData: ErrorLogData) {
  try {
    // This would be your actual database storage
    console.log('💾 Would store in database:', {
      errorId: errorData.errorId,
      message: errorData.message,
      url: errorData.url,
      userId: errorData.userId,
      timestamp: errorData.timestamp,
    });
  } catch (error) {
    console.error('Failed to store error in database:', error);
  }
}

// Helper function to send alerts
async function sendAlert(errorData: ErrorLogData) {
  try {
    // This would be your actual alert system (email, Slack, etc.)
    console.log('🚨 Would send alert:', {
      subject: 'Critical Error in TSF Police LMS',
      message: `Critical error occurred: ${errorData.message}`,
      errorId: errorData.errorId,
      url: errorData.url,
      timestamp: errorData.timestamp,
    });
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}
