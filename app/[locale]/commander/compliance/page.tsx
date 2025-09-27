import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Award
} from 'lucide-react';

// Mock data - in production this would come from API
const mockComplianceStats = {
  overallCompliance: 84.2,
  mandatoryTrainingCompletion: 91.8,
  departmentsCompliant: 7,
  totalDepartments: 10,
  overdueTrainings: 23,
  upcomingDeadlines: 15,
};

const mockMandatoryTrainings = [
  {
    id: 1,
    title: 'دورة مكافحة الإرهاب والتطرف',
    category: 'أمن قومي',
    frequency: 'سنوي',
    lastUpdated: '2024-01-15',
    complianceRate: 95.2,
    totalRequired: 500,
    completed: 476,
    status: 'excellent',
  },
  {
    id: 2,
    title: 'إدارة الأزمات والطوارئ',
    category: 'استجابة طوارئ',
    frequency: 'كل سنتين',
    lastUpdated: '2023-08-20',
    complianceRate: 87.3,
    totalRequired: 350,
    completed: 306,
    status: 'good',
  },
  {
    id: 3,
    title: 'حماية المعلومات السرية',
    category: 'أمن معلومات',
    frequency: 'سنوي',
    lastUpdated: '2024-03-10',
    complianceRate: 78.9,
    totalRequired: 420,
    completed: 331,
    status: 'needs_attention',
  },
  {
    id: 4,
    title: 'التعامل مع الجمهور',
    category: 'خدمة العملاء',
    frequency: 'كل 18 شهر',
    lastUpdated: '2023-12-05',
    complianceRate: 92.1,
    totalRequired: 280,
    completed: 258,
    status: 'excellent',
  },
];

const mockDepartmentCompliance = [
  {
    department: 'إدارة العمليات',
    manager: 'العقيد أحمد محمد',
    totalPersonnel: 120,
    compliantPersonnel: 107,
    complianceRate: 89.2,
    overdueTrainings: 8,
    upcomingDeadlines: 5,
    lastAudit: '2024-09-15',
    nextAudit: '2024-12-15',
  },
  {
    department: 'إدارة التحقيقات',
    manager: 'المقدم فاطمة علي',
    totalPersonnel: 85,
    compliantPersonnel: 80,
    complianceRate: 94.1,
    overdueTrainings: 3,
    upcomingDeadlines: 2,
    lastAudit: '2024-09-10',
    nextAudit: '2024-12-10',
  },
  {
    department: 'إدارة الدوريات',
    manager: 'الرائد محمد السعد',
    totalPersonnel: 200,
    compliantPersonnel: 157,
    complianceRate: 78.5,
    overdueTrainings: 12,
    upcomingDeadlines: 8,
    lastAudit: '2024-09-05',
    nextAudit: '2024-12-05',
  },
];

const mockComplianceAlerts = [
  {
    id: 1,
    type: 'overdue',
    department: 'إدارة الدوريات',
    training: 'حماية المعلومات السرية',
    affectedPersonnel: 12,
    severity: 'high',
    deadline: '2024-09-30',
  },
  {
    id: 2,
    type: 'expiring',
    department: 'إدارة العمليات',
    training: 'التعامل مع الجمهور',
    affectedPersonnel: 8,
    severity: 'medium',
    deadline: '2024-10-15',
  },
  {
    id: 3,
    type: 'gap',
    department: 'إدارة الطوارئ',
    training: 'إدارة الكوارث الطبيعية',
    affectedPersonnel: 25,
    severity: 'medium',
    deadline: '2024-11-01',
  },
];

export default async function CompliancePage() {
  const session = await getServerSession(authOptions);
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
            {t('compliance.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('compliance.monitorDepartmentalCompliance')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            {t('compliance.generateReport')}
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            {t('compliance.scheduleAudit')}
          </Button>
        </div>
      </div>

      {/* Compliance Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title={t('compliance.overallCompliance')}
          value={`${mockComplianceStats.overallCompliance}%`}
          icon="Target"
          trend={{
            value: 3.2,
            label: 'vs last quarter',
            positive: true,
          }}
        />
        <StatCard
          title={t('compliance.mandatoryTrainingCompletion')}
          value={`${mockComplianceStats.mandatoryTrainingCompletion}%`}
          icon="CheckCircle"
          trend={{
            value: 5.1,
            label: 'vs last quarter',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('compliance.departmentsCompliant')}
          value={`${mockComplianceStats.departmentsCompliant}/${mockComplianceStats.totalDepartments}`}
          icon="Users"
        />
        <StatCard
          title={t('compliance.overdueTrainings')}
          value={mockComplianceStats.overdueTrainings.toString()}
          icon="AlertTriangle"
          variant="warning"
        />
        <StatCard
          title={t('compliance.upcomingDeadlines')}
          value={mockComplianceStats.upcomingDeadlines.toString()}
          icon="Calendar"
        />
        <StatCard
          title={t('compliance.activeAudits')}
          value="3"
          icon="FileText"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mandatory Training Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('compliance.mandatoryTrainingPrograms')}</CardTitle>
            <CardDescription>
              {t('compliance.mandatoryTrainingProgramsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMandatoryTrainings.map((training) => (
                <div key={training.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{training.title}</h3>
                    <Badge variant={
                      training.status === 'excellent' ? 'default' :
                      training.status === 'good' ? 'secondary' : 'destructive'
                    }>
                      {training.complianceRate}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {training.category} • {training.frequency} • {t('compliance.lastUpdated')}: {training.lastUpdated}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('compliance.completion')}</span>
                      <span>{training.completed}/{training.totalRequired}</span>
                    </div>
                    <Progress value={training.complianceRate} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <Button variant="outline" size="sm">
                      {t('compliance.viewDetails')}
                    </Button>
                    <Button variant="outline" size="sm">
                      {t('compliance.updateRequirements')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('compliance.departmentComplianceStatus')}</CardTitle>
            <CardDescription>
              {t('compliance.departmentComplianceStatusDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDepartmentCompliance.map((dept, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{dept.department}</h3>
                    <span className="text-sm font-medium">
                      {dept.complianceRate}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {dept.manager}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                    <div>
                      <span className="font-medium">{dept.compliantPersonnel}/{dept.totalPersonnel}</span> {t('compliance.compliant')}
                    </div>
                    <div>
                      <span className="font-medium text-red-600">{dept.overdueTrainings}</span> {t('compliance.overdue')}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>{t('compliance.lastAudit')}: {dept.lastAudit}</div>
                    <div>{t('compliance.nextAudit')}: {dept.nextAudit}</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    {t('compliance.viewDepartmentReport')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('compliance.complianceAlerts')}</CardTitle>
          <CardDescription>
            {t('compliance.complianceAlertsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockComplianceAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 border rounded-lg ${
                alert.severity === 'high' ? 'border-red-200 bg-red-50' :
                alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`h-4 w-4 ${
                      alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <span className="font-medium">{alert.department}</span>
                  </div>
                  <Badge variant={
                    alert.type === 'overdue' ? 'destructive' :
                    alert.type === 'expiring' ? 'secondary' : 'outline'
                  }>
                    {alert.type === 'overdue' ? t('compliance.overdue') :
                     alert.type === 'expiring' ? t('compliance.expiring') :
                     t('compliance.gap')}
                  </Badge>
                </div>
                <p className="text-sm mb-2">
                  <span className="font-medium">{alert.training}</span>
                  {alert.type === 'overdue' && ` - ${t('compliance.overdueBy')} ${alert.affectedPersonnel} ${t('compliance.personnel')}`}
                  {alert.type === 'expiring' && ` - ${t('compliance.expiringFor')} ${alert.affectedPersonnel} ${t('compliance.personnel')}`}
                  {alert.type === 'gap' && ` - ${t('compliance.missingFor')} ${alert.affectedPersonnel} ${t('compliance.personnel')}`}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('compliance.deadline')}: {alert.deadline}
                  </span>
                  <Button size="sm" variant={alert.severity === 'high' ? 'default' : 'outline'}>
                    {t('compliance.takeAction')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('compliance.complianceActions')}</CardTitle>
          <CardDescription>
            {t('compliance.complianceActionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <FileText className="h-6 w-6 mb-2 text-blue-500" />
              <span className="font-medium">{t('compliance.generateComplianceReport')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('compliance.generateComplianceReportDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Users className="h-6 w-6 mb-2 text-green-500" />
              <span className="font-medium">{t('compliance.scheduleTraining')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('compliance.scheduleTrainingDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Target className="h-6 w-6 mb-2 text-purple-500" />
              <span className="font-medium">{t('compliance.setComplianceTargets')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('compliance.setComplianceTargetsDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Award className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="font-medium">{t('compliance.certificationTracking')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('compliance.certificationTrackingDesc')}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
