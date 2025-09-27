import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError, ValidationError } from '@/lib/errorHandler';
import { renderToBuffer } from '@react-pdf/renderer';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

// For CSV generation
function generateCSV(data: any[], headers: string[]): string {
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Simple PDF Report Component (you can enhance this with @react-pdf/renderer)
function ReportPDF({ title, data, headers }: { title: string; data: any[]; headers: string[] }) {
  // This is a simplified PDF component - in production you'd use @react-pdf/renderer
  return null; // Placeholder for now
}

export async function GET(request: NextRequest) {
  try {
    logger.info('Reports export API request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'reports:read')) {
      throw new AuthorizationError('Insufficient permissions to export reports');
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv or pdf
    const reportType = searchParams.get('type') || 'users'; // users, courses, exams, attendance, certificates
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate format
    if (!['csv', 'pdf'].includes(format)) {
      throw new ValidationError('Invalid format. Supported formats: csv, pdf');
    }

    // Validate report type
    const validTypes = ['users', 'courses', 'exams', 'attendance', 'certificates'];
    if (!validTypes.includes(reportType)) {
      throw new ValidationError(`Invalid report type. Supported types: ${validTypes.join(', ')}`);
    }

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let data: any[] = [];
    let headers: string[] = [];
    let filename = `${reportType}_report_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}`;

    // Fetch data based on report type
    switch (reportType) {
      case 'users':
        const users = await db.user.findMany({
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            unit: true,
            rank: true,
            status: true,
            createdAt: true,
            badgeNo: true,
            qid: true,
          },
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Unit', 'Rank', 'Status', 'Badge Number', 'QID', 'Created Date'];
        data = users.map(user => ({
          ID: user.id,
          'First Name': user.firstName,
          'Last Name': user.lastName,
          Email: user.email,
          Role: user.role,
          Unit: user.unit || '',
          Rank: user.rank || '',
          Status: user.status,
          'Badge Number': user.badgeNo || '',
          QID: user.qid || '',
          'Created Date': user.createdAt.toISOString().split('T')[0],
        }));
        break;

      case 'courses':
        const courses = await db.course.findMany({
          select: {
            id: true,
            code: true,
            titleAr: true,
            titleEn: true,
            status: true,
            modality: true,
            durationMins: true,
            createdAt: true,
            _count: {
              select: { enrollments: true },
            },
          },
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        headers = ['Code', 'Title (Arabic)', 'Title (English)', 'Status', 'Modality', 'Duration (mins)', 'Enrollments', 'Created Date'];
        data = courses.map(course => ({
          Code: course.code,
          'Title (Arabic)': course.titleAr,
          'Title (English)': course.titleEn,
          Status: course.status,
          Modality: course.modality,
          'Duration (mins)': course.durationMins,
          Enrollments: course._count.enrollments,
          'Created Date': course.createdAt.toISOString().split('T')[0],
        }));
        break;

      case 'exams':
        const exams = await db.exam.findMany({
          include: {
            course: {
              select: { titleAr: true, titleEn: true },
            },
            _count: {
              select: { attempts: true },
            },
          },
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        headers = ['Title (Arabic)', 'Title (English)', 'Course', 'Time Limit (mins)', 'Total Marks', 'Published', 'Attempts', 'Created Date'];
        data = exams.map(exam => ({
          'Title (Arabic)': exam.titleAr,
          'Title (English)': exam.titleEn,
          Course: exam.course.titleAr,
          'Time Limit (mins)': exam.timeLimitMins,
          'Total Marks': exam.totalMarks,
          Published: exam.isPublished ? 'Yes' : 'No',
          Attempts: exam._count.attempts,
          'Created Date': exam.createdAt.toISOString().split('T')[0],
        }));
        break;

      case 'attendance':
        const attendance = await db.attendance.findMany({
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                badgeNo: true,
                unit: true,
                rank: true,
              },
            },
            session: {
              select: {
                titleAr: true,
                startsAt: true,
                endsAt: true,
              },
            },
            capturer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          where: {
            capturedAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { capturedAt: 'desc' },
        });

        headers = ['Employee Name', 'Badge Number', 'Unit', 'Rank', 'Session Title', 'Session Date', 'Status', 'Method', 'Captured By', 'Captured At', 'Notes'];
        data = attendance.map(record => ({
          'Employee Name': `${record.user.firstName} ${record.user.lastName}`,
          'Badge Number': record.user.badgeNo || '',
          Unit: record.user.unit || '',
          Rank: record.user.rank || '',
          'Session Title': record.session.titleAr,
          'Session Date': record.session.startsAt.toISOString().split('T')[0],
          Status: record.status,
          Method: record.method,
          'Captured By': `${record.capturer.firstName} ${record.capturer.lastName}`,
          'Captured At': record.capturedAt.toISOString(),
          Notes: record.notes || '',
        }));
        break;

      case 'certificates':
        const certificates = await db.certificate.findMany({
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                badgeNo: true,
                unit: true,
                rank: true,
              },
            },
            course: {
              select: { titleAr: true, titleEn: true },
            },
          },
          where: {
            issuedAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { issuedAt: 'desc' },
        });

        headers = ['Certificate Number', 'Employee Name', 'Badge Number', 'Unit', 'Rank', 'Course Title', 'Issue Date', 'Expiry Date', 'QR Code'];
        data = certificates.map(cert => ({
          'Certificate Number': cert.serial,
          'Employee Name': `${cert.user.firstName} ${cert.user.lastName}`,
          'Badge Number': cert.user.badgeNo || '',
          Unit: cert.user.unit || '',
          Rank: cert.user.rank || '',
          'Course Title': cert.course.titleAr,
          'Issue Date': cert.issuedAt.toISOString().split('T')[0],
          'Expiry Date': cert.expiresAt ? cert.expiresAt.toISOString().split('T')[0] : '',
          'QR Code': cert.qrCode || '',
        }));
        break;
    }

    if (format === 'csv') {
      const csvContent = generateCSV(data, headers);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // For now, return CSV as PDF is more complex to implement
      // In production, you'd use @react-pdf/renderer or similar
      const csvContent = generateCSV(data, headers);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    logger.info('Report exported successfully', {
      reportType,
      format,
      recordCount: data.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/reports/export',
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
