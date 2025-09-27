import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError, AuthorizationError, NotFoundError } from '@/lib/errorHandler';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    logger.info('Exam results API request initiated', {
      url: request.url,
      method: request.method,
      examId: params.examId,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Users can only see their own results
    const attempt = await db.attempt.findFirst({
      where: {
        examId: params.examId,
        userId: session.user.id,
      },
      include: {
        exam: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            timeLimitMins: true,
            totalMarks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!attempt) {
      throw new NotFoundError('Exam attempt not found', {
        examId: params.examId,
        userId: session.user.id,
      });
    }

    // Parse the detail JSON field for answers and results
    const detail = attempt.detail as any;
    const answers = detail?.answers || [];
    const maxScore = detail?.maxScore || attempt.exam.totalMarks;
    const percentage = detail?.percentage || (attempt.score ? (attempt.score / maxScore) * 100 : 0);
    const timeSpent = detail?.timeSpent || 0;

    logger.info('Exam results fetched successfully', {
      examId: params.examId,
      userId: session.user.id,
      attemptId: attempt.id,
      score: attempt.score,
      percentage,
    });

    return NextResponse.json({
      exam: attempt.exam,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        maxScore,
        percentage,
        timeSpent,
        createdAt: attempt.createdAt,
        answers: answers,
      },
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/exams/${params.examId}/results`,
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
