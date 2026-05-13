import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().min(1, "clients.errors.nameRequired"),
  name_en: z.string().optional(),
  industry: z.string(),
  primary_contact_name: z.string().optional(),
  primary_contact_email: z
    .string()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "clients.errors.emailInvalid",
    })
    .optional(),
  notes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
