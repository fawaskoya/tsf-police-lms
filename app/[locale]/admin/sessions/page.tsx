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
  Plus,
  MapPin,
  Video,
  UserCheck
} from 'lucide-react';
import { db } from '@/lib/db';

async function getSessionStats() {
  const now = new Date();

  // Get total sessions
  const totalSessions = await db.session.count();

  // Get upcoming sessions (starts after now)
  const upcomingSessions = await db.session.count({
    where: { startsAt: { gte: now } },
  });

  // Get completed sessions (ended before now)
  const completedSessions = await db.session.count({
    where: { endsAt: { lt: now } },
  });

  // Get active participants (unique users with attendance records)
  const activeParticipants = await db.attendance.findMany({
    select: { userId: true },
    distinct: ['userId'],
  });

  return {
    totalSessions,
    upcomingSessions,
    completedSessions,
    activeParticipants: activeParticipants.length,
  };
}

async function getUpcomingSessions() {
  const now = new Date();

  const sessions = await db.session.findMany({
    where: { startsAt: { gte: now } },
    include: {
      course: {
        select: { titleAr: true, titleEn: true },
      },
      instructor: {
        select: { firstName: true, lastName: true },
      },
      _count: {
        select: { attendance: true },
      },
    },
    orderBy: { startsAt: 'asc' },
    take: 10,
  });

  return sessions.map(session => ({
    id: session.id,
    title: session.titleAr,
    titleEn: session.titleEn,
    instructor: `${session.instructor.firstName} ${session.instructor.lastName}`,
    date: session.startsAt.toISOString().split('T')[0],
    time: session.startsAt.toTimeString().slice(0, 5),
    duration: `${Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / (1000 * 60))} minutes`,
    location: session.room || 'TBD',
    participants: session._count.attendance,
    maxParticipants: session.capacity,
    mode: session.mode,
  }));
}

export default async function SessionsPage() {
  const sessionAuth = await getServerSession();
  const t = await getTranslations();

  if (!sessionAuth) {
    return null;
  }

  const stats = await getSessionStats();
  const upcomingSessions = await getUpcomingSessions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('sessions.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('sessions.manageSessions')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('sessions.newSession')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('sessions.totalSessions')}
          value={stats.totalSessions.toString()}
          icon="Calendar"
          trend={{
            value: 8,
            label: 'vs last month',
            positive: true,
          }}
        />
        <StatCard
          title={t('sessions.upcomingSessions')}
          value={stats.upcomingSessions.toString()}
          icon="Clock"
          trend={{
            value: 15,
            label: 'vs last month',
            positive: true,
          }}
        />
        <StatCard
          title={t('sessions.completedSessions')}
          value={stats.completedSessions.toString()}
          icon="CheckCircle"
          trend={{
            value: 12,
            label: 'vs last month',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('sessions.activeParticipants')}
          value={stats.activeParticipants.toLocaleString()}
          icon="Users"
          trend={{
            value: 5.2,
            label: 'vs last month',
            positive: true,
          }}
        />
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sessions.upcomingSessions')}</CardTitle>
          <CardDescription>
            {t('sessions.upcomingSessionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('sessions.noUpcomingSessions')}</p>
              <p className="text-sm">{t('sessions.createFirstSession')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {session.mode === 'CLASSROOM' ? (
                        <MapPin className="h-8 w-8 text-blue-500" />
                      ) : (
                        <Video className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">{session.titleEn}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.instructor} • {session.date} • {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {session.duration}
                      </p>
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
                    <Button variant="outline" size="sm">
                      {t('common.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
