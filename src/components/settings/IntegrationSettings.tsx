/**
 * Integration Settings Component
 * Third-party integrations (placeholder for future)
 */

import { Plug, MessageSquare, Calendar, Cloud, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntegrationItem {
  id: string;
  name: string;
  description_ja: string;
  description_en: string;
  icon: React.ReactNode;
  status: 'available' | 'connected' | 'coming_soon';
}

const integrations: IntegrationItem[] = [
  {
    id: 'slack',
    name: 'Slack',
    description_ja: 'プロジェクト通知をSlackに送信',
    description_en: 'Send project notifications to Slack',
    icon: <MessageSquare className="h-5 w-5" />,
    status: 'coming_soon',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description_ja: '締め切りをカレンダーに同期',
    description_en: 'Sync deadlines to your calendar',
    icon: <Calendar className="h-5 w-5" />,
    status: 'coming_soon',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description_ja: 'ファイルをGoogle Driveに保存',
    description_en: 'Save files to Google Drive',
    icon: <Cloud className="h-5 w-5" />,
    status: 'coming_soon',
  },
];

export function IntegrationSettings() {
  const { language } = useLanguage();

  const getStatusBadge = (status: IntegrationItem['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {language === 'ja' ? '接続済み' : 'Connected'}
          </Badge>
        );
      case 'available':
        return (
          <Badge variant="outline">
            {language === 'ja' ? '利用可能' : 'Available'}
          </Badge>
        );
      case 'coming_soon':
        return (
          <Badge variant="secondary">
            {language === 'ja' ? '準備中' : 'Coming Soon'}
          </Badge>
        );
    }
  };

  const getActionButton = (status: IntegrationItem['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Button variant="outline" size="sm" disabled>
            {language === 'ja' ? '設定' : 'Configure'}
          </Button>
        );
      case 'available':
        return (
          <Button size="sm" disabled>
            {language === 'ja' ? '接続' : 'Connect'}
          </Button>
        );
      case 'coming_soon':
        return (
          <Button variant="ghost" size="sm" disabled>
            {language === 'ja' ? '近日公開' : 'Soon'}
          </Button>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Available Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4" />
            {language === 'ja' ? '外部サービス連携' : 'External Integrations'}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? '外部サービスとの連携を管理します'
              : 'Manage connections to external services'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{integration.name}</p>
                      {getStatusBadge(integration.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ja' ? integration.description_ja : integration.description_en}
                    </p>
                  </div>
                </div>
                {getActionButton(integration.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Keys (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            {language === 'ja' ? 'APIキー' : 'API Keys'}
          </CardTitle>
          <CardDescription>
            {language === 'ja'
              ? 'API連携用のキーを管理します'
              : 'Manage API keys for integrations'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {language === 'ja' ? '準備中' : 'Coming soon'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
