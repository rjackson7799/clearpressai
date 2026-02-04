/**
 * ISIBlockInserter - Insert Important Safety Information (ISI) and boilerplate blocks
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Building2, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ISIBlockInserterProps {
  onInsertISI: (content: string) => void;
  onInsertBoilerplate: (content: string) => void;
  defaultISI?: string;
  defaultBoilerplate?: string;
  disabled?: boolean;
}

export function ISIBlockInserter({
  onInsertISI,
  onInsertBoilerplate,
  defaultISI = '',
  defaultBoilerplate = '',
  disabled = false,
}: ISIBlockInserterProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isiContent, setISIContent] = useState(defaultISI);
  const [boilerplateContent, setBoilerplateContent] = useState(defaultBoilerplate);
  const [activeTab, setActiveTab] = useState<'isi' | 'boilerplate'>('isi');

  const handleInsert = () => {
    if (activeTab === 'isi') {
      onInsertISI(isiContent);
    } else {
      onInsertBoilerplate(boilerplateContent);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('editor.insertBlock')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('editor.insertBlock')}</DialogTitle>
          <DialogDescription>
            {t('editor.insertBlockDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'isi' | 'boilerplate')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="isi" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t('editor.isi')}
            </TabsTrigger>
            <TabsTrigger value="boilerplate" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t('editor.boilerplate')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="isi" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="isi-content">{t('editor.isiLabel')}</Label>
              <Textarea
                id="isi-content"
                value={isiContent}
                onChange={(e) => setISIContent(e.target.value)}
                placeholder={t('editor.isiPlaceholder')}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('editor.isiDescription')}
            </p>
          </TabsContent>

          <TabsContent value="boilerplate" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="boilerplate-content">{t('editor.boilerplateLabel')}</Label>
              <Textarea
                id="boilerplate-content"
                value={boilerplateContent}
                onChange={(e) => setBoilerplateContent(e.target.value)}
                placeholder={t('editor.boilerplatePlaceholder')}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('editor.boilerplateDescription')}
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleInsert}>
            {t('editor.insert')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
