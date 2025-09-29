import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';

// Mock data - in production this would come from API
const mockLearningStats = {
  enrolledCourses: 8,
  completedCourses: 5,
  inProgressCourses: 3,
  totalHoursLearned: 42,
  certificatesEarned: 4,
  averageScore: 88,
};

const mockEnrolledCourses = [
  {
    id: 1,
    title: 'إدارة الحشود في المنشآت الرياضية',
    instructor: 'أحمد محمد',
    progress: 85,
    totalModules: 12,
    completedModules: 10,
    status: 'in_progress',
    lastAccessed: '2024-09-25',
    nextDeadline: '2024-10-01',
    score: 92,
  },
  {
    id: 2,
    title: 'انضباط أجهزة الاتصال اللاسلكي',
    instructor: 'فاطمة علي',
    progress: 60,
    totalModules: 8,
    completedModules: 5,
    status: 'in_progress',
    lastAccessed: '2024-09-24',
    nextDeadline: '2024-10-05',
    score: 85,
  },
  {
    id: 3,
    title: 'أساسيات التحقيق الجنائي',
    instructor: 'محمد السعد',
    progress: 100,
    totalModules: 15,
    completedModules: 15,
    status: 'completed',
    lastAccessed: '2024-09-20',
    nextDeadline: null,
    score: 95,
  },
];

const mockRecommendedCourses = [
  {
    id: 4,
    title: 'إدارة الأزمات والطوارئ',
    instructor: 'خالد المنصوري',
    duration: '20 ساعات',
    level: 'متقدم',
    rating: 4.8,
    enrolledCount: 156,
  },
  {
    id: 5,
    title: 'الأمن السيبراني الأساسي',
    instructor: 'سارة الأحمد',
    duration: '15 ساعات',
    level: 'متوسط',
    rating: 4.6,
    enrolledCount: 89,
  },
  {
    id: 6,
    title: 'إدارة المخاطر الأمنية',
    instructor: 'عبدالله الخالدي',
    duration: '25 ساعات',
    level: 'متقدم',
    rating: 4.9,
    enrolledCount: 203,
  },
];

const mockUpcomingAssessments = [
  {
    id: 1,
    courseTitle: 'إدارة الحشود في المنشآت الرياضية',
    assessmentTitle: 'اختبار نهائي - إدارة الحشود',
    dueDate: '2024-10-01',
    duration: '2 ساعات',
    questions: 50,
    type: 'final_exam',
  },
  {
    id: 2,
    courseTitle: 'انضباط أجهزة الاتصال اللاسلكي',
    assessmentTitle: 'تمرين عملي - تشغيل الأجهزة',
    dueDate: '2024-10-03',
    duration: '1 ساعة',
    questions: 20,
    type: 'practical',
  },
];

export default async function MyLearningPage() {
  const session = await getServerSession();
  const t = await getTranslations();

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('myLearning.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('myLearning.trackYourProgress')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            {t('myLearning.browseCourses')}
          </Button>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title={t('myLearning.enrolledCourses')}
          value={mockLearningStats.enrolledCourses.toString()}
          icon="BookOpen"
        />
        <StatCard
          title={t('myLearning.completedCourses')}
          value={mockLearningStats.completedCourses.toString()}
          icon="CheckCircle"
          variant="success"
        />
        <StatCard
          title={t('myLearning.inProgressCourses')}
          value={mockLearningStats.inProgressCourses.toString()}
          icon="Play"
        />
        <StatCard
          title={t('myLearning.totalHoursLearned')}
          value={`${mockLearningStats.totalHoursLearned}h`}
          icon="Clock"
        />
        <StatCard
          title={t('myLearning.certificatesEarned')}
          value={mockLearningStats.certificatesEarned.toString()}
          icon="Award"
        />
        <StatCard
          title={t('myLearning.averageScore')}
          value={`${mockLearningStats.averageScore}%`}
          icon="TrendingUp"
          trend={{
            value: 5.2,
            label: 'vs last month',
            positive: true,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <CardTitle>{t('myLearning.myCourses')}</CardTitle>
            <CardDescription>
              {t('myLearning.myCoursesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEnrolledCourses.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{course.title}</h3>
                    <Badge variant={
                      course.status === 'completed' ? 'default' :
                      course.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {course.status === 'completed' ? t('myLearning.completed') :
                       course.status === 'in_progress' ? t('myLearning.inProgress') :
                       t('myLearning.notStarted')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {course.instructor} • {course.completedModules}/{course.totalModules} {t('myLearning.modules')}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('myLearning.progress')}</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  {course.nextDeadline && (
                    <div className="flex items-center mt-3 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {t('myLearning.nextDeadline')}: {course.nextDeadline}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm">
                      <span className="font-medium">{t('myLearning.score')}: {course.score}%</span>
                    </div>
                    <Button size="sm">
                      {course.status === 'completed' ? t('myLearning.review') : t('myLearning.continue')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Courses */}
        <Card>
          <CardHeader>
            <CardTitle>{t('myLearning.recommendedCourses')}</CardTitle>
            <CardDescription>
              {t('myLearning.recommendedCoursesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecommendedCourses.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {course.instructor}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span>{course.duration}</span>
                    <Badge variant="outline" className="text-xs">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>{course.rating}</span>
                    </div>
                    <span>{course.enrolledCount} {t('myLearning.enrolled')}</span>
                  </div>
                  <Button size="sm" className="w-full">
                    {t('myLearning.enrollNow')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>{t('myLearning.upcomingAssessments')}</CardTitle>
          <CardDescription>
            {t('myLearning.upcomingAssessmentsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockUpcomingAssessments.map((assessment) => (
              <div key={assessment.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{assessment.assessmentTitle}</h3>
                  <Badge variant="outline" className="text-xs">
                    {assessment.type === 'final_exam' ? t('myLearning.finalExam') : t('myLearning.practical')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {assessment.courseTitle}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('myLearning.dueDate')}:</span>
                    <span className="font-medium">{assessment.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('myLearning.duration')}:</span>
                    <span>{assessment.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('myLearning.questions')}:</span>
                    <span>{assessment.questions}</span>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-4">
                  <Play className="h-3 w-3 mr-1" />
                  {t('myLearning.startAssessment')}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card>
        <CardHeader>
          <CardTitle>{t('myLearning.learningGoals')}</CardTitle>
          <CardDescription>
            {t('myLearning.learningGoalsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold mb-1">3</div>
              <div className="text-sm text-muted-foreground">
                {t('myLearning.coursesThisMonth')}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold mb-1">40h</div>
              <div className="text-sm text-muted-foreground">
                {t('myLearning.hoursThisMonth')}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-lg font-bold mb-1">2</div>
              <div className="text-sm text-muted-foreground">
                {t('myLearning.certificatesThisMonth')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
