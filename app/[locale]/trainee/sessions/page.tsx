import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  UserPlus,
  MapPin,
  Video,
  Award
} from 'lucide-react';

// Mock data - in production this would come from API
const mockStats = {
  enrolledSessions: 8,
  completedSessions: 5,
  upcomingSessions: 3,
  availableSessions: 12,
};

const mockMySessions = [
  {
    id: 1,
    title: 'إدارة الحشود في المنشآت الرياضية',
    instructor: 'أحمد محمد',
    date: '2024-09-28',
    time: '09:00',
    duration: '2 ساعات',
    location: 'قاعة التدريب الرئيسية',
    status: 'enrolled',
    type: 'classroom',
    certificate: false,
  },
  {
    id: 2,
    title: 'انضباط أجهزة الاتصال اللاسلكي',
    instructor: 'فاطمة علي',
    date: '2024-09-25',
    time: '14:00',
    duration: '3 ساعات',
    location: 'قاعة التدريب الثانوية',
    status: 'completed',
    type: 'classroom',
    certificate: true,
  },
  {
    id: 3,
    title: 'أساسيات التحقيق الجنائي',
    instructor: 'محمد السعد',
    date: '2024-09-30',
    time: '10:00',
    duration: '4 ساعات',
    location: 'غرفة الاجتماعات',
    status: 'enrolled',
    type: 'online',
    certificate: false,
  },
];

const mockAvailableSessions = [
  {
    id: 4,
    title: 'إدارة الأزمات والطوارئ',
    instructor: 'خالد المنصوري',
    date: '2024-10-05',
    time: '09:00',
    duration: '3 ساعات',
    location: 'قاعة التدريب الرئيسية',
    spots: 15,
    type: 'classroom',
  },
  {
    id: 5,
    title: 'الأمن السيبراني الأساسي',
    instructor: 'سارة الأحمد',
    date: '2024-10-08',
    time: '14:00',
    duration: '2 ساعات',
    location: 'قاعة التدريب الثانوية',
    spots: 8,
    type: 'online',
  },
];

export default async function SessionsPage() {
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
            {t('sessions.mySessions')}
          </h1>
          <p className="text-muted-foreground">
            {t('sessions.trackMyProgress')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {t('sessions.browseSessions')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('sessions.enrolledSessions')}
          value={mockStats.enrolledSessions.toString()}
          icon="Calendar"
          trend={{
            value: 2,
            label: 'this month',
            positive: true,
          }}
        />
        <StatCard
          title={t('sessions.completedSessions')}
          value={mockStats.completedSessions.toString()}
          icon="CheckCircle"
          trend={{
            value: 1,
            label: 'this week',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('sessions.upcomingSessions')}
          value={mockStats.upcomingSessions.toString()}
          icon="Clock"
          trend={{
            value: 1,
            label: 'this week',
            positive: false,
          }}
        />
        <StatCard
          title={t('sessions.availableSessions')}
          value={mockStats.availableSessions.toString()}
          icon="UserPlus"
          trend={{
            value: 5,
            label: 'this month',
            positive: true,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.myEnrolledSessions')}</CardTitle>
            <CardDescription>
              {t('sessions.myEnrolledSessionsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMySessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {session.type === 'classroom' ? (
                        <MapPin className="h-8 w-8 text-blue-500" />
                      ) : (
                        <Video className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.instructor} • {session.date} • {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.duration}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {session.status === 'completed' ? t('sessions.completed') : t('sessions.enrolled')}
                        </span>
                        {session.certificate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Award className="h-3 w-3 mr-1" />
                            {t('sessions.certificateEarned')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {session.status === 'enrolled' ? (
                      <Button variant="outline" size="sm">
                        {t('sessions.joinSession')}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Award className="h-3 w-3 mr-1" />
                        {t('sessions.viewCertificate')}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      {t('common.details')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessions.availableSessions')}</CardTitle>
            <CardDescription>
              {t('sessions.availableSessionsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAvailableSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {session.type === 'classroom' ? (
                        <MapPin className="h-8 w-8 text-blue-500" />
                      ) : (
                        <Video className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.instructor} • {session.date} • {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.duration}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {session.spots} {t('sessions.spotsAvailable')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm">
                    <UserPlus className="h-3 w-3 mr-1" />
                    {t('sessions.enroll')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
