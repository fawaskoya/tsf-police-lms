import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  Clock, 
  BookOpen,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default async function TrainingProgramsPage() {
  const session = await getServerSession();
  const t = await getTranslations();

  // Mock data for now - replace with real API call
  const trainingPrograms = [
    {
      id: '1',
      name: 'Police Fundamentals Program',
      description: 'Comprehensive training program covering basic police procedures',
      modules: [
        { course: { titleAr: 'أساسيات الشرطة', titleEn: 'Police Fundamentals', durationMins: 120 } },
        { course: { titleAr: 'الإجراءات الأمنية', titleEn: 'Security Procedures', durationMins: 90 } },
        { course: { titleAr: 'قوانين المرور', titleEn: 'Traffic Laws', durationMins: 60 } },
      ],
      enrollments: { _count: { enrollments: 45 } },
    },
    {
      id: '2',
      name: 'Advanced Security Operations',
      description: 'Advanced training for specialized security operations',
      modules: [
        { course: { titleAr: 'العمليات الأمنية المتقدمة', titleEn: 'Advanced Security Operations', durationMins: 180 } },
        { course: { titleAr: 'إدارة الأزمات', titleEn: 'Crisis Management', durationMins: 120 } },
      ],
      enrollments: { _count: { enrollments: 23 } },
    },
  ];

  const canCreatePrograms = ['admin', 'super_admin'].includes(session?.user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.trainingPrograms')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.individualTraining')}
          </p>
        </div>
        {canCreatePrograms && (
          <Button asChild>
            <Link href="/training-programs/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.createTrainingProgram')}
            </Link>
          </Button>
        )}
      </div>

      {/* Training Programs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trainingPrograms.map((program) => (
          <Card key={program.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {program.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  <Users className="mr-1 h-3 w-3" />
                  {program.enrollments._count.enrollments}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {program.modules.length} {t('common.courses')}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  {program.modules.reduce((total, module) => total + module.course.durationMins, 0)} {t('common.minutes')}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Modules:</h4>
                <div className="space-y-1">
                  {program.modules.slice(0, 2).map((module, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {session?.user?.locale === 'ar' ? module.course.titleAr : module.course.titleEn}
                    </div>
                  ))}
                  {program.modules.length > 2 && (
                    <div className="text-sm text-muted-foreground">
                      • +{program.modules.length - 2} more...
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/training-programs/${program.id}`}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    {t('common.view')}
                  </Link>
                </Button>
                {canCreatePrograms && (
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/training-programs/${program.id}/enroll`}>
                      <Users className="mr-2 h-4 w-4" />
                      {t('dashboard.enrollInProgram')}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trainingPrograms.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.noTrainingPrograms')}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('dashboard.noTrainingProgramsDescription')}
            </p>
            {canCreatePrograms && (
              <Button asChild>
                <Link href="/training-programs/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('dashboard.createTrainingProgram')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
