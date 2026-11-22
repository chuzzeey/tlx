import { z } from 'zod';

export const adminEmailSchema = z.email('Enter a valid email address.');

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const adminProfileInputSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter your first name.').max(80),
    lastName: z.string().trim().max(80),
    displayName: z.string().trim().max(100),
    phoneNumber: z
      .string()
      .trim()
      .max(32)
      .regex(/^[+0-9().\-\s]*$/, 'Enter a valid phone number.'),
    avatarUrl: z.string().url().max(2048).nullable(),
    avatarPath: z.string().max(256).nullable(),
    timezone: z
      .string()
      .trim()
      .min(1, 'Choose a time zone.')
      .max(100)
      .refine(isValidTimeZone, 'Enter a valid IANA time zone.')
  })
  .refine((profile) => !(profile.avatarUrl && profile.avatarPath), {
    path: ['avatarPath'],
    message: 'A profile photo can be either an external URL or an uploaded image.'
  })
  .strict();

export type AdminProfileInput = z.infer<typeof adminProfileInputSchema>;
