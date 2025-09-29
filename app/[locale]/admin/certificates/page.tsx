import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus
} from 'lucide-react';

// Mock data - in production this would come from API
const mockCertificateStats = {
  totalCertificates: 1247,
  issuedThisMonth: 89,
  pendingApproval: 23,
  expiredCertificates: 45,
};

const mockCertificates = [
  {
    id: 1,
    traineeName: 'أحمد محمد',
    courseName: 'إدارة الحشود في المنشآت الرياضية',
    issueDate: '2024-09-15',
    expiryDate: '2027-09-15',
    status: 'active',
    certificateId: 'CERT-2024-001',
    score: 95,
  },
  {
    id: 2,
    traineeName: 'فاطمة علي',
    courseName: 'انضباط أجهزة الاتصال اللاسلكي',
    issueDate: '2024-09-10',
    expiryDate: '2027-09-10',
    status: 'active',
    certificateId: 'CERT-2024-002',
    score: 92,
  },
  {
    id: 3,
    traineeName: 'محمد السعد',
    courseName: 'أساسيات التحقيق الجنائي',
    issueDate: '2024-08-20',
    expiryDate: '2027-08-20',
    status: 'expiring_soon',
    certificateId: 'CERT-2024-003',
    score: 88,
  },
  {
    id: 4,
    traineeName: 'سارة الأحمد',
    courseName: 'إدارة الأزمات والطوارئ',
    issueDate: '2024-09-01',
    expiryDate: '2024-09-01',
    status: 'pending',
    certificateId: 'CERT-2024-004',
    score: 91,
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
            {t('certificates.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('certificates.manageCertificates')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filter')}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('certificates.issueCertificate')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('certificates.totalCertificates')}
          value={mockCertificateStats.totalCertificates.toString()}
          icon="Award"
          trend={{
            value: 12,
            label: 'vs last month',
            positive: true,
          }}
        />
        <StatCard
          title={t('certificates.issuedThisMonth')}
          value={mockCertificateStats.issuedThisMonth.toString()}
          icon="CheckCircle"
          trend={{
            value: 8,
            label: 'vs last month',
            positive: true,
          }}
          variant="success"
        />
        <StatCard
          title={t('certificates.pendingApproval')}
          value={mockCertificateStats.pendingApproval.toString()}
          icon="Clock"
          variant="warning"
        />
        <StatCard
          title={t('certificates.expiredCertificates')}
          value={mockCertificateStats.expiredCertificates.toString()}
          icon="AlertTriangle"
          variant="destructive"
        />
      </div>

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('certificates.allCertificates')}</CardTitle>
          <CardDescription>
            {t('certificates.allCertificatesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCertificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Award className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{cert.traineeName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cert.courseName}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {t('certificates.certificateId')}: {cert.certificateId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('certificates.score')}: {cert.score}%
                      </span>
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {t('certificates.issued')}: {cert.issueDate}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('certificates.expires')}: {cert.expiryDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    cert.status === 'active' ? 'default' :
                    cert.status === 'expiring_soon' ? 'secondary' :
                    cert.status === 'expired' ? 'destructive' : 'outline'
                  }>
                    {cert.status === 'active' ? t('certificates.active') :
                     cert.status === 'expiring_soon' ? t('certificates.expiringSoon') :
                     cert.status === 'expired' ? t('certificates.expired') :
                     t('certificates.pending')}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      {t('common.view')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      {t('certificates.download')}
                    </Button>
                    {cert.status === 'pending' && (
                      <Button size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('certificates.approve')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('certificates.bulkActions')}</CardTitle>
          <CardDescription>
            {t('certificates.bulkActionsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Download className="h-6 w-6 mb-2 text-blue-500" />
              <span className="font-medium">{t('certificates.bulkDownload')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('certificates.bulkDownloadDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <CheckCircle className="h-6 w-6 mb-2 text-green-500" />
              <span className="font-medium">{t('certificates.bulkApprove')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('certificates.bulkApproveDesc')}
              </span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <AlertTriangle className="h-6 w-6 mb-2 text-red-500" />
              <span className="font-medium">{t('certificates.bulkRevoke')}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {t('certificates.bulkRevokeDesc')}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
