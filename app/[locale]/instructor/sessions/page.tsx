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
  Play,
  BookOpen,
  Video,
  UserCheck
} from 'lucide-react';

// Mock data - in production this would come from API
const mockStats = {
  mySessions: 24,
  upcomingSessions: 5,
  completedSessions: 19,
  totalParticipants: 487,
};

const mockMySessions = [
  {
    id: 1,
    title: 'إدارة الحشود في المنشآت الرياضية',
    date: '2024-09-28',
    time: '09:00',
    duration: '2 ساعات',
    location: 'قاعة التدريب الرئيسية',
    participants: 45,
    maxParticipants: 50,
    status: 'upcoming',
    type: 'classroom',
  },
  {
    id: 2,
    title: 'انضباط أجهزة الاتصال اللاسلكي',
    date: '2024-09-25',
    time: '14:00',
    duration: '3 ساعات',
    location: 'قاعة التدريب الثانوية',
    participants: 32,
    maxParticipants: 40,
    status: 'completed',
    type: 'classroom',
  },
  {
    id: 3,
    title: 'أساسيات التحقيق الجنائي',
    date: '2024-09-30',
    time: '10:00',
    duration: '4 ساعات',
    location: 'غرفة الاجتماعات',
    participants: 28,
    maxParticipants: 35,
    status: 'upcoming',
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
            {t('sessions.manageMySessions')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            {t('sessions.scheduleSession')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('sessions.mySessions')}
          value={mockStats.mySessions.toString()}
          icon="Calendar"
          trend={{
            value: 15,
            label: 'this month',
            positive: true,
          }}
        />
        <StatCard
          title={t('sessions.upcomingSessions')}
          value={mockStats.upcomingSessions.toString()}
          icon="Clock"
          trend={{
            value: 3,
            label: 'this week',
            positive: false,
          }}
        />
        <StatCard
          title={t('sessions.completedSessions')}
          value={mockStats.completedSessions.toString()}
          icon="CheckCircle"
          trend={{
            value: 12,
            label: 'this month',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('sessions.totalParticipants')}
          value={mockStats.totalParticipants.toString()}
          icon="Users"
          trend={{
            value: 8.7,
            label: 'this month',
            positive: true,
          }}
        />
      </div>

      {/* My Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sessions.mySessions')}</CardTitle>
          <CardDescription>
            {t('sessions.mySessionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMySessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {session.type === 'classroom' ? (
                      <Users className="h-8 w-8 text-blue-500" />
                    ) : (
                      <Video className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {session.date} • {session.time} • {session.duration}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.location}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status === 'completed' ? t('sessions.completed') : t('sessions.upcoming')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="flex items-center text-sm">
                      <UserCheck className="h-4 w-4 mr-1" />
                      {session.participants}/{session.maxParticipants}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((session.participants / session.maxParticipants) * 100)}% {t('sessions.capacity')}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {session.status === 'upcoming' ? (
                      <>
                        <Button variant="outline" size="sm">
                          <Play className="h-3 w-3 mr-1" />
                          {t('sessions.start')}
                        </Button>
                        <Button variant="ghost" size="sm">
                          {t('common.edit')}
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {t('sessions.viewReport')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
