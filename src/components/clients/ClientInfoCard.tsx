/**
 * ClearPress AI - Client Info Card
 * Card displaying basic client information
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Building2, Calendar } from 'lucide-react';
import type { Client, Industry } from '@/types';

interface ClientInfoCardProps {
  client: Client;
  industries?: Industry[];
}

export function ClientInfoCard({ client, industries }: ClientInfoCardProps) {
  const { t, language } = useLanguage();

  // Get client initials for avatar fallback
  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'ja' ? 'ja-JP' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          {t('clients.basicInfo')}
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        {/* Client Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-14 w-14">
            {client.logo_url && (
              <AvatarImage src={client.logo_url} alt={client.name} />
            )}
            <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {client.name}
            </h3>
            {client.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {client.description}
              </p>
            )}
          </div>
        </div>

        {/* Industries */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            {t('clients.industry')}
          </p>
          <div className="flex flex-wrap gap-2">
            {industries && industries.length > 0 ? (
              industries.map((industry) => (
                <Badge
                  key={industry.id}
                  variant="secondary"
                  className="bg-gray-100 text-gray-700"
                >
                  {language === 'ja' ? industry.name_ja : industry.name_en}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-gray-400">{t('clients.noIndustries')}</span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t('clients.createdAt')}
            </p>
            <p className="text-sm text-gray-700">{formatDate(client.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {t('clients.updatedAt')}
            </p>
            <p className="text-sm text-gray-700">{formatDate(client.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
