import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { FileManager } from '@/components/FileManager';
import { FileUpload } from '@/components/FileUpload';
import { FileManagerErrorBoundary } from '@/components/FileManagerErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FolderOpen,
  BarChart3,
  HardDrive
} from 'lucide-react';

export default async function FilesPage() {
  const session = await getServerSession();
  const t = await getTranslations();

  const canUploadFiles = ['instructor', 'admin', 'super_admin'].includes(session?.user?.role || '');

  // Fetch real file statistics
  const fileStats = await db.fileObject.aggregate({
    where: {
      status: { not: 'DELETED' },
    },
    _count: {
      id: true,
    },
    _sum: {
      size: true,
    },
  });

  // Get file type distribution
  const fileTypeStats = await db.fileObject.groupBy({
    by: ['fileType'],
    where: {
      status: { not: 'DELETED' },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  // Get recent uploads (last 7 days)
  const recentUploads = await db.fileObject.count({
    where: {
      status: { not: 'DELETED' },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Get last month's count for comparison
  const lastMonthUploads = await db.fileObject.count({
    where: {
      status: { not: 'DELETED' },
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const totalFiles = fileStats._count.id || 0;
  const totalSizeBytes = fileStats._sum.size || 0;
  const mostPopularType = fileTypeStats[0]?.fileType || 'PDF';
  const mostPopularCount = fileTypeStats[0]?._count.id || 0;
  const mostPopularPercentage = totalFiles > 0 ? Math.round((mostPopularCount / totalFiles) * 100) : 0;
  
  // Calculate growth percentage
  const recentGrowthPercentage = lastMonthUploads > 0 
    ? Math.round(((recentUploads - lastMonthUploads) / lastMonthUploads) * 100)
    : 0;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.fileManagement')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.fileManagementDescription')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalFiles')}
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {recentGrowthPercentage > 0 ? '+' : ''}{recentGrowthPercentage}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalSize')}
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSizeBytes)}</div>
            <p className="text-xs text-muted-foreground">
              Total storage used
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.mostPopular')}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostPopularType}</div>
            <p className="text-xs text-muted-foreground">
              {mostPopularPercentage}% of all files
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.recentUploads')}
            </CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUploads}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">
            <FolderOpen className="mr-2 h-4 w-4" />
            {t('dashboard.manageFiles')}
          </TabsTrigger>
          {canUploadFiles && (
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              {t('dashboard.uploadFiles')}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="manage" className="space-y-4">
          <Suspense fallback={
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          }>
            <FileManagerErrorBoundary>
              <FileManager 
                showUpload={canUploadFiles} 
                onFileSelect={(file) => {
                  // Open file preview in new tab
                  const previewUrl = `/api/files/${file.key}/preview`;
                  console.log('Opening file preview:', previewUrl);
                  window.open(previewUrl, '_blank');
                }}
              />
            </FileManagerErrorBoundary>
          </Suspense>
        </TabsContent>
        
        {canUploadFiles && (
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.uploadFiles')}</CardTitle>
                <CardDescription>
                  {t('dashboard.uploadFilesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileManagerErrorBoundary>
                  <FileUpload
                    maxFiles={10}
                  />
                </FileManagerErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
