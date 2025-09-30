import { PrismaClient, UserStatus, CourseStatus, CourseModality, QuestionType, ModuleKind, FileType, FileStatus } from '@prisma/client';
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
      role: 'super_admin',
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
      role: 'admin',
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
      role: 'instructor',
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
      role: 'commander',
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
        role: 'trainee',
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

  // Create comprehensive course modules
  const modulesData = [
    // Police Fundamentals Course (POL-101) - 9 modules
    { courseId: createdCourses[0].id, order: 1, kind: 'VIDEO' as ModuleKind, uri: '/videos/police-intro.mp4', durationMins: 30, metadata: { titleAr: 'المقدمة في العمل الشرطي', titleEn: 'Introduction to Police Work' } },
    { courseId: createdCourses[0].id, order: 2, kind: 'PDF' as ModuleKind, uri: '/docs/rights-duties.pdf', durationMins: 45, metadata: { titleAr: 'الحقوق والواجبات', titleEn: 'Rights and Duties' } },
    { courseId: createdCourses[0].id, order: 3, kind: 'VIDEO' as ModuleKind, uri: '/videos/basic-laws.mp4', durationMins: 35, metadata: { titleAr: 'القوانين الأساسية', titleEn: 'Basic Laws' } },
    { courseId: createdCourses[0].id, order: 4, kind: 'PDF' as ModuleKind, uri: '/docs/criminal-code.pdf', durationMins: 40, metadata: { titleAr: 'قانون العقوبات', titleEn: 'Criminal Code' } },
    { courseId: createdCourses[0].id, order: 5, kind: 'VIDEO' as ModuleKind, uri: '/videos/procedures.mp4', durationMins: 25, metadata: { titleAr: 'الإجراءات الشرطية', titleEn: 'Police Procedures' } },
    { courseId: createdCourses[0].id, order: 6, kind: 'PDF' as ModuleKind, uri: '/docs/evidence-handling.pdf', durationMins: 35, metadata: { titleAr: 'التعامل مع الأدلة', titleEn: 'Evidence Handling' } },
    { courseId: createdCourses[0].id, order: 7, kind: 'VIDEO' as ModuleKind, uri: '/videos/community-policing.mp4', durationMins: 20, metadata: { titleAr: 'الشرطة المجتمعية', titleEn: 'Community Policing' } },
    { courseId: createdCourses[0].id, order: 8, kind: 'PDF' as ModuleKind, uri: '/docs/ethics.pdf', durationMins: 30, metadata: { titleAr: 'أخلاقيات المهنة', titleEn: 'Professional Ethics' } },
    { courseId: createdCourses[0].id, order: 9, kind: 'QUIZ' as ModuleKind, uri: '/quizzes/police-fundamentals-quiz', durationMins: 20, metadata: { titleAr: 'اختبار أساسيات الشرطة', titleEn: 'Police Fundamentals Quiz' } },
    
    // Public Security Course (SEC-201) - 6 modules
    { courseId: createdCourses[1].id, order: 1, kind: 'VIDEO' as ModuleKind, uri: '/videos/security-concepts.mp4', durationMins: 25, metadata: { titleAr: 'مفاهيم الأمن العام', titleEn: 'Public Security Concepts' } },
    { courseId: createdCourses[1].id, order: 2, kind: 'PDF' as ModuleKind, uri: '/docs/emergency-guide.pdf', durationMins: 40, metadata: { titleAr: 'إدارة الطوارئ', titleEn: 'Emergency Management' } },
    { courseId: createdCourses[1].id, order: 3, kind: 'VIDEO' as ModuleKind, uri: '/videos/incident-response.mp4', durationMins: 30, metadata: { titleAr: 'الاستجابة للحوادث', titleEn: 'Incident Response' } },
    { courseId: createdCourses[1].id, order: 4, kind: 'PDF' as ModuleKind, uri: '/docs/crisis-management.pdf', durationMins: 35, metadata: { titleAr: 'إدارة الأزمات', titleEn: 'Crisis Management' } },
    { courseId: createdCourses[1].id, order: 5, kind: 'VIDEO' as ModuleKind, uri: '/videos/security-protocols.mp4', durationMins: 20, metadata: { titleAr: 'بروتوكولات الأمن', titleEn: 'Security Protocols' } },
    { courseId: createdCourses[1].id, order: 6, kind: 'QUIZ' as ModuleKind, uri: '/quizzes/security-quiz', durationMins: 15, metadata: { titleAr: 'اختبار الأمن العام', titleEn: 'Public Security Quiz' } },
    
    // Traffic Management Course (TRA-301) - 8 modules
    { courseId: createdCourses[2].id, order: 1, kind: 'VIDEO' as ModuleKind, uri: '/videos/traffic-laws.mp4', durationMins: 35, metadata: { titleAr: 'قوانين المرور', titleEn: 'Traffic Laws' } },
    { courseId: createdCourses[2].id, order: 2, kind: 'PDF' as ModuleKind, uri: '/docs/traffic-regulations.pdf', durationMins: 45, metadata: { titleAr: 'أنظمة المرور', titleEn: 'Traffic Regulations' } },
    { courseId: createdCourses[2].id, order: 3, kind: 'VIDEO' as ModuleKind, uri: '/videos/accident-investigation.mp4', durationMins: 40, metadata: { titleAr: 'تحقيق الحوادث', titleEn: 'Accident Investigation' } },
    { courseId: createdCourses[2].id, order: 4, kind: 'PDF' as ModuleKind, uri: '/docs/traffic-control.pdf', durationMins: 30, metadata: { titleAr: 'التحكم في المرور', titleEn: 'Traffic Control' } },
    { courseId: createdCourses[2].id, order: 5, kind: 'VIDEO' as ModuleKind, uri: '/videos/vehicle-inspection.mp4', durationMins: 25, metadata: { titleAr: 'فحص المركبات', titleEn: 'Vehicle Inspection' } },
    { courseId: createdCourses[2].id, order: 6, kind: 'PDF' as ModuleKind, uri: '/docs/penalty-system.pdf', durationMins: 35, metadata: { titleAr: 'نظام المخالفات', titleEn: 'Penalty System' } },
    { courseId: createdCourses[2].id, order: 7, kind: 'VIDEO' as ModuleKind, uri: '/videos/traffic-safety.mp4', durationMins: 20, metadata: { titleAr: 'سلامة المرور', titleEn: 'Traffic Safety' } },
    { courseId: createdCourses[2].id, order: 8, kind: 'QUIZ' as ModuleKind, uri: '/quizzes/traffic-quiz', durationMins: 25, metadata: { titleAr: 'اختبار إدارة المرور', titleEn: 'Traffic Management Quiz' } },
    
    // Criminal Investigation Course (CRI-401) - 12 modules
    { courseId: createdCourses[3].id, order: 1, kind: 'VIDEO' as ModuleKind, uri: '/videos/investigation-basics.mp4', durationMins: 45, metadata: { titleAr: 'أساسيات التحقيق', titleEn: 'Investigation Basics' } },
    { courseId: createdCourses[3].id, order: 2, kind: 'PDF' as ModuleKind, uri: '/docs/crime-scene.pdf', durationMins: 50, metadata: { titleAr: 'مسرح الجريمة', titleEn: 'Crime Scene' } },
    { courseId: createdCourses[3].id, order: 3, kind: 'VIDEO' as ModuleKind, uri: '/videos/evidence-collection.mp4', durationMins: 40, metadata: { titleAr: 'جمع الأدلة', titleEn: 'Evidence Collection' } },
    { courseId: createdCourses[3].id, order: 4, kind: 'PDF' as ModuleKind, uri: '/docs/forensics.pdf', durationMins: 60, metadata: { titleAr: 'الطب الشرعي', titleEn: 'Forensics' } },
    { courseId: createdCourses[3].id, order: 5, kind: 'VIDEO' as ModuleKind, uri: '/videos/interviewing.mp4', durationMins: 35, metadata: { titleAr: 'أسلوب الاستجواب', titleEn: 'Interviewing Techniques' } },
    { courseId: createdCourses[3].id, order: 6, kind: 'PDF' as ModuleKind, uri: '/docs/suspect-rights.pdf', durationMins: 30, metadata: { titleAr: 'حقوق المشتبه بهم', titleEn: 'Suspect Rights' } },
    { courseId: createdCourses[3].id, order: 7, kind: 'VIDEO' as ModuleKind, uri: '/videos/case-management.mp4', durationMins: 25, metadata: { titleAr: 'إدارة القضايا', titleEn: 'Case Management' } },
    { courseId: createdCourses[3].id, order: 8, kind: 'PDF' as ModuleKind, uri: '/docs/court-procedures.pdf', durationMins: 40, metadata: { titleAr: 'الإجراءات القضائية', titleEn: 'Court Procedures' } },
    { courseId: createdCourses[3].id, order: 9, kind: 'VIDEO' as ModuleKind, uri: '/videos/cyber-crimes.mp4', durationMins: 30, metadata: { titleAr: 'الجرائم الإلكترونية', titleEn: 'Cyber Crimes' } },
    { courseId: createdCourses[3].id, order: 10, kind: 'PDF' as ModuleKind, uri: '/docs/white-collar-crimes.pdf', durationMins: 35, metadata: { titleAr: 'الجرائم الاقتصادية', titleEn: 'White Collar Crimes' } },
    { courseId: createdCourses[3].id, order: 11, kind: 'VIDEO' as ModuleKind, uri: '/videos/report-writing.mp4', durationMins: 20, metadata: { titleAr: 'كتابة التقارير', titleEn: 'Report Writing' } },
    { courseId: createdCourses[3].id, order: 12, kind: 'QUIZ' as ModuleKind, uri: '/quizzes/investigation-quiz', durationMins: 30, metadata: { titleAr: 'اختبار التحقيق الجنائي', titleEn: 'Criminal Investigation Quiz' } },
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
    const exam = await prisma.exam.create({
      data: examData,
    });
    createdExams.push(exam);
  }

  console.log('✅ Exams created');

  // Create comprehensive questions for all exams
  const questions1 = [
    {
      questionAr: 'ما هو الدور الأساسي للشرطة في المجتمع؟',
      questionEn: 'What is the primary role of police in society?',
      type: QuestionType.MCQ,
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
      type: QuestionType.MCQ,
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
      type: QuestionType.TRUEFALSE,
      marks: 10,
      correctAnswer: 'false',
    },
    {
      questionAr: 'ما هي الإجراءات المطلوبة عند القبض على شخص؟',
      questionEn: 'What procedures are required when arresting a person?',
      type: QuestionType.MCQ,
      marks: 12,
      options: [
        { optionAr: 'إبلاغه بأسباب القبض', optionEn: 'Inform him of arrest reasons' },
        { optionAr: 'إعطاؤه وجبة مجانية', optionEn: 'Give him free meal' },
        { optionAr: 'السماح له بالهروب', optionEn: 'Allow him to escape' },
        { optionAr: 'عدم تسجيل القبض', optionEn: 'Not record the arrest' },
      ],
      correctAnswer: 'option1',
    },
    {
      questionAr: 'ما هو الحد الأقصى للعقوبة في القانون القطري؟',
      questionEn: 'What is the maximum penalty in Qatari law?',
      type: QuestionType.MCQ,
      marks: 8,
      options: [
        { optionAr: 'السجن المؤبد', optionEn: 'Life imprisonment' },
        { optionAr: 'الغرامة المالية', optionEn: 'Financial fine' },
        { optionAr: 'العمل المجتمعي', optionEn: 'Community service' },
        { optionAr: 'الإعدام', optionEn: 'Death penalty' },
      ],
      correctAnswer: 'option4',
    },
  ];

  const questions2 = [
    {
      questionAr: 'ما هي أولوية الإجراءات في حالة الطوارئ؟',
      questionEn: 'What is the priority of procedures in emergency situations?',
      type: QuestionType.MCQ,
      marks: 10,
      options: [
        { optionAr: 'إنقاذ الأرواح', optionEn: 'Save lives' },
        { optionAr: 'جمع الأدلة', optionEn: 'Collect evidence' },
        { optionAr: 'إغلاق المنطقة', optionEn: 'Seal the area' },
        { optionAr: 'استدعاء الإعلام', optionEn: 'Call media' },
      ],
      correctAnswer: 'option1',
    },
    {
      questionAr: 'هل يجب إخلاء المبنى فوراً عند سماع إنذار الحريق؟',
      questionEn: 'Should the building be evacuated immediately when hearing fire alarm?',
      type: QuestionType.TRUEFALSE,
      marks: 8,
      correctAnswer: 'true',
    },
    {
      questionAr: 'ما هي أنواع الطوارئ التي يمكن أن تواجهها الشرطة؟',
      questionEn: 'What types of emergencies can police face?',
      type: QuestionType.MCQ,
      marks: 12,
      options: [
        { optionAr: 'حرائق، فيضانات، حوادث', optionEn: 'Fires, floods, accidents' },
        { optionAr: 'أحزاب سياسية فقط', optionEn: 'Political parties only' },
        { optionAr: 'حفلات الزفاف', optionEn: 'Wedding parties' },
        { optionAr: 'المباريات الرياضية فقط', optionEn: 'Sports matches only' },
      ],
      correctAnswer: 'option1',
    },
  ];

  // Create questions for first exam (Police Fundamentals)
  for (let i = 0; i < questions1.length; i++) {
    const q = questions1[i];
    const question = await prisma.question.create({
      data: {
        examId: createdExams[0].id,
        stemAr: q.questionAr,
        stemEn: q.questionEn,
        type: q.type,
        marks: q.marks,
        answer: q.correctAnswer,
        options: q.options,
      },
    });
  }

  // Create questions for second exam (Public Security)
  for (let i = 0; i < questions2.length; i++) {
    const q = questions2[i];
    const question = await prisma.question.create({
      data: {
        examId: createdExams[1].id,
        stemAr: q.questionAr,
        stemEn: q.questionEn,
        type: q.type,
        marks: q.marks,
        answer: q.correctAnswer,
        options: q.options,
      },
    });
  }

  console.log('✅ Questions created');

  // Create comprehensive enrollments
  // Enroll all trainees in Police Fundamentals (POL-101)
  for (const trainee of trainees) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: trainee.id,
          courseId: createdCourses[0].id, // POL-101
        },
      },
      update: {},
      create: {
        userId: trainee.id,
        courseId: createdCourses[0].id,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    });
  }

  // Enroll Traffic unit trainees in Traffic Management (TRA-301)
  for (const trainee of trainees.filter(t => t.unit === 'Traffic')) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: trainee.id,
          courseId: createdCourses[2].id, // TRA-301
        },
      },
      update: {},
      create: {
        userId: trainee.id,
        courseId: createdCourses[2].id,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    });
  }

  // Enroll Criminal unit trainees in Criminal Investigation (CRI-401)
  for (const trainee of trainees.filter(t => t.unit === 'Criminal')) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: trainee.id,
          courseId: createdCourses[3].id, // CRI-401
        },
      },
      update: {},
      create: {
        userId: trainee.id,
        courseId: createdCourses[3].id,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    });
  }

  // Enroll some Patrol unit trainees in Public Security (SEC-201)
  for (const trainee of trainees.filter(t => t.unit === 'Patrol').slice(0, 3)) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: trainee.id,
          courseId: createdCourses[1].id, // SEC-201
        },
      },
      update: {},
      create: {
        userId: trainee.id,
        courseId: createdCourses[1].id,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    });
  }

  console.log('✅ Enrollments created');

  // Create some sample attempts
  for (const trainee of trainees.slice(0, 3)) { // First 3 trainees
    const attempt = await prisma.attempt.create({
      data: {
        examId: createdExams[0].id,
        userId: trainee.id,
        score: Math.floor(Math.random() * 80) + 20, // Random score 20-100
      },
    });

  }

  console.log('✅ Sample attempts and answers created');

  // Create comprehensive sample files
  const sampleFiles = [
    // Police Fundamentals Course Files
    {
      filename: 'Police_Training_Manual.pdf',
      bucket: 'local',
      key: 'files/police-training-manual.pdf',
      size: 2048576, // 2MB
      checksum: 'abc123def456',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 150, author: 'TSF Police Training Department' },
      uploaderId: superAdmin.id,
      courseId: createdCourses[0].id,
      isPublic: false,
      downloadCount: 45,
    },
    {
      filename: 'Criminal_Code_Handbook.pdf',
      bucket: 'local',
      key: 'files/criminal-code-handbook.pdf',
      size: 3145728, // 3MB
      checksum: 'bcd234efg567',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 200, version: '2024.1', author: 'Qatar Legal Department' },
      uploaderId: admin.id,
      courseId: createdCourses[0].id,
      isPublic: false,
      downloadCount: 67,
    },
    {
      filename: 'Evidence_Collection_Procedures.docx',
      bucket: 'local',
      key: 'files/evidence-collection-procedures.docx',
      size: 1572864, // 1.5MB
      checksum: 'cde345fgh678',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: FileType.DOC,
      status: FileStatus.PROCESSED,
      metadata: { pages: 85, lastUpdated: '2024-02-15', department: 'Criminal Investigation' },
      uploaderId: instructor.id,
      courseId: createdCourses[0].id,
      isPublic: false,
      downloadCount: 34,
    },
    {
      filename: 'Officer_Code_of_Conduct.pdf',
      bucket: 'local',
      key: 'files/officer-code-of-conduct.pdf',
      size: 1048576, // 1MB
      checksum: 'def456ghi789',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 120, version: '3.2', effectiveDate: '2024-01-01' },
      uploaderId: commander.id,
      courseId: createdCourses[0].id,
      isPublic: true,
      downloadCount: 234,
    },
    // Public Security Course Files
    {
      filename: 'Security_Procedures.pptx',
      bucket: 'local',
      key: 'files/security-procedures.pptx',
      size: 15728640, // 15MB
      checksum: 'efg567hij890',
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileType: FileType.PPT,
      status: FileStatus.PROCESSED,
      metadata: { slides: 25, duration: '45 minutes', department: 'Security Operations' },
      uploaderId: admin.id,
      courseId: createdCourses[1].id,
      isPublic: true,
      downloadCount: 23,
    },
    {
      filename: 'Emergency_Response_Protocol.pdf',
      bucket: 'local',
      key: 'files/emergency-response-protocol.pdf',
      size: 4194304, // 4MB
      checksum: 'fgh678ijk901',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 180, version: '2024.2', emergencyLevels: 5 },
      uploaderId: commander.id,
      courseId: createdCourses[1].id,
      isPublic: false,
      downloadCount: 89,
    },
    {
      filename: 'Crisis_Management_Checklist.xlsx',
      bucket: 'local',
      key: 'files/crisis-management-checklist.xlsx',
      size: 1048576, // 1MB
      checksum: 'ghi789jkl012',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileType: FileType.XLS,
      status: FileStatus.PROCESSED,
      metadata: { sheets: 4, scenarios: 12, lastUpdated: '2024-03-01' },
      uploaderId: instructor.id,
      courseId: createdCourses[1].id,
      isPublic: false,
      downloadCount: 45,
    },
    // Traffic Management Course Files
    {
      filename: 'Traffic_Laws_Manual.pdf',
      bucket: 'local',
      key: 'files/traffic-laws-manual.pdf',
      size: 2097152, // 2MB
      checksum: 'hij890klm123',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 150, version: '2024.1', lastUpdated: '2024-01-15' },
      uploaderId: instructor.id,
      courseId: createdCourses[2].id,
      isPublic: false,
      downloadCount: 67,
    },
    {
      filename: 'Accident_Investigation_Guide.docx',
      bucket: 'local',
      key: 'files/accident-investigation-guide.docx',
      size: 1572864, // 1.5MB
      checksum: 'ijk901lmn234',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: FileType.DOC,
      status: FileStatus.PROCESSED,
      metadata: { pages: 95, procedures: 25, lastUpdated: '2024-02-20' },
      uploaderId: admin.id,
      courseId: createdCourses[2].id,
      isPublic: false,
      downloadCount: 34,
    },
    {
      filename: 'Traffic_Violations_Database.xlsx',
      bucket: 'local',
      key: 'files/traffic-violations-database.xlsx',
      size: 524288, // 512KB
      checksum: 'jkl012mno345',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileType: FileType.XLS,
      status: FileStatus.PROCESSED,
      metadata: { sheets: 3, violations: 150, lastUpdated: '2024-03-10' },
      uploaderId: commander.id,
      courseId: createdCourses[2].id,
      isPublic: true,
      downloadCount: 89,
    },
    // Criminal Investigation Course Files
    {
      filename: 'Forensics_Handbook.pdf',
      bucket: 'local',
      key: 'files/forensics-handbook.pdf',
      size: 6291456, // 6MB
      checksum: 'klm123nop456',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 300, sections: 12, lastUpdated: '2024-01-30' },
      uploaderId: superAdmin.id,
      courseId: createdCourses[3].id,
      isPublic: false,
      downloadCount: 78,
    },
    {
      filename: 'Crime_Scene_Photography_Guide.pdf',
      bucket: 'local',
      key: 'files/crime-scene-photography-guide.pdf',
      size: 4194304, // 4MB
      checksum: 'lmn234opq567',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 180, techniques: 25, equipment: 'DSLR Cameras' },
      uploaderId: instructor.id,
      courseId: createdCourses[3].id,
      isPublic: false,
      downloadCount: 45,
    },
    {
      filename: 'Evidence_Chain_of_Custody.xlsx',
      bucket: 'local',
      key: 'files/evidence-chain-of-custody.xlsx',
      size: 1048576, // 1MB
      checksum: 'mno345pqr678',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileType: FileType.XLS,
      status: FileStatus.PROCESSED,
      metadata: { sheets: 5, templates: 10, lastUpdated: '2024-02-15' },
      uploaderId: admin.id,
      courseId: createdCourses[3].id,
      isPublic: true,
      downloadCount: 67,
    },
    {
      filename: 'Interviewing_Techniques_Manual.docx',
      bucket: 'local',
      key: 'files/interviewing-techniques-manual.docx',
      size: 2097152, // 2MB
      checksum: 'nop456qrs789',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: FileType.DOC,
      status: FileStatus.PROCESSED,
      metadata: { pages: 120, techniques: 18, scenarios: 30 },
      uploaderId: commander.id,
      courseId: createdCourses[3].id,
      isPublic: false,
      downloadCount: 56,
    },
    // Multimedia Training Files
    {
      filename: 'Emergency_Procedures_Audio.mp3',
      bucket: 'local',
      key: 'files/emergency-procedures-audio.mp3',
      size: 8388608, // 8MB
      checksum: 'opq567rst890',
      contentType: 'audio/mpeg',
      fileType: FileType.MP3,
      status: FileStatus.PROCESSED,
      metadata: { duration: '12:30', bitrate: '128kbps', language: 'Arabic' },
      uploaderId: instructor.id,
      courseId: createdCourses[1].id,
      isPublic: false,
      downloadCount: 89,
    },
    {
      filename: 'Police_Equipment_Demo.mp4',
      bucket: 'local',
      key: 'files/police-equipment-demo.mp4',
      size: 52428800, // 50MB
      checksum: 'pqr678stu901',
      contentType: 'video/mp4',
      fileType: FileType.MP4,
      status: FileStatus.PROCESSED,
      metadata: { duration: '15:45', resolution: '1920x1080', fps: 30, language: 'Arabic/English' },
      uploaderId: commander.id,
      courseId: createdCourses[0].id,
      isPublic: true,
      downloadCount: 156,
    },
    {
      filename: 'Traffic_Control_Simulation.mp4',
      bucket: 'local',
      key: 'files/traffic-control-simulation.mp4',
      size: 31457280, // 30MB
      checksum: 'qrs789tuv012',
      contentType: 'video/mp4',
      fileType: FileType.MP4,
      status: FileStatus.PROCESSED,
      metadata: { duration: '22:15', resolution: '1280x720', fps: 25, simulation: true },
      uploaderId: admin.id,
      courseId: createdCourses[2].id,
      isPublic: false,
      downloadCount: 78,
    },
    {
      filename: 'Crime_Scene_Analysis_Demo.mp4',
      bucket: 'local',
      key: 'files/crime-scene-analysis-demo.mp4',
      size: 41943040, // 40MB
      checksum: 'rst890uvw123',
      contentType: 'video/mp4',
      fileType: FileType.MP4,
      status: FileStatus.PROCESSED,
      metadata: { duration: '28:30', resolution: '1920x1080', fps: 30, caseStudy: 'Real Case' },
      uploaderId: instructor.id,
      courseId: createdCourses[3].id,
      isPublic: false,
      downloadCount: 123,
    },
    {
      filename: 'Training_Schedule_Overview.xlsx',
      bucket: 'local',
      key: 'files/training-schedule-overview.xlsx',
      size: 1048576, // 1MB
      checksum: 'stu901vwx234',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileType: FileType.XLS,
      status: FileStatus.PROCESSED,
      metadata: { sheets: 6, courses: 4, trainees: 50, lastUpdated: '2024-03-15' },
      uploaderId: admin.id,
      isPublic: true,
      downloadCount: 45,
    },
    // Additional Training Resources
    {
      filename: 'Officer_Badge_Template.jpg',
      bucket: 'local',
      key: 'files/officer-badge-template.jpg',
      size: 2097152, // 2MB
      checksum: 'tuv012wxy345',
      contentType: 'image/jpeg',
      fileType: FileType.IMAGE,
      status: FileStatus.PROCESSED,
      metadata: { width: 1024, height: 1024, format: 'JPEG', department: 'HR' },
      uploaderId: admin.id,
      isPublic: false,
      downloadCount: 12,
    },
    {
      filename: 'Training_Certificate_Template.pdf',
      bucket: 'local',
      key: 'files/training-certificate-template.pdf',
      size: 1048576, // 1MB
      checksum: 'uvw123xyz456',
      contentType: 'application/pdf',
      fileType: FileType.PDF,
      status: FileStatus.PROCESSED,
      metadata: { pages: 1, template: true, lastUpdated: '2024-01-01' },
      uploaderId: superAdmin.id,
      isPublic: true,
      downloadCount: 89,
    },
  ];

  const createdFiles = [];
  for (const fileData of sampleFiles) {
    const file = await prisma.fileObject.upsert({
      where: {
        bucket_key: {
          bucket: fileData.bucket,
          key: fileData.key,
        },
      },
      update: {},
      create: fileData,
    });
    createdFiles.push(file);
  }

  console.log('✅ Sample files created');

  console.log('🎉 Enhanced database seeding completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • Users: ${5 + trainees.length} (Super Admin, Admin, Instructor, Commander, ${trainees.length} Trainees)`);
  console.log(`   • Courses: ${createdCourses.length} (POL-101, SEC-201, TRA-301, CRI-401)`);
  console.log(`   • Modules: ${modulesData.length} (${createdCourses[0].titleEn}: 9 modules, ${createdCourses[1].titleEn}: 6 modules, ${createdCourses[2].titleEn}: 8 modules, ${createdCourses[3].titleEn}: 12 modules)`);
  console.log(`   • Exams: ${createdExams.length} (with comprehensive questions)`);
  console.log(`   • Questions: ${questions1.length + questions2.length} (MCQ and True/False)`);
  console.log(`   • Enrollments: ${trainees.length + 3 + 3 + 3} (All trainees in Police Fundamentals, Traffic unit in Traffic Management, Criminal unit in Criminal Investigation, 3 Patrol in Public Security)`);
  console.log(`   • Files: ${createdFiles.length} (PDFs, DOCX, XLSX, PPTX, MP3, MP4, JPG)`);
  console.log(`   • File Types: PDF (${createdFiles.filter(f => f.fileType === FileType.PDF).length}), DOC (${createdFiles.filter(f => f.fileType === FileType.DOC).length}), XLS (${createdFiles.filter(f => f.fileType === FileType.XLS).length}), PPT (${createdFiles.filter(f => f.fileType === FileType.PPT).length}), MP3 (${createdFiles.filter(f => f.fileType === FileType.MP3).length}), MP4 (${createdFiles.filter(f => f.fileType === FileType.MP4).length}), IMAGE (${createdFiles.filter(f => f.fileType === FileType.IMAGE).length})`);
  console.log('');
  console.log('🔐 Demo Credentials:');
  console.log('   Super Admin: super@kbn.local / Passw0rd!');
  console.log('   Admin: admin@kbn.local / Passw0rd!');
  console.log('   Instructor: instructor@kbn.local / Passw0rd!');
  console.log('   Commander: commander@kbn.local / Passw0rd!');
  console.log('   Trainee: trainee@kbn.local / Passw0rd!');
  console.log('');
  console.log('📚 Course Content:');
  console.log(`   • Police Fundamentals (POL-101): 9 modules, 5 questions, 4 files`);
  console.log(`   • Public Security (SEC-201): 6 modules, 3 questions, 3 files`);
  console.log(`   • Traffic Management (TRA-301): 8 modules, 0 questions, 3 files`);
  console.log(`   • Criminal Investigation (CRI-401): 12 modules, 0 questions, 4 files`);
  console.log('');
  console.log('📁 File Types Available:');
  console.log('   • PDFs: Training manuals, handbooks, procedures, protocols');
  console.log('   • DOCX: Procedures, guides, manuals, techniques');
  console.log('   • XLSX: Databases, schedules, checklists, templates');
  console.log('   • PPTX: Presentations, training materials');
  console.log('   • MP3: Audio training content');
  console.log('   • MP4: Video demonstrations, simulations, case studies');
  console.log('   • JPG: Templates, images, visual aids');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });