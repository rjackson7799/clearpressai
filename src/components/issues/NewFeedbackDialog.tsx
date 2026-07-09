import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { FeedbackAttachmentUploader } from "./FeedbackAttachmentUploader";
import {
  newFeedbackSchema,
  type NewFeedbackValues,
} from "./NewFeedbackForm.schema";
import {
  INTERNAL_FEEDBACK_TYPES,
  INTERNAL_FEEDBACK_TYPE_LABELS,
} from "@/lib/internal-feedback";
import { useCreateInternalFeedback } from "@/hooks/useInternalFeedback";

const DEFAULTS: NewFeedbackValues = { type: "bug", message: "" };

export function NewFeedbackDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const create = useCreateInternalFeedback();
  const form = useForm<NewFeedbackValues>({
    resolver: zodResolver(newFeedbackSchema),
    defaultValues: DEFAULTS,
  });

  const reset = () => {
    form.reset(DEFAULTS);
    setFiles([]);
  };

  const onSubmit = async (values: NewFeedbackValues) => {
    try {
      await create.mutateAsync({
        type: values.type,
        message: values.message,
        files,
      });
      toast.success(t("internalFeedback.toasts.submitted"));
      reset();
      setOpen(false);
    } catch {
      toast.error(t("internalFeedback.toasts.submitFailed"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4" />
          <BilingualLabel ja="フィードバックを送信" en="New feedback" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <BilingualLabel ja="フィードバックを送信" en="New feedback" />
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <BilingualLabel ja="種類" en="Type" />
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERNAL_FEEDBACK_TYPES.map((tp) => (
                        <SelectItem key={tp} value={tp}>
                          <BilingualLabel
                            ja={INTERNAL_FEEDBACK_TYPE_LABELS[tp].ja}
                            en={INTERNAL_FEEDBACK_TYPE_LABELS[tp].en}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <BilingualLabel ja="内容" en="Message" />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder={t("internalFeedback.messagePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.message?.message
                      ? t(form.formState.errors.message.message)
                      : null}
                  </FormMessage>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>
                <BilingualLabel ja="スクリーンショット（任意）" en="Screenshots (optional)" />
              </FormLabel>
              <FeedbackAttachmentUploader
                onChange={setFiles}
                disabled={create.isPending}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                <BilingualLabel ja="送信" en="Submit" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
