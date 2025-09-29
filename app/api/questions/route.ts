import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { QuestionType } from '@prisma/client';

const createQuestionSchema = z.object({
  examId: z.string(),
  type: z.enum(['MCQ', 'MSQ', 'TRUEFALSE', 'NUMERIC', 'SHORT']),
  stemAr: z.string().min(1),
  stemEn: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.any(),
  marks: z.number().min(1),
  bankTag: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'exams:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const questions = await db.question.findMany({
      include: {
        exam: {
          select: {
            titleAr: true,
            titleEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'exams:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createQuestionSchema.parse(body);

    // Check if exam exists
    const exam = await db.exam.findUnique({
      where: { id: validatedData.examId },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Validate answer based on question type
    let processedAnswer = validatedData.answer;

    if (validatedData.type === 'MCQ' || validatedData.type === 'MSQ') {
      if (!validatedData.options || validatedData.options.length < 2) {
        return NextResponse.json(
          { error: 'MCQ/MSQ questions must have at least 2 options' },
          { status: 400 }
        );
      }
      processedAnswer = JSON.stringify(validatedData.answer);
    } else if (validatedData.type === 'TRUEFALSE') {
      processedAnswer = JSON.stringify(validatedData.answer);
    } else if (validatedData.type === 'NUMERIC') {
      processedAnswer = JSON.stringify(validatedData.answer);
    } else if (validatedData.type === 'SHORT') {
      processedAnswer = JSON.stringify(validatedData.answer);
    }

    const question = await db.question.create({
      data: {
        ...validatedData,
        options: validatedData.options ? JSON.stringify(validatedData.options) : undefined,
        answer: processedAnswer,
      },
      include: {
        exam: {
          select: {
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'CREATE',
      entity: 'Question',
      entityId: question.id,
      metadata: { type: validatedData.type, examId: validatedData.examId },
    });

    return NextResponse.json({ question });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
