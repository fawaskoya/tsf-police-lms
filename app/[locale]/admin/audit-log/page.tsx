import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  User,
  FileText,
  Settings
} from 'lucide-react';

// Mock data - in production this would come from API
const mockAuditStats = {
  totalEvents: 15420,
  todayEvents: 89,
  securityEvents: 156,
  userActions: 14264,
};

const mockAuditLogs = [
  {
    id: 1,
    timestamp: '2024-09-25 14:30:15',
    user: 'أحمد محمد',
    action: 'user_login',
    resource: 'authentication',
    details: 'Successful login from IP 192.168.1.100',
    severity: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 118.0.0.0',
  },
  {
    id: 2,
    timestamp: '2024-09-25 14:25:30',
    user: 'فاطمة علي',
    action: 'course_created',
    resource: 'courses',
    details: 'Created new course: إدارة الحشود في المنشآت الرياضية',
    severity: 'info',
    ipAddress: '192.168.1.105',
    userAgent: 'Firefox 118.0.0.0',
  },
  {
    id: 3,
    timestamp: '2024-09-25 14:20:45',
    user: 'محمد السعد',
    action: 'certificate_issued',
    resource: 'certificates',
    details: 'Issued certificate CERT-2024-001 to أحمد محمد',
    severity: 'info',
    ipAddress: '192.168.1.110',
    userAgent: 'Safari 17.0',
  },
  {
    id: 4,
    timestamp: '2024-09-25 14:15:20',
    user: 'سارة الأحمد',
    action: 'failed_login',
    resource: 'authentication',
    details: 'Failed login attempt - invalid password',
    severity: 'warning',
    ipAddress: '192.168.1.120',
    userAgent: 'Chrome 118.0.0.0',
  },
  {
    id: 5,
    timestamp: '2024-09-25 14:10:10',
    user: 'خالد المنصوري',
    action: 'settings_changed',
    resource: 'system_settings',
    details: 'Updated notification settings',
    severity: 'info',
    ipAddress: '192.168.1.125',
    userAgent: 'Edge 118.0.0.0',
  },
];

export default async function AuditLogPage() {
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
            {t('auditLog.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('auditLog.monitorSystemActivity')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filter')}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('auditLog.exportLogs')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('auditLog.totalEvents')}
          value={mockAuditStats.totalEvents.toLocaleString()}
          icon="Shield"
        />
        <StatCard
          title={t('auditLog.todayEvents')}
          value={mockAuditStats.todayEvents.toString()}
          icon="FileText"
          trend={{
            value: 12,
            label: 'vs yesterday',
            positive: true,
          }}
        />
        <StatCard
          title={t('auditLog.securityEvents')}
          value={mockAuditStats.securityEvents.toString()}
          icon="AlertTriangle"
          variant="warning"
        />
        <StatCard
          title={t('auditLog.userActions')}
          value={mockAuditStats.userActions.toLocaleString()}
          icon="User"
          trend={{
            value: 8.5,
            label: 'this week',
            positive: true,
          }}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('auditLog.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auditLog.dateRange')}</label>
              <Select defaultValue="today">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t('auditLog.today')}</SelectItem>
                  <SelectItem value="yesterday">{t('auditLog.yesterday')}</SelectItem>
                  <SelectItem value="last7days">{t('auditLog.last7Days')}</SelectItem>
                  <SelectItem value="last30days">{t('auditLog.last30Days')}</SelectItem>
                  <SelectItem value="custom">{t('auditLog.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auditLog.user')}</label>
              <Input placeholder={t('auditLog.searchUser')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auditLog.action')}</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.allActions')}</SelectItem>
                  <SelectItem value="user_login">{t('auditLog.login')}</SelectItem>
                  <SelectItem value="course_created">{t('auditLog.courseCreated')}</SelectItem>
                  <SelectItem value="certificate_issued">{t('auditLog.certificateIssued')}</SelectItem>
                  <SelectItem value="settings_changed">{t('auditLog.settingsChanged')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auditLog.severity')}</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.allSeverities')}</SelectItem>
                  <SelectItem value="info">{t('auditLog.info')}</SelectItem>
                  <SelectItem value="warning">{t('auditLog.warning')}</SelectItem>
                  <SelectItem value="error">{t('auditLog.error')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>{t('auditLog.auditLogEntries')}</CardTitle>
          <CardDescription>
            {t('auditLog.auditLogEntriesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAuditLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {log.severity === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    ) : log.severity === 'error' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{log.user}</span>
                      <Badge variant={
                        log.severity === 'warning' ? 'secondary' :
                        log.severity === 'error' ? 'destructive' : 'default'
                      } className="text-xs">
                        {log.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {log.details}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{log.timestamp}</span>
                      <span>•</span>
                      <span>{log.action.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{log.resource}</span>
                      <span>•</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    {t('common.details')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('auditLog.recentSecurityEvents')}</CardTitle>
            <CardDescription>
              {t('auditLog.recentSecurityEventsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">{t('auditLog.failedLoginAttempts')}</span>
                </div>
                <Badge variant="destructive">12</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{t('auditLog.suspiciousActivity')}</span>
                </div>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{t('auditLog.successfulLogins')}</span>
                </div>
                <Badge variant="default">245</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('auditLog.auditLogSettings')}</CardTitle>
            <CardDescription>
              {t('auditLog.auditLogSettingsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">{t('auditLog.enableDetailedLogging')}</label>
                  <p className="text-xs text-muted-foreground">
                    {t('auditLog.enableDetailedLoggingDesc')}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">{t('auditLog.logIPAddresses')}</label>
                  <p className="text-xs text-muted-foreground">
                    {t('auditLog.logIPAddressesDesc')}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">{t('auditLog.logUserAgents')}</label>
                  <p className="text-xs text-muted-foreground">
                    {t('auditLog.logUserAgentsDesc')}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <Button className="w-full">
                {t('auditLog.saveSettings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
