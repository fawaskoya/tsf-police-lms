import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressCard } from '@/components/ProgressCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Award,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target
} from 'lucide-react';

export default async function TraineeDashboard() {
  const session = await getServerSession();
  const t = await getTranslations();

  // Mock data - in production this would come from API
  const mockEnrollments = [
    {
      id: 1,
      courseTitle: 'إدارة الحشود في المنشآت الرياضية 101',
      courseTitleEn: 'Crowd Management in Sports Facilities 101',
      progress: 75,
      status: 'in_progress',
      dueDate: '2024-12-31',
      modulesCompleted: 7,
      totalModules: 10,
    },
    {
      id: 2,
      courseTitle: 'انضباط أجهزة الاتصال اللاسلكي',
      courseTitleEn: 'Radio Communication Discipline',
      progress: 100,
      status: 'completed',
      completedDate: '2024-09-15',
      modulesCompleted: 8,
      totalModules: 8,
    },
    {
      id: 3,
      courseTitle: 'سلسلة حيازة الأدلة',
      courseTitleEn: 'Evidence Chain of Custody',
      progress: 0,
      status: 'assigned',
      dueDate: '2025-01-15',
      modulesCompleted: 0,
      totalModules: 12,
    },
  ];

  const mockCertificates = [
    {
      id: 1,
      courseTitle: 'انضباط أجهزة الاتصال اللاسلكي',
      courseTitleEn: 'Radio Communication Discipline',
      issuedDate: '2024-09-15',
      expiresAt: '2025-09-15',
      status: 'valid',
    },
    {
      id: 2,
      courseTitle: 'إدارة الحشود في المنشآت الرياضية 101',
      courseTitleEn: 'Crowd Management in Sports Facilities 101',
      issuedDate: '2024-08-20',
      expiresAt: '2024-11-15',
      status: 'expiring_soon',
    },
  ];

  const mockUpcomingSessions = [
    {
      id: 1,
      title: 'ورشة إدارة الحشود العملية',
      titleEn: 'Crowd Management Practical Workshop',
      date: '2024-12-15',
      time: '09:00 - 17:00',
      location: 'Training Hall A',
      instructor: 'Captain Ahmed Al-Rashid',
    },
    {
      id: 2,
      title: 'تدريب الاتصال اللاسلكي الميداني',
      titleEn: 'Radio Communication Field Training',
      date: '2024-12-18',
      time: '14:00 - 18:00',
      location: 'Field Training Ground',
      instructor: 'Major Fatima Al-Zahra',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'assigned':
        return <Badge variant="secondary">Assigned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCertificateStatus = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="success">Valid</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('navigation.myLearning')}
          </h1>
          <p className="text-muted-foreground">
            Your training progress and learning journey
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">3</div>
            </div>
            <p className="text-xs text-muted-foreground">Enrolled Courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">1</div>
            </div>
            <p className="text-xs text-muted-foreground">Completed Courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">2</div>
            </div>
            <p className="text-xs text-muted-foreground">Certificates Earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">45</div>
            </div>
            <p className="text-xs text-muted-foreground">Hours Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>
            Track your progress in assigned training courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium truncate">{enrollment.courseTitle}</h3>
                    {getStatusBadge(enrollment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {enrollment.courseTitleEn}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{enrollment.modulesCompleted}/{enrollment.totalModules} modules</span>
                    {enrollment.dueDate && (
                      <span>Due: {new Date(enrollment.dueDate).toLocaleDateString()}</span>
                    )}
                    {enrollment.completedDate && (
                      <span>Completed: {new Date(enrollment.completedDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ProgressCard
                    title=""
                    value={enrollment.progress}
                    showPercentage={false}
                    className="w-24 border-0 shadow-none"
                  />
                  <Button size="sm" variant="outline">
                    <Play className="w-4 h-4 mr-1" />
                    {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle>My Certificates</CardTitle>
          <CardDescription>
            Your earned certificates and qualifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCertificates.map((cert) => (
              <div key={cert.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Award className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-medium">{cert.courseTitle}</h3>
                  <p className="text-sm text-muted-foreground">{cert.courseTitleEn}</p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                    <span>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</span>
                    <span>Expires: {new Date(cert.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getCertificateStatus(cert.status)}
                  <Button size="sm" variant="outline">
                    <Award className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>
            Scheduled training sessions and workshops
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUpcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Calendar className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-medium">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.titleEn}</p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                    <span>{session.time}</span>
                    <span>{session.location}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructor: {session.instructor}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Target className="w-4 h-4 mr-1" />
                  Register
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
