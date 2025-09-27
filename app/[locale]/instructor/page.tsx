import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  Plus,
  GraduationCap,
  Clock,
  CheckCircle
} from 'lucide-react';

export default async function InstructorDashboard() {
  const session = await getServerSession(authOptions);

  // Mock data - in production this would come from API
  const mockStats = {
    myCourses: 3,
    totalStudents: 127,
    upcomingSessions: 4,
    pendingGrading: 8,
  };

  const mockCourses = [
    {
      id: 1,
      title: 'إدارة الحشود في المنشآت الرياضية 101',
      titleEn: 'Crowd Management in Sports Facilities 101',
      enrolled: 45,
      completed: 32,
      status: 'active',
    },
    {
      id: 2,
      title: 'انضباط أجهزة الاتصال اللاسلكي',
      titleEn: 'Radio Communication Discipline',
      enrolled: 38,
      completed: 28,
      status: 'active',
    },
    {
      id: 3,
      title: 'سلسلة حيازة الأدلة',
      titleEn: 'Evidence Chain of Custody',
      enrolled: 44,
      completed: 18,
      status: 'draft',
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
      enrolled: 25,
      capacity: 25,
    },
    {
      id: 2,
      title: 'تدريب الاتصال اللاسلكي الميداني',
      titleEn: 'Radio Communication Field Training',
      date: '2024-12-18',
      time: '14:00 - 18:00',
      location: 'Field Training Ground',
      enrolled: 20,
      capacity: 25,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your courses and training sessions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Courses"
          value={mockStats.myCourses}
          icon="BookOpen"
        />
        <StatCard
          title="Total Students"
          value={mockStats.totalStudents}
          icon="Users"
        />
        <StatCard
          title="Upcoming Sessions"
          value={mockStats.upcomingSessions}
          icon="Calendar"
        />
        <StatCard
          title="Pending Grading"
          value={mockStats.pendingGrading}
          icon="FileText"
          variant="warning"
        />
      </div>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>
            Courses you're teaching and their progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">{course.titleEn}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span>{course.enrolled} enrolled</span>
                    <span>{course.completed} completed</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      course.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    View Students
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="w-4 h-4 mr-1" />
                    Edit Course
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
            Training sessions you're scheduled to conduct
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUpcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.titleEn}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                    <span>{session.time}</span>
                    <span>{session.location}</span>
                    <span>{session.enrolled}/{session.capacity} enrolled</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Users className="w-4 h-4 mr-1" />
                    View Attendees
                  </Button>
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Start Session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Builder</CardTitle>
            <CardDescription>
              Create and edit course content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <BookOpen className="mr-2 h-4 w-4" />
              Open Course Builder
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Progress</CardTitle>
            <CardDescription>
              Monitor student learning progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              View Progress Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assessment Tools</CardTitle>
            <CardDescription>
              Create and grade assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Manage Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
