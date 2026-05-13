import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@/components/client/ClientForm.schema";

interface Props {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => Promise<void> | void;
  submitting?: boolean;
  submitLabelJa?: string;
  submitLabelEn?: string;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabelJa = "保存",
  submitLabelEn = "Save",
}: Props) {
  const { t } = useTranslation();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      name_en: "",
      industry: "pharmaceutical",
      primary_contact_name: "",
      primary_contact_email: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="クライアント名" en="Name" />
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage>
                {form.formState.errors.name?.message
                  ? t(form.formState.errors.name.message)
                  : null}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="英語名" en="English name" />
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primary_contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="担当者名" en="Primary contact" />
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primary_contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="担当者メール" en="Contact email" />
              </FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage>
                {form.formState.errors.primary_contact_email?.message
                  ? t(form.formState.errors.primary_contact_email.message)
                  : null}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <BilingualLabel ja="メモ" en="Notes" />
              </FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" disabled={submitting}>
            <BilingualLabel ja={submitLabelJa} en={submitLabelEn} />
          </Button>
        </div>
      </form>
    </Form>
  );
}
