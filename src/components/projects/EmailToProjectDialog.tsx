/**
 * ClearPress AI - Email to Project Dialog
 * Allows PR staff to create projects from email content
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/use-clients';
import { useCreateProject } from '@/hooks/use-projects';
import { findClientByUserEmail } from '@/services/clients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Building2, Sparkles } from 'lucide-react';

interface EmailToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Form schema
const emailProjectSchema = z.object({
  sender_email: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  name: z.string().min(1, 'プロジェクト名は必須です').max(200),
  client_id: z.string().min(1, 'クライアントを選択してください'),
  brief: z.string().min(1, 'メール内容を入力してください').max(10000),
  urgency: z.enum(['standard', 'priority', 'urgent', 'crisis']),
  target_date: z.string().optional().or(z.literal('')),
});

type EmailProjectFormData = z.infer<typeof emailProjectSchema>;

// Urgency labels
const URGENCY_LABELS: Record<string, { ja: string; en: string }> = {
  standard: { ja: '通常', en: 'Standard' },
  priority: { ja: '優先', en: 'Priority' },
  urgent: { ja: '緊急', en: 'Urgent' },
  crisis: { ja: '危機対応', en: 'Crisis' },
};

export function EmailToProjectDialog({
  open,
  onOpenChange,
}: EmailToProjectDialogProps) {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedClient, setDetectedClient] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch clients for selection
  const { data: clientsData } = useClients({ per_page: 100 });

  // Create project mutation
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EmailProjectFormData>({
    resolver: zodResolver(emailProjectSchema),
    defaultValues: {
      sender_email: '',
      name: '',
      client_id: '',
      brief: '',
      urgency: 'standard',
      target_date: '',
    },
  });

  const senderEmail = watch('sender_email');
  const clientId = watch('client_id');
  const urgency = watch('urgency');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setDetectedClient(null);
    }
  }, [open, reset]);

  // Auto-detect client when email changes
  useEffect(() => {
    const detectClient = async () => {
      if (!senderEmail || !organizationId) {
        setDetectedClient(null);
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(senderEmail)) {
        setDetectedClient(null);
        return;
      }

      setIsDetecting(true);
      try {
        const client = await findClientByUserEmail(senderEmail, organizationId);
        if (client) {
          setDetectedClient({ id: client.id, name: client.name });
          setValue('client_id', client.id);
        } else {
          setDetectedClient(null);
        }
      } catch (error) {
        console.error('Error detecting client:', error);
        setDetectedClient(null);
      } finally {
        setIsDetecting(false);
      }
    };

    // Debounce the detection
    const timer = setTimeout(detectClient, 500);
    return () => clearTimeout(timer);
  }, [senderEmail, organizationId, setValue]);

  // Handle form submission
  const onSubmit = async (data: EmailProjectFormData) => {
    try {
      await createProject.mutateAsync({
        client_id: data.client_id,
        name: data.name,
        brief: data.brief,
        urgency: data.urgency,
        target_date: data.target_date || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
      console.error('Failed to create project:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {language === 'ja' ? 'メールからプロジェクト作成' : 'Create Project from Email'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ja'
              ? 'クライアントからのメール内容を貼り付けて、プロジェクトを作成します。'
              : 'Paste the email content from a client to create a new project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Sender Email (for auto-detection) */}
          <div className="space-y-2">
            <Label htmlFor="sender_email" className="text-sm font-medium">
              {language === 'ja' ? '送信者メールアドレス' : 'Sender Email'}
              <span className="text-muted-foreground ml-1 text-xs">
                ({language === 'ja' ? 'オプション' : 'Optional'})
              </span>
            </Label>
            <div className="relative">
              <Input
                id="sender_email"
                type="email"
                placeholder={
                  language === 'ja'
                    ? 'client@example.com'
                    : 'client@example.com'
                }
                {...register('sender_email')}
                className={errors.sender_email ? 'border-destructive' : ''}
              />
              {isDetecting && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {detectedClient && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  {language === 'ja' ? '検出' : 'Detected'}
                </Badge>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {detectedClient.name}
                </span>
              </div>
            )}
            {errors.sender_email && (
              <p className="text-sm text-destructive">{errors.sender_email.message}</p>
            )}
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ja' ? 'クライアント' : 'Client'}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={clientId}
              onValueChange={(value) => setValue('client_id', value)}
            >
              <SelectTrigger className={errors.client_id ? 'border-destructive' : ''}>
                <SelectValue
                  placeholder={
                    language === 'ja' ? 'クライアントを選択' : 'Select client'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clientsData?.data.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.client_id && (
              <p className="text-sm text-destructive">{errors.client_id.message}</p>
            )}
          </div>

          {/* Project Name (from email subject) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {language === 'ja' ? 'プロジェクト名（メール件名）' : 'Project Name (Email Subject)'}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              placeholder={
                language === 'ja'
                  ? 'メールの件名を入力'
                  : 'Enter email subject'
              }
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email Body (brief) */}
          <div className="space-y-2">
            <Label htmlFor="brief" className="text-sm font-medium">
              {language === 'ja' ? 'メール本文' : 'Email Body'}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="brief"
              placeholder={
                language === 'ja'
                  ? 'メール本文を貼り付けてください...'
                  : 'Paste email body here...'
              }
              rows={6}
              {...register('brief')}
              className={errors.brief ? 'border-destructive' : ''}
            />
            {errors.brief && (
              <p className="text-sm text-destructive">{errors.brief.message}</p>
            )}
          </div>

          {/* Urgency and Target Date in a row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Urgency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'ja' ? '緊急度' : 'Urgency'}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={urgency}
                onValueChange={(value) =>
                  setValue('urgency', value as EmailProjectFormData['urgency'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(URGENCY_LABELS).map(([value, labels]) => (
                    <SelectItem key={value} value={value}>
                      {labels[language]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="target_date" className="text-sm font-medium">
                {language === 'ja' ? '納期' : 'Deadline'}
              </Label>
              <Input
                id="target_date"
                type="date"
                {...register('target_date')}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {language === 'ja' ? 'プロジェクトを作成' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
