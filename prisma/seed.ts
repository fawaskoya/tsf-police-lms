import { PrismaClient, UserRole, UserStatus, CourseStatus, CourseModality, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create super admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@kbn.local' },
    update: {},
    create: {
      qid: '10000000001',
      badgeNo: 'SA001',
      rank: 'Colonel',
      unit: 'Command',
      firstName: 'أحمد',
      lastName: 'الكبير',
      email: 'super@kbn.local',
      password: await bcrypt.hash('Passw0rd!', 12),
      role: UserRole.SUPER_ADMIN,
      locale: 'ar',
      status: UserStatus.ACTIVE,
    },
  });

  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kbn.local' },
    update: {},
    create: {
      qid: '10000000002',
      badgeNo: 'AD001',
      rank: 'Major',
      unit: 'Training',
      firstName: 'محمد',
      lastName: 'العبدالله',
      email: 'admin@kbn.local',
      password: await bcrypt.hash('Passw0rd!', 12),
      role: UserRole.ADMIN,
      locale: 'ar',
      status: UserStatus.ACTIVE,
    },
  });

  // Create instructor
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@kbn.local' },
    update: {},
    create: {
      qid: '10000000003',
      badgeNo: 'IN001',
      rank: 'Captain',
      unit: 'Academy',
      firstName: 'فاطمة',
      lastName: 'السعد',
      email: 'instructor@kbn.local',
      password: await bcrypt.hash('Passw0rd!', 12),
      role: UserRole.INSTRUCTOR,
      locale: 'ar',
      status: UserStatus.ACTIVE,
    },
  });

  // Create commander
  const commander = await prisma.user.upsert({
    where: { email: 'commander@kbn.local' },
    update: {},
    create: {
      qid: '10000000004',
      badgeNo: 'CM001',
      rank: 'Lieutenant Colonel',
      unit: 'Operations',
      firstName: 'خالد',
      lastName: 'المنصوري',
      email: 'commander@kbn.local',
      password: await bcrypt.hash('Passw0rd!', 12),
      role: UserRole.COMMANDER,
      locale: 'ar',
      status: UserStatus.ACTIVE,
    },
  });

  // Create trainees
  const trainees = [];
  const traineeData = [
    { qid: '20000000001', badgeNo: 'TR001', rank: 'Sergeant', unit: 'Patrol', firstName: 'سارة', lastName: 'الأحمد', email: 'trainee@kbn.local' },
    { qid: '20000000002', badgeNo: 'TR002', rank: 'Corporal', unit: 'Traffic', firstName: 'محمد', lastName: 'العلي', email: 'trainee2@kbn.local' },
    { qid: '20000000003', badgeNo: 'TR003', rank: 'Sergeant', unit: 'Criminal', firstName: 'نور', lastName: 'الموسى', email: 'trainee3@kbn.local' },
    { qid: '20000000004', badgeNo: 'TR004', rank: 'Officer', unit: 'Patrol', firstName: 'أحمد', lastName: 'الخالدي', email: 'trainee4@kbn.local' },
    { qid: '20000000005', badgeNo: 'TR005', rank: 'Sergeant', unit: 'Traffic', firstName: 'مريم', lastName: 'الغانم', email: 'trainee5@kbn.local' },
    { qid: '20000000006', badgeNo: 'TR006', rank: 'Corporal', unit: 'Patrol', firstName: 'عبدالله', lastName: 'الشمري', email: 'trainee6@kbn.local' },
    { qid: '20000000007', badgeNo: 'TR007', rank: 'Sergeant', unit: 'Criminal', firstName: 'هند', lastName: 'البوعينين', email: 'trainee7@kbn.local' },
    { qid: '20000000008', badgeNo: 'TR008', rank: 'Officer', unit: 'Traffic', firstName: 'سعد', lastName: 'العتيبي', email: 'trainee8@kbn.local' },
    { qid: '20000000009', badgeNo: 'TR009', rank: 'Sergeant', unit: 'Patrol', firstName: 'فاطمة', lastName: 'الدوسري', email: 'trainee9@kbn.local' },
    { qid: '20000000010', badgeNo: 'TR010', rank: 'Corporal', unit: 'Criminal', firstName: 'حسن', lastName: 'المطيري', email: 'trainee10@kbn.local' },
  ];

  for (const data of traineeData) {
    const trainee = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        password: await bcrypt.hash('Passw0rd!', 12),
        role: UserRole.TRAINEE,
        locale: 'ar',
        status: UserStatus.ACTIVE,
      },
    });
    trainees.push(trainee);
  }

  console.log('✅ Users created');

  // Create courses
  const courses = [
    {
      code: 'POL-101',
      titleAr: 'أساسيات الشرطة والقانون',
      titleEn: 'Police Fundamentals and Law',
      summaryAr: 'مقدمة شاملة في أساسيات العمل الشرطي والقوانين الأساسية',
      summaryEn: 'Comprehensive introduction to police work fundamentals and basic laws',
      modality: CourseModality.ELearning,
      durationMins: 240,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'SEC-201',
      titleAr: 'الأمن والسلامة العامة',
      titleEn: 'Public Security and Safety',
      summaryAr: 'دورة في إدارة الأمن العام والتعامل مع الحوادث الأمنية',
      summaryEn: 'Course on public security management and handling security incidents',
      modality: CourseModality.ELearning,
      durationMins: 180,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'TRA-301',
      titleAr: 'إدارة حركة المرور',
      titleEn: 'Traffic Management',
      summaryAr: 'مهارات إدارة حركة المرور وتنظيم السير',
      summaryEn: 'Traffic management skills and traffic regulation',
      modality: CourseModality.Blended,
      durationMins: 300,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'CRI-401',
      titleAr: 'التحقيق الجنائي الأساسي',
      titleEn: 'Basic Criminal Investigation',
      summaryAr: 'أساسيات التحقيق الجنائي وجمع الأدلة',
      summaryEn: 'Fundamentals of criminal investigation and evidence collection',
      modality: CourseModality.Classroom,
      durationMins: 480,
      status: CourseStatus.PUBLISHED,
    },
  ];

  const createdCourses = [];
  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { code: courseData.code },
      update: {},
      create: {
        ...courseData,
        createdById: instructor.id,
      },
    });
    createdCourses.push(course);
  }

  console.log('✅ Courses created');

  // Create course modules
  const modulesData = [
    { courseId: createdCourses[0].id, titleAr: 'المقدمة في العمل الشرطي', titleEn: 'Introduction to Police Work', order: 1, kind: 'VIDEO', uri: '/videos/police-intro.mp4', durationMins: 30 },
    { courseId: createdCourses[0].id, titleAr: 'الحقوق والواجبات', titleEn: 'Rights and Duties', order: 2, kind: 'PDF', uri: '/docs/rights-duties.pdf', durationMins: 45 },
    { courseId: createdCourses[0].id, titleAr: 'القوانين الأساسية', titleEn: 'Basic Laws', order: 3, kind: 'VIDEO', uri: '/videos/basic-laws.mp4', durationMins: 35 },
    { courseId: createdCourses[1].id, titleAr: 'مفاهيم الأمن العام', titleEn: 'Public Security Concepts', order: 1, kind: 'VIDEO', uri: '/videos/security-concepts.mp4', durationMins: 25 },
    { courseId: createdCourses[1].id, titleAr: 'إدارة الطوارئ', titleEn: 'Emergency Management', order: 2, kind: 'PDF', uri: '/docs/emergency-guide.pdf', durationMins: 40 },
  ];

  for (const moduleData of modulesData) {
    await prisma.module.create({
      data: moduleData,
    });
  }

  console.log('✅ Course modules created');

  // Create exams
  const exams = [
    {
      titleAr: 'اختبار أساسيات الشرطة',
      titleEn: 'Police Fundamentals Test',
      courseId: createdCourses[0].id,
      timeLimitMins: 30,
      totalMarks: 100,
      randomize: true,
      negativeMarking: false,
      lockdown: false,
      isPublished: true,
    },
    {
      titleAr: 'اختبار الأمن العام',
      titleEn: 'Public Security Test',
      courseId: createdCourses[1].id,
      timeLimitMins: 25,
      totalMarks: 80,
      randomize: false,
      negativeMarking: true,
      lockdown: false,
      isPublished: true,
    },
  ];

  const createdExams = [];
  for (const examData of exams) {
    const exam = await prisma.exam.upsert({
      where: {
        titleAr_courseId: {
          titleAr: examData.titleAr,
          courseId: examData.courseId,
        },
      },
      update: {},
      create: examData,
    });
    createdExams.push(exam);
  }

  console.log('✅ Exams created');

  // Create questions for first exam
  const questions1 = [
    {
      questionAr: 'ما هو الدور الأساسي للشرطة في المجتمع؟',
      questionEn: 'What is the primary role of police in society?',
      type: QuestionType.MULTIPLE_CHOICE,
      marks: 10,
      options: [
        { optionAr: 'الحفاظ على الأمن والنظام', optionEn: 'Maintain security and order' },
        { optionAr: 'جمع الضرائب', optionEn: 'Collect taxes' },
        { optionAr: 'بناء الطرق', optionEn: 'Build roads' },
        { optionAr: 'تعليم الأطفال', optionEn: 'Educate children' },
      ],
      correctAnswer: 'option1',
    },
    {
      questionAr: 'ما هي الحقوق الأساسية للمواطن أمام الشرطة؟',
      questionEn: 'What are the basic rights of citizens before police?',
      type: QuestionType.MULTIPLE_CHOICE,
      marks: 15,
      options: [
        { optionAr: 'الحق في الصمت', optionEn: 'Right to silence' },
        { optionAr: 'الحق في الطعام المجاني', optionEn: 'Right to free food' },
        { optionAr: 'الحق في عدم دفع الضرائب', optionEn: 'Right to not pay taxes' },
        { optionAr: 'الحق في قيادة بدون رخصة', optionEn: 'Right to drive without license' },
      ],
      correctAnswer: 'option1',
    },
    {
      questionAr: 'هل يمكن للشرطي استخدام القوة المفرطة؟',
      questionEn: 'Can a police officer use excessive force?',
      type: QuestionType.TRUE_FALSE,
      marks: 10,
      correctAnswer: 'false',
    },
  ];

  for (let i = 0; i < questions1.length; i++) {
    const q = questions1[i];
    const question = await prisma.question.upsert({
      where: {
        examId_order: {
          examId: createdExams[0].id,
          order: i + 1,
        },
      },
      update: {},
      create: {
        examId: createdExams[0].id,
        order: i + 1,
        questionAr: q.questionAr,
        questionEn: q.questionEn,
        type: q.type,
        marks: q.marks,
        correctAnswer: q.correctAnswer,
        options: q.options ? {
          create: q.options.map((opt, idx) => ({
            order: idx + 1,
            optionAr: opt.optionAr,
            optionEn: opt.optionEn,
          })),
        } : undefined,
      },
    });

    // Update correct answer reference
    if (q.options) {
      const correctOption = await prisma.questionOption.findFirst({
        where: {
          questionId: question.id,
          order: q.correctAnswer === 'option1' ? 1 : q.correctAnswer === 'option2' ? 2 : q.correctAnswer === 'option3' ? 3 : 4,
        },
      });
      if (correctOption) {
        await prisma.question.update({
          where: { id: question.id },
          data: { correctAnswer: correctOption.id },
        });
      }
    }
  }

  console.log('✅ Questions created');

  // Create enrollments
  for (const trainee of trainees.slice(0, 10)) { // Enroll first 10 trainees
    for (const course of createdCourses.slice(0, 2)) { // Enroll in first 2 courses
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: trainee.id,
            courseId: course.id,
          },
        },
        update: {},
        create: {
          userId: trainee.id,
          courseId: course.id,
          enrolledAt: new Date(),
          status: 'ACTIVE',
        },
      });
    }
  }

  console.log('✅ Enrollments created');

  // Create some sample attempts
  for (const trainee of trainees.slice(0, 3)) { // First 3 trainees
    const attempt = await prisma.attempt.create({
      data: {
        examId: createdExams[0].id,
        userId: trainee.id,
        score: Math.floor(Math.random() * 80) + 20, // Random score 20-100
        maxScore: 100,
        percentage: Math.floor(Math.random() * 80) + 20,
        timeSpent: Math.floor(Math.random() * 1800) + 600, // 10-40 minutes
        autoSubmitted: false,
      },
    });

    // Create some sample answers
    const questions = await prisma.question.findMany({
      where: { examId: createdExams[0].id },
      include: { options: true },
    });

    for (const question of questions) {
      const isCorrect = Math.random() > 0.3; // 70% correct answers
      const marks = isCorrect ? question.marks : 0;

      if (question.options && question.options.length > 0) {
        const randomOption = question.options[Math.floor(Math.random() * question.options.length)];
        await prisma.answer.create({
          data: {
            attemptId: attempt.id,
            questionId: question.id,
            answer: randomOption.id,
            isCorrect,
            marks,
            timeSpent: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
          },
        });
      }
    }
  }

  console.log('✅ Sample attempts and answers created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • Users: ${5 + trainees.length}`);
  console.log(`   • Courses: ${createdCourses.length}`);
  console.log(`   • Exams: ${createdExams.length}`);
  console.log(`   • Questions: ${questions1.length}`);
  console.log(`   • Enrollments: ${10 * 2}`);
  console.log('');
  console.log('🔐 Demo Credentials:');
  console.log('   Super Admin: super@kbn.local / Passw0rd!');
  console.log('   Admin: admin@kbn.local / Passw0rd!');
  console.log('   Instructor: instructor@kbn.local / Passw0rd!');
  console.log('   Commander: commander@kbn.local / Passw0rd!');
  console.log('   Trainee: trainee@kbn.local / Passw0rd!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });