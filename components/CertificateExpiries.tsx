'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';

interface ExpiryDetails {
  id: string;
  serial: string;
  expiresAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    unit: string;
  };
  course: {
    titleEn: string;
    titleAr: string;
  };
}

interface CertificateExpiriesData {
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  expiryDetails: ExpiryDetails[];
}

export function CertificateExpiries() {
  const t = useTranslations();

  const { data, isLoading, error } = useQuery({
    queryKey: ['certificate-expiries'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/certificate-expiries', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch certificate expiries');
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificate Expiries</CardTitle>
          <CardDescription>Certificates expiring in the next 30, 60, and 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center p-4 bg-muted rounded-lg">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificate Expiries</CardTitle>
          <CardDescription>Certificates expiring in the next 30, 60, and 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load certificate expiry data</p>
        </CardContent>
      </Card>
    );
  }

  const expiryData: CertificateExpiriesData = data || {
    expiringIn30Days: 0,
    expiringIn60Days: 0,
    expiringIn90Days: 0,
    expiryDetails: []
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return 'bg-red-50 border-red-200 text-red-700';
    if (days <= 60) return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  };

  const getUrgencyIcon = (days: number) => {
    if (days <= 30) return <AlertTriangle className="h-4 w-4" />;
    if (days <= 60) return <Clock className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate Expiries</CardTitle>
        <CardDescription>Certificates expiring in the next 30, 60, and 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className={`text-center p-4 rounded-lg border ${getUrgencyColor(30)}`}>
            <div className="flex items-center justify-center mb-2">
              {getUrgencyIcon(30)}
            </div>
            <div className="text-2xl font-bold">{expiryData.expiringIn30Days}</div>
            <div className="text-sm">Next 30 days</div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${getUrgencyColor(60)}`}>
            <div className="flex items-center justify-center mb-2">
              {getUrgencyIcon(60)}
            </div>
            <div className="text-2xl font-bold">{expiryData.expiringIn60Days}</div>
            <div className="text-sm">Next 60 days</div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${getUrgencyColor(90)}`}>
            <div className="flex items-center justify-center mb-2">
              {getUrgencyIcon(90)}
            </div>
            <div className="text-2xl font-bold">{expiryData.expiringIn90Days}</div>
            <div className="text-sm">Next 90 days</div>
          </div>
        </div>

        {expiryData.expiryDetails.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Upcoming Expiries</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {expiryData.expiryDetails.slice(0, 10).map((cert) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(cert.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {cert.user.firstName} {cert.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cert.course.titleEn || cert.course.titleAr}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Unit: {cert.user.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={daysUntilExpiry <= 30 ? 'destructive' : daysUntilExpiry <= 60 ? 'default' : 'secondary'}>
                        {daysUntilExpiry} days
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(cert.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
