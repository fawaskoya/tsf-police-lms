import { Suspense } from 'react';
import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Tag, 
  Search,
  Edit,
  Trash2,
  Hash,
  BookOpen
} from 'lucide-react';

export default async function TagsPage() {
  const session = await getServerSession();
  const t = await getTranslations();

  // Mock data for now - replace with real API call
  const tags = [
    {
      id: '1',
      name: 'Security',
      description: 'Security-related content',
      color: '#ef4444',
      courseCount: 12,
      moduleCount: 45,
    },
    {
      id: '2',
      name: 'Traffic',
      description: 'Traffic management and laws',
      color: '#3b82f6',
      courseCount: 8,
      moduleCount: 23,
    },
    {
      id: '3',
      name: 'Emergency Response',
      description: 'Emergency response procedures',
      color: '#f59e0b',
      courseCount: 6,
      moduleCount: 18,
    },
    {
      id: '4',
      name: 'Communication',
      description: 'Communication protocols and procedures',
      color: '#10b981',
      courseCount: 4,
      moduleCount: 12,
    },
  ];

  const canManageTags = ['admin', 'super_admin'].includes(session?.user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.tagManagement')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.tags')}
          </p>
        </div>
        {canManageTags && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.createTag')}
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('common.search')}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tags Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <CardTitle className="text-lg">{tag.name}</CardTitle>
                </div>
                {canManageTags && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                {tag.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Courses:</span>
                  <Badge variant="secondary">
                    <BookOpen className="mr-1 h-3 w-3" />
                    {tag.courseCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Modules:</span>
                  <Badge variant="secondary">
                    <Hash className="mr-1 h-3 w-3" />
                    {tag.moduleCount}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {tag.color.toUpperCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.noTags')}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('dashboard.noTagsDescription')}
            </p>
            {canManageTags && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.createTag')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
