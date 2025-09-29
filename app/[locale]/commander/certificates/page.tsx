import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Download,
  Eye,
  Target
} from 'lucide-react';

// Mock data - in production this would come from API
const mockCertificateStats = {
  departmentCertificates: 756,
  complianceRate: 84.2,
  expiringSoon: 23,
  expiredCertificates: 12,
};

const mockDepartmentStats = [
  {
    department: 'إدارة العمليات',
    totalMembers: 120,
    certifiedMembers: 107,
    complianceRate: 89.2,
    expiringSoon: 8,
    expired: 2,
  },
  {
    department: 'إدارة التحقيقات',
    totalMembers: 85,
    certifiedMembers: 80,
    complianceRate: 94.1,
    expiringSoon: 3,
    expired: 1,
  },
  {
    department: 'إدارة الدوريات',
    totalMembers: 200,
    certifiedMembers: 157,
    complianceRate: 78.5,
    expiringSoon: 12,
    expired: 9,
  },
];

const mockExpiringCertificates = [
  {
    id: 1,
    traineeName: 'أحمد محمد',
    certificateName: 'إدارة الحشود في المنشآت الرياضية',
    expiryDate: '2024-10-15',
    department: 'إدارة العمليات',
    daysUntilExpiry: 15,
  },
  {
    id: 2,
    traineeName: 'فاطمة علي',
    certificateName: 'انضباط أجهزة الاتصال اللاسلكي',
    expiryDate: '2024-10-08',
    department: 'إدارة التحقيقات',
    daysUntilExpiry: 8,
  },
  {
    id: 3,
    traineeName: 'محمد السعد',
    certificateName: 'أساسيات التحقيق الجنائي',
    expiryDate: '2024-10-01',
    department: 'إدارة التحقيقات',
    daysUntilExpiry: 1,
  },
];

export default async function CertificatesPage() {
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
            {t('certificates.departmentCertificates')}
          </h1>
          <p className="text-muted-foreground">
            {t('certificates.monitorCertificationCompliance')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('certificates.exportReport')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('certificates.totalCertificates')}
          value={mockCertificateStats.departmentCertificates.toString()}
          icon="Award"
          trend={{
            value: 8,
            label: 'vs last month',
            positive: true,
          }}
        />
        <StatCard
          title={t('certificates.complianceRate')}
          value={`${mockCertificateStats.complianceRate}%`}
          icon="Target"
          trend={{
            value: 3.2,
            label: 'vs last quarter',
            positive: true,
          }}
        />
        <StatCard
          title={t('certificates.expiringSoon')}
          value={mockCertificateStats.expiringSoon.toString()}
          icon="AlertTriangle"
          variant="warning"
        />
        <StatCard
          title={t('certificates.expiredCertificates')}
          value={mockCertificateStats.expiredCertificates.toString()}
          icon="AlertTriangle"
          variant="destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('certificates.departmentOverview')}</CardTitle>
            <CardDescription>
              {t('certificates.departmentOverviewDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDepartmentStats.map((dept, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{dept.department}</h3>
                    <span className="text-sm font-medium">
                      {dept.complianceRate}%
                    </span>
                  </div>
                  <Progress value={dept.complianceRate} className="mb-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{dept.certifiedMembers}/{dept.totalMembers}</span> {t('certificates.certified')}
                    </div>
                    <div>
                      <span className="font-medium text-yellow-600">{dept.expiringSoon}</span> {t('certificates.expiringSoon')}
                    </div>
                    <div>
                      <span className="font-medium text-red-600">{dept.expired}</span> {t('certificates.expired')}
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                        {t('certificates.viewDetails')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Certificates */}
        <Card>
          <CardHeader>
            <CardTitle>{t('certificates.expiringCertificates')}</CardTitle>
            <CardDescription>
              {t('certificates.expiringCertificatesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockExpiringCertificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Award className={`h-8 w-8 ${
                        cert.daysUntilExpiry <= 7
                          ? 'text-red-500'
                          : cert.daysUntilExpiry <= 30
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{cert.traineeName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cert.certificateName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cert.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {cert.daysUntilExpiry} {t('certificates.daysLeft')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('certificates.expires')}: {cert.expiryDate}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      {t('certificates.renew')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('certificates.complianceActions')}</CardTitle>
          <CardDescription>
            {t('certificates.complianceActionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <AlertTriangle className="h-6 w-6 mb-2 text-yellow-500" />
              <span className="font-medium">{t('certificates.renewalReminders')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('certificates.renewalRemindersDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <CheckCircle className="h-6 w-6 mb-2 text-green-500" />
              <span className="font-medium">{t('certificates.complianceReport')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('certificates.complianceReportDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <TrendingUp className="h-6 w-6 mb-2 text-blue-500" />
              <span className="font-medium">{t('certificates.trainingGaps')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('certificates.trainingGapsDesc')}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
