import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { ProgressCard } from '@/components/ProgressCard';
import { Heatmap } from '@/components/Heatmap';
import { Button } from '@/components/ui/button';
import {
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Download,
  Target,
  CheckCircle,
  Clock
} from 'lucide-react';

export default async function CommanderDashboard() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations();

  // Mock data - in production this would come from API filtered by commander's unit
  const mockStats = {
    unitTrainees: 45,
    unitCompletionRate: 82.3,
    unitOverdueCerts: 3,
    unitPassRate: 88.7,
  };

  const mockUnitData = [
    { name: 'Stadium Ops', completion: 85, overdue: 2, total: 15 },
    { name: 'Traffic Control', completion: 78, overdue: 1, total: 12 },
    { name: 'K9 Unit', completion: 92, overdue: 0, total: 8 },
    { name: 'Cyber Security', completion: 76, overdue: 1, total: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('navigation.compliance')} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Unit compliance overview and training status
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Unit KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unit Trainees"
          value={mockStats.unitTrainees}
          icon="Users"
          description="Active personnel in unit"
        />
        <StatCard
          title="Completion Rate"
          value={`${mockStats.unitCompletionRate}%`}
          icon="TrendingUp"
          trend={{
            value: 5.2,
            label: 'vs last month',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title="Overdue Certificates"
          value={mockStats.unitOverdueCerts}
          icon="AlertTriangle"
          trend={{
            value: -2,
            label: 'vs last month',
            positive: true,
          }}
          variant="warning"
        />
        <StatCard
          title="Exam Pass Rate"
          value={`${mockStats.unitPassRate}%`}
          icon="Target"
          trend={{
            value: 3.1,
            label: 'vs last month',
            positive: true,
          }}
          variant="success"
        />
      </div>

      {/* Unit Performance Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unit Training Completion</CardTitle>
            <CardDescription>
              Training progress by unit section
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUnitData.map((unit) => (
              <div key={unit.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{unit.name}</span>
                  <span className="text-muted-foreground">
                    {unit.completion}% ({unit.total - unit.overdue}/{unit.total} completed)
                  </span>
                </div>
                <ProgressCard
                  title=""
                  value={unit.completion}
                  description={`${unit.overdue} overdue`}
                  showPercentage={false}
                  color={unit.overdue > 0 ? 'warning' : 'success'}
                  className="border-0 shadow-none"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Heatmap</CardTitle>
            <CardDescription>
              Training compliance across unit personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap />
          </CardContent>
        </Card>
      </div>

      {/* Overdue Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Personnel Requiring Attention</CardTitle>
          <CardDescription>
            Personnel with overdue certifications or low compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Officer Ahmed Al-Mansoori</p>
                  <p className="text-sm text-muted-foreground">Crowd Management Certificate expired 15 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-red-600 font-medium">Overdue</span>
                <Button size="sm" variant="outline">
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Officer Fatima Al-Zahra</p>
                  <p className="text-sm text-muted-foreground">Radio Communication training incomplete (75%)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-yellow-600 font-medium">In Progress</span>
                <Button size="sm" variant="outline">
                  View Progress
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Officer Khalid Al-Rashid</p>
                  <p className="text-sm text-muted-foreground">Evidence Chain Certificate expires in 30 days</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-orange-600 font-medium">Expiring Soon</span>
                <Button size="sm" variant="outline">
                  Schedule Renewal
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Training Reports</CardTitle>
            <CardDescription>
              Generate compliance and training reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unit Statistics</CardTitle>
            <CardDescription>
              View detailed unit performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Target className="mr-2 h-4 w-4" />
              View Statistics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Certification Tracking</CardTitle>
            <CardDescription>
              Monitor certification expiry dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <Award className="mr-2 h-4 w-4" />
              Track Certificates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
