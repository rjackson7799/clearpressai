/**
 * ClearPress AI - Style Profile Editor
 * Editor for managing client style profile (tone, formality, messages, etc.)
 */

import { useState, type KeyboardEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateClient } from '@/hooks/use-clients';
import { useClientStyleFiles } from '@/hooks/use-files';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Save, Loader2, X, Sparkles, FileText } from 'lucide-react';
import type { Client, StyleProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

interface StyleProfileEditorProps {
  client: Client;
  onOpenExtraction?: () => void;
}

export function StyleProfileEditor({ client, onOpenExtraction }: StyleProfileEditorProps) {
  const { t, language } = useLanguage();
  const { isPRAdmin } = useAuth();
  const updateClient = useUpdateClient();
  const { data: styleFiles } = useClientStyleFiles(client.id);

  // Form state
  const [tone, setTone] = useState(client.style_profile?.tone ?? '');
  const [formality, setFormality] = useState<'low' | 'medium' | 'high'>(
    client.style_profile?.formality ?? 'medium'
  );
  const [keyMessages, setKeyMessages] = useState<string[]>(
    client.style_profile?.key_messages ?? []
  );
  const [avoidPhrases, setAvoidPhrases] = useState<string[]>(
    client.style_profile?.avoid_phrases ?? []
  );
  const [boilerplate, setBoilerplate] = useState(
    client.style_profile?.boilerplate ?? ''
  );

  // Input states for tag inputs
  const [keyMessageInput, setKeyMessageInput] = useState('');
  const [avoidPhraseInput, setAvoidPhraseInput] = useState('');

  // Track if form has changes
  const hasChanges =
    tone !== (client.style_profile?.tone ?? '') ||
    formality !== (client.style_profile?.formality ?? 'medium') ||
    JSON.stringify(keyMessages) !==
      JSON.stringify(client.style_profile?.key_messages ?? []) ||
    JSON.stringify(avoidPhrases) !==
      JSON.stringify(client.style_profile?.avoid_phrases ?? []) ||
    boilerplate !== (client.style_profile?.boilerplate ?? '');

  const handleSave = async () => {
    const styleProfile: StyleProfile = {
      tone: tone || undefined,
      formality,
      key_messages: keyMessages.length > 0 ? keyMessages : undefined,
      avoid_phrases: avoidPhrases.length > 0 ? avoidPhrases : undefined,
      boilerplate: boilerplate || undefined,
    };

    try {
      await updateClient.mutateAsync({
        clientId: client.id,
        data: { style_profile: styleProfile },
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleKeyMessageKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keyMessageInput.trim()) {
      e.preventDefault();
      if (keyMessages.length < 10) {
        setKeyMessages([...keyMessages, keyMessageInput.trim()]);
        setKeyMessageInput('');
      }
    }
  };

  const handleAvoidPhraseKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && avoidPhraseInput.trim()) {
      e.preventDefault();
      if (avoidPhrases.length < 20) {
        setAvoidPhrases([...avoidPhrases, avoidPhraseInput.trim()]);
        setAvoidPhraseInput('');
      }
    }
  };

  const removeKeyMessage = (index: number) => {
    setKeyMessages(keyMessages.filter((_, i) => i !== index));
  };

  const removeAvoidPhrase = (index: number) => {
    setAvoidPhrases(avoidPhrases.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-400" />
            {t('clients.styleProfile')}
          </CardTitle>
          {isPRAdmin && hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateClient.isPending}
              className="h-8"
            >
              {updateClient.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('common.save')}
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5 space-y-6">
        {/* AI Extraction Info */}
        {isPRAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {t('styleExtraction.title')}
                </p>
                {client.style_profile?.extracted_from && client.style_profile.extracted_from.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-amber-700">
                      {t('styleExtraction.extractedFrom', {
                        count: String(client.style_profile.extracted_from.length)
                      })}
                    </p>
                    {client.style_profile?.last_extraction_at && (
                      <p className="text-xs text-amber-600">
                        {formatDistanceToNow(new Date(client.style_profile.last_extraction_at), {
                          addSuffix: true,
                          locale: language === 'ja' ? ja : enUS,
                        })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 mt-1">
                    {t('styleExtraction.uploadPrompt')}
                  </p>
                )}
                {styleFiles && styleFiles.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
                    <FileText className="h-3 w-3" />
                    <span>{styleFiles.length} {t('files.title').toLowerCase()}</span>
                  </div>
                )}
              </div>
              {onOpenExtraction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenExtraction}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {client.style_profile?.extracted_from?.length
                    ? t('styleExtraction.reanalyze')
                    : t('styleExtraction.extractButton')
                  }
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tone */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="text-sm font-medium text-gray-700">
            {t('clients.tone')}
          </Label>
          <Input
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder={t('clients.tonePlaceholder')}
            disabled={!isPRAdmin}
          />
        </div>

        {/* Formality */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {t('clients.formality')}
          </Label>
          <Select
            value={formality}
            onValueChange={(value) =>
              setFormality(value as 'low' | 'medium' | 'high')
            }
            disabled={!isPRAdmin}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t('clients.formalityLow')}</SelectItem>
              <SelectItem value="medium">{t('clients.formalityMedium')}</SelectItem>
              <SelectItem value="high">{t('clients.formalityHigh')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Messages */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {t('clients.keyMessages')}
          </Label>
          {isPRAdmin && keyMessages.length < 10 && (
            <Input
              value={keyMessageInput}
              onChange={(e) => setKeyMessageInput(e.target.value)}
              onKeyDown={handleKeyMessageKeyDown}
              placeholder={t('clients.keyMessagesPlaceholder')}
            />
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {keyMessages.map((message, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-blue-100 text-blue-700 pr-1.5"
              >
                {message}
                {isPRAdmin && (
                  <button
                    type="button"
                    onClick={() => removeKeyMessage(index)}
                    className="ml-1.5 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {keyMessages.length === 0 && (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>

        {/* Avoid Phrases */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {t('clients.avoidPhrases')}
          </Label>
          {isPRAdmin && avoidPhrases.length < 20 && (
            <Input
              value={avoidPhraseInput}
              onChange={(e) => setAvoidPhraseInput(e.target.value)}
              onKeyDown={handleAvoidPhraseKeyDown}
              placeholder={t('clients.avoidPhrasesPlaceholder')}
            />
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {avoidPhrases.map((phrase, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-red-100 text-red-700 pr-1.5"
              >
                {phrase}
                {isPRAdmin && (
                  <button
                    type="button"
                    onClick={() => removeAvoidPhrase(index)}
                    className="ml-1.5 hover:bg-red-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {avoidPhrases.length === 0 && (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>

        {/* Boilerplate */}
        <div className="space-y-2">
          <Label htmlFor="boilerplate" className="text-sm font-medium text-gray-700">
            {t('clients.boilerplate')}
          </Label>
          <Textarea
            id="boilerplate"
            value={boilerplate}
            onChange={(e) => setBoilerplate(e.target.value)}
            placeholder={t('clients.boilerplatePlaceholder')}
            rows={4}
            disabled={!isPRAdmin}
          />
          <p className="text-xs text-gray-400">
            {boilerplate.length}/2000
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
