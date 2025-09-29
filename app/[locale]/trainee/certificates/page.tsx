import { getServerSession } from '@/lib/auth-server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

export default async function CertificatesPage() {
  const session = await getServerSession();
  const t = await getTranslations();

  if (!session?.user) {
    return <div>Please log in to view certificates</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('certificates.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('certificates.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('certificates.myCertificates')}</CardTitle>
          <CardDescription>
            {t('certificates.certificatesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Certificates functionality is being implemented</p>
            <p className="text-sm">Complete courses to earn certificates</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}