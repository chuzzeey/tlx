import { z } from 'zod';

export const ADMIN_AVATAR_BUCKET = 'tlx-admin-avatars';

const avatarFileNamePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(avif|jpg|png|webp)$/i;

export const adminAvatarUploadSchema = z
  .object({
    contentType: z.enum(['image/avif', 'image/jpeg', 'image/png', 'image/webp']),
    size: z.number().int().positive().max(5 * 1024 * 1024)
  })
  .strict();

export function isOwnAdminAvatarPath(path: string, userId: string) {
  const [ownerId, fileName, ...extra] = path.split('/');
  return (
    ownerId === userId &&
    extra.length === 0 &&
    typeof fileName === 'string' &&
    avatarFileNamePattern.test(fileName)
  );
}
