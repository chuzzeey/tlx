import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminAvatarUploadSchema,
  isOwnAdminAvatarPath
} from '../src/dashboard-template/lib/admin-profile-avatar.ts';
import { adminProfileInputSchema } from '../src/dashboard-template/lib/admin-profile-schema.ts';

const userId = 'c0a80123-4567-489a-8abc-0123456789ab';
const validProfile = {
  firstName: 'Alex',
  lastName: 'Morgan',
  displayName: 'Alex M.',
  phoneNumber: '+1 (415) 555-0132',
  avatarUrl: null,
  avatarPath: null,
  timezone: 'Africa/Lagos'
};

test('validates profile fields and IANA time zones', () => {
  assert.equal(adminProfileInputSchema.safeParse(validProfile).success, true);
  assert.equal(
    adminProfileInputSchema.safeParse({ ...validProfile, timezone: 'Mars/Olympus' }).success,
    false
  );
  assert.equal(adminProfileInputSchema.safeParse({ ...validProfile, firstName: ' ' }).success, false);
  assert.equal(adminProfileInputSchema.safeParse({ ...validProfile, phoneNumber: 'call me' }).success, false);
  assert.equal(adminProfileInputSchema.safeParse({ ...validProfile, password: 'should not be accepted' }).success, false);
  assert.equal(
    adminProfileInputSchema.safeParse({
      ...validProfile,
      avatarUrl: 'https://example.com/avatar.jpg',
      avatarPath: 'another-user/550e8400-e29b-41d4-a716-446655440000.jpg'
    }).success,
    false
  );
});

test('accepts only a well-formed avatar path owned by the signed-in user', () => {
  const imagePath = `${userId}/550e8400-e29b-41d4-a716-446655440000.webp`;
  assert.equal(isOwnAdminAvatarPath(imagePath, userId), true);
  assert.equal(isOwnAdminAvatarPath(imagePath, 'another-user'), false);
  assert.equal(isOwnAdminAvatarPath(`${userId}/../secret.png`, userId), false);
  assert.equal(isOwnAdminAvatarPath(`${userId}/folder/image.png`, userId), false);
});

test('allows only supported image uploads up to five megabytes', () => {
  assert.equal(
    adminAvatarUploadSchema.safeParse({ contentType: 'image/webp', size: 5 * 1024 * 1024 }).success,
    true
  );
  assert.equal(
    adminAvatarUploadSchema.safeParse({ contentType: 'image/svg+xml', size: 1000 }).success,
    false
  );
  assert.equal(
    adminAvatarUploadSchema.safeParse({ contentType: 'image/png', size: 5 * 1024 * 1024 + 1 }).success,
    false
  );
  assert.equal(
    adminAvatarUploadSchema.safeParse({ contentType: 'image/jpeg', size: 0 }).success,
    false
  );
});
