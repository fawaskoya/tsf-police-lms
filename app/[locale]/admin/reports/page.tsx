import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  Download,
  Calendar,
  Award,
  Target,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';

async function getReportSummary() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/reports/summary`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch report summary');
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error('Error fetching report summary:', error);
    return null;
  }
}

export default async function ReportsPage() {
  const sessionAuth = await getServerSession();
  const t = await getTranslations();

  if (!sessionAuth) {
    return null;
  }

  const summary = await getReportSummary();

  // Fallback data if API fails
  const fallbackStats = {
    overview: {
      totalUsers: 0,
      activeUsers: 0,
      totalCourses: 0,
      publishedCourses: 0,
      totalExams: 0,
      totalSessions: 0,
      totalCertificates: 0,
      totalEnrollments: 0,
    },
    metrics: {
      userGrowth: 0,
      courseCompletionRate: 0,
      examPassRate: 0,
      averageExamScore: 0,
      attendanceRate: 0,
      certificatesIssued: 0,
    },
  };

  const stats = summary || fallbackStats;

  const exportReport = async (type: string, format: string) => {
    const url = `/api/reports/export?type=${type}&format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('reports.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('reports.generateInsights')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => exportReport('summary', 'csv')}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('reports.exportAll')}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title={t('reports.totalUsers')}
          value={stats.overview.totalUsers.toLocaleString()}
          icon="Users"
          trend={{
            value: stats.metrics.userGrowth,
            label: 'new this month',
            positive: true,
          }}
        />
        <StatCard
          title={t('reports.activeUsers')}
          value={stats.overview.activeUsers.toString()}
          icon="TrendingUp"
          trend={{
            value: Math.round((stats.overview.activeUsers / stats.overview.totalUsers) * 100),
            label: '% of total',
            positive: true,
          }}
        />
        <StatCard
          title={t('reports.completionRate')}
          value={`${stats.metrics.courseCompletionRate}%`}
          icon="Target"
          variant="success"
        />
        <StatCard
          title={t('reports.totalCourses')}
          value={stats.overview.totalCourses.toString()}
          icon="BookOpen"
          description={`${stats.overview.publishedCourses} published`}
        />
        <StatCard
          title={t('reports.totalSessions')}
          value={stats.overview.totalSessions.toString()}
          icon="Calendar"
        />
        <StatCard
          title={t('reports.certificatesIssued')}
          value={stats.metrics.certificatesIssued.toString()}
          icon="Award"
          variant="success"
          description="this month"
        />
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="generated" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generated">{t('reports.generatedReports')}</TabsTrigger>
          <TabsTrigger value="scheduled">{t('reports.scheduledReports')}</TabsTrigger>
          <TabsTrigger value="custom">{t('reports.customReports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="generated" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* User Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {t('reports.userReports')}
                </CardTitle>
                <CardDescription>
                  {t('reports.userReportsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('users', 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('reports.exportUsers')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('users', 'pdf')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Course Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  {t('reports.courseReports')}
                </CardTitle>
                <CardDescription>
                  {t('reports.courseReportsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('courses', 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('reports.exportCourses')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('courses', 'pdf')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exam Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  {t('reports.examReports')}
                </CardTitle>
                <CardDescription>
                  {t('reports.examReportsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('exams', 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('reports.exportExams')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('exams', 'pdf')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  {t('reports.certificateReports')}
                </CardTitle>
                <CardDescription>
                  {t('reports.certificateReportsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('certificates', 'csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('reports.exportCertificates')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => exportReport('certificates', 'pdf')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {t('reports.attendanceReports')}
              </CardTitle>
              <CardDescription>
                {t('reports.attendanceReportsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => exportReport('attendance', 'csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('reports.exportAttendance')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {stats.metrics.attendanceRate}% average attendance rate
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.scheduledReports')}</CardTitle>
              <CardDescription>
                {t('reports.scheduledReportsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('reports.noScheduledReports')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('reports.noScheduledReportsDesc')}
                </p>
                <Button>
                  {t('reports.scheduleReport')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.createCustomReport')}</CardTitle>
              <CardDescription>
                {t('reports.createCustomReportDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('reports.reportType')}</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>{t('reports.userActivity')}</option>
                    <option>{t('reports.courseCompletion')}</option>
                    <option>{t('reports.sessionAttendance')}</option>
                    <option>{t('reports.certificateIssuance')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('reports.dateRange')}</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>{t('reports.last7Days')}</option>
                    <option>{t('reports.last30Days')}</option>
                    <option>{t('reports.last3Months')}</option>
                    <option>{t('reports.customRange')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('reports.format')}</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    {t('reports.generateReport')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
