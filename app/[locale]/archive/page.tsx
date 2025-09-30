import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Archive, 
  Search,
  Download,
  Restore,
  Calendar,
  User,
  FileText,
  BookOpen,
  HelpCircle
} from 'lucide-react';

export default async function ArchivePage() {
  const session = await getServerSession();
  const t = await getTranslations();

  // Mock data for now - replace with real API call
  const archives = [
    {
      id: '1',
      entityType: 'course',
      entityId: 'course-123',
      version: '2.1',
      reason: 'Updated content based on new regulations',
      archivedAt: '2024-01-15T10:30:00Z',
      archiver: {
        firstName: 'أحمد',
        lastName: 'الكبير',
        email: 'ahmed@kbn.local'
      },
      data: {
        titleAr: 'أساسيات الشرطة - الإصدار القديم',
        titleEn: 'Police Fundamentals - Old Version',
        code: 'PF-001'
      }
    },
    {
      id: '2',
      entityType: 'module',
      entityId: 'module-456',
      version: '1.5',
      reason: 'Replaced with new interactive content',
      archivedAt: '2024-01-10T14:20:00Z',
      archiver: {
        firstName: 'محمد',
        lastName: 'العبدالله',
        email: 'mohammed@kbn.local'
      },
      data: {
        titleAr: 'وحدة التدريب القديمة',
        titleEn: 'Old Training Module',
        kind: 'VIDEO'
      }
    },
    {
      id: '3',
      entityType: 'exam',
      entityId: 'exam-789',
      version: '1.2',
      reason: 'Questions updated for accuracy',
      archivedAt: '2024-01-05T09:15:00Z',
      archiver: {
        firstName: 'فاطمة',
        lastName: 'الزهراء',
        email: 'fatima@kbn.local'
      },
      data: {
        titleAr: 'اختبار أساسيات الشرطة - القديم',
        titleEn: 'Police Fundamentals Exam - Old',
        questionCount: 25
      }
    },
  ];

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'course':
        return BookOpen;
      case 'module':
        return FileText;
      case 'exam':
        return HelpCircle;
      default:
        return Archive;
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'course':
        return t('navigation.courses');
      case 'module':
        return 'Module';
      case 'exam':
        return t('navigation.exams');
      default:
        return entityType;
    }
  };

  const canManageArchives = ['admin', 'super_admin'].includes(session?.user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.archives')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.archiveContent')}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('common.search')}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Filter by Type
        </Button>
      </div>

      {/* Archives List */}
      <div className="space-y-4">
        {archives.map((archive) => {
          const EntityIcon = getEntityIcon(archive.entityType);
          const entityName = session?.user?.locale === 'ar' 
            ? archive.data.titleAr || archive.data.nameAr
            : archive.data.titleEn || archive.data.nameEn;

          return (
            <Card key={archive.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <EntityIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{entityName}</h3>
                        <Badge variant="secondary">
                          {getEntityTypeLabel(archive.entityType)}
                        </Badge>
                        <Badge variant="outline">
                          v{archive.version}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {archive.reason}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(archive.archivedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{archive.archiver.firstName} {archive.archiver.lastName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {canManageArchives && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Restore className="mr-2 h-4 w-4" />
                        {t('dashboard.restoreContent')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {archives.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.noArchives')}
            </h3>
            <p className="text-muted-foreground text-center">
              {t('dashboard.noArchivesDescription')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
