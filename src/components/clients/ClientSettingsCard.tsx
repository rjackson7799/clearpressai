/**
 * ClearPress AI - Client Settings Card
 * Card for displaying and editing client settings
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateClient } from '@/hooks/use-clients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Pencil, Check, X, Loader2 } from 'lucide-react';
import type { Client, UrgencyLevel } from '@/types';

interface ClientSettingsCardProps {
  client: Client;
}

export function ClientSettingsCard({ client }: ClientSettingsCardProps) {
  const { t } = useLanguage();
  const { isPRAdmin } = useAuth();
  const updateClient = useUpdateClient();

  const [isEditing, setIsEditing] = useState(false);
  const [defaultUrgency, setDefaultUrgency] = useState<UrgencyLevel>(
    client.settings?.default_urgency ?? 'standard'
  );
  const [requireApproval, setRequireApproval] = useState(
    client.settings?.require_approval ?? true
  );

  const handleSave = async () => {
    try {
      await updateClient.mutateAsync({
        clientId: client.id,
        data: {
          settings: {
            default_urgency: defaultUrgency,
            require_approval: requireApproval,
          },
        },
      });
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setDefaultUrgency(client.settings?.default_urgency ?? 'standard');
    setRequireApproval(client.settings?.require_approval ?? true);
    setIsEditing(false);
  };

  // Get urgency badge color
  const getUrgencyBadgeClass = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'crisis':
        return 'bg-red-100 text-red-700';
      case 'urgent':
        return 'bg-orange-100 text-orange-700';
      case 'priority':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-400" />
            {t('clients.settings')}
          </CardTitle>
          {isPRAdmin && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 px-2"
            >
              <Pencil className="h-4 w-4 mr-1" />
              {t('common.edit')}
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateClient.isPending}
                className="h-8 px-2"
              >
                {updateClient.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5 space-y-5">
        {/* Default Urgency */}
        <div>
          <Label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">
            {t('clients.defaultUrgency')}
          </Label>
          {isEditing ? (
            <Select
              value={defaultUrgency}
              onValueChange={(value) => setDefaultUrgency(value as UrgencyLevel)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">{t('urgency.standard')}</SelectItem>
                <SelectItem value="priority">{t('urgency.priority')}</SelectItem>
                <SelectItem value="urgent">{t('urgency.urgent')}</SelectItem>
                <SelectItem value="crisis">{t('urgency.crisis')}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={getUrgencyBadgeClass(defaultUrgency)}>
              {t(`urgency.${defaultUrgency}`)}
            </Badge>
          )}
        </div>

        {/* Require Approval */}
        <div>
          <Label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">
            {t('clients.requireApproval')}
          </Label>
          {isEditing ? (
            <div className="flex items-center gap-3">
              <Switch
                checked={requireApproval}
                onCheckedChange={setRequireApproval}
              />
              <span className="text-sm text-gray-700">
                {requireApproval ? t('common.yes') : t('common.no')}
              </span>
            </div>
          ) : (
            <Badge variant={requireApproval ? 'default' : 'secondary'}>
              {requireApproval ? t('common.yes') : t('common.no')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
