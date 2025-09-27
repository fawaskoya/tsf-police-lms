import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { handleApiError, validateInput, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const submitExamSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.array(z.string())]),
    timeSpent: z.number(),
  })),
  autoSubmit: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    logger.info('Exam submit API request initiated', {
      url: request.url,
      method: request.method,
      examId: params.examId,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if user can take exams (must be TRAINEE role)
    if (session.user.role !== 'TRAINEE') {
      throw new AuthorizationError('Only trainees can submit exams');
    }

    const body = await request.json();
    const { answers, autoSubmit } = validateInput(submitExamSchema, body, {
      endpoint: `/api/exams/${params.examId}/submit`,
      method: 'POST',
    });

    logger.debug('Submitting exam with answers', {
      examId: params.examId,
      userId: session.user.id,
      answersCount: answers.length,
      autoSubmit,
    });

    // Check if exam exists and is published
    const exam = await db.exam.findUnique({
      where: { id: params.examId },
      include: {
        questions: true,
        attempts: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!exam) {
      throw new NotFoundError('Exam not found', { examId: params.examId });
    }

    if (!exam.isPublished) {
      throw new ValidationError('Exam is not published yet');
    }

    // Check if user has already attempted this exam (prevent multiple submissions)
    if (exam.attempts.length > 0 && !autoSubmit) {
      // Allow multiple attempts for practice, but log it
      logger.warn('User attempting exam multiple times', {
        examId: params.examId,
        userId: session.user.id,
        previousAttempts: exam.attempts.length,
      });
    }

    let totalScore = 0;
    let maxScore = exam.questions.reduce((sum, q) => sum + q.marks, 0);

    // Calculate score
    const gradedAnswers = answers.map((answer) => {
      const question = exam.questions.find(q => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false, marks: 0 };

      let isCorrect = false;
      let marks = 0;

      if ((question.type as string) === 'MULTIPLE_CHOICE' || (question.type as string) === 'TRUE_FALSE') {
        isCorrect = answer.answer === (question as any).answer;
        marks = isCorrect ? question.marks : (exam.negativeMarking ? -question.marks * 0.25 : 0);
      } else if ((question.type as string) === 'SHORT_ANSWER') {
        // For short answer, we'll need manual grading or simple text matching
        // For now, mark as needs grading
        isCorrect = false;
        marks = 0;
      }

      if (isCorrect) totalScore += marks;

      return {
        ...answer,
        isCorrect,
        marks,
        question,
      };
    });

    // Create exam attempt record
    const attempt = await db.attempt.create({
      data: {
        examId: params.examId,
        userId: session.user.id,
        submittedAt: new Date(),
        score: totalScore,
        detail: {
          answers: gradedAnswers,
          totalScore,
          maxScore,
          percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
          timeSpent: answers.reduce((sum, a) => sum + a.timeSpent, 0),
          autoSubmitted: autoSubmit,
        },
      },
    });

    // Check if user passed and should get certificate
    const passPercentage = 60; // 60% to pass
    const attemptDetail = attempt.detail as any;
    const percentage = attemptDetail?.percentage || 0;
    const passed = percentage >= passPercentage;

    if (passed) {
      // Create certificate for passing the exam
      // Check if certificate already exists for this user and course
      const existingCertificate = await db.certificate.findFirst({
        where: {
          userId: session.user.id,
          courseId: exam.courseId,
        },
      });

      if (!existingCertificate) {
        // Create certificate
        await db.certificate.create({
          data: {
            userId: session.user.id,
            courseId: exam.courseId,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            qrCode: `QR-${Date.now()}`,
            serial: `CERT-${Date.now()}-${session.user.id.slice(-6)}`,
          },
        });

        logger.info('Certificate issued for exam completion', {
          examId: exam.id,
          userId: session.user.id,
          certificateIssued: true,
        });
      }
    }

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'SUBMIT',
      entity: 'Exam',
      entityId: params.examId,
      metadata: {
        score: totalScore,
        maxScore,
        percentage,
        passed,
        autoSubmit,
        answersCount: answers.length,
      },
    });

    logger.info('Exam submitted successfully', {
      examId: params.examId,
      userId: session.user.id,
      score: totalScore,
      maxScore,
      percentage,
      passed,
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        maxScore,
        percentage,
        passed,
        timeSpent: attemptDetail?.timeSpent || 0,
        submittedAt: attempt.submittedAt,
      },
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/exams/${params.examId}/submit`,
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
