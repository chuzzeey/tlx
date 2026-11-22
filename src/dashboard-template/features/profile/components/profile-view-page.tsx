'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  IconAdjustmentsHorizontal,
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconDeviceFloppy,
  IconLock,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconTrash,
  IconUpload,
  IconUser
} from '@tabler/icons-react';
import { Eye, EyeOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@dashboard/components/ui/avatar';
import { Button } from '@dashboard/components/ui/button';
import { Input } from '@dashboard/components/ui/input';
import {
  adminProfileInputSchema,
  type AdminProfileInput
} from '@dashboard/lib/admin-profile-schema';
import { ADMIN_AVATAR_BUCKET } from '@dashboard/lib/admin-profile-avatar';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';
import AdminSignOut from '@dashboard/features/auth/components/admin-sign-out';
import StorefrontCurrencyPreference from '@dashboard/features/profile/components/storefront-currency-preference';

type AdminProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone_number: string;
  avatar_url: string | null;
  avatar_path: string | null;
  avatar_display_url?: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

type AccountInfo = {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  role: string;
  status: string;
  providers: string[];
  metadataName: string;
  metadataAvatarUrl: string;
};

type ProfilePayload = {
  profile: AdminProfile | null;
  account: AccountInfo;
  error?: string;
  warning?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type SectionId = 'personal' | 'security' | 'preferences';
type Feedback = { kind: 'success' | 'error' | 'warning'; message: string };

const navigation: { id: SectionId; label: string; description: string; icon: typeof IconUser }[] = [
  { id: 'personal', label: 'Personal information', description: 'Identity and contact', icon: IconUser },
  { id: 'security', label: 'Security', description: 'Sign-in and protection', icon: IconLock },
  { id: 'preferences', label: 'Preferences', description: 'Regional settings', icon: IconAdjustmentsHorizontal }
];

const timeZoneOptions = [
  ...new Set([
    'UTC',
    ...(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [])
  ])
];

function splitName(value: string) {
  const [firstName = '', ...lastName] = value.trim().split(/\s+/).filter(Boolean);
  return { firstName, lastName: lastName.join(' ') };
}

function valuesFromProfile(profile: AdminProfile | null, account: AccountInfo): AdminProfileInput {
  const inferred = splitName(account.metadataName);
  return {
    firstName: profile?.first_name ?? inferred.firstName,
    lastName: profile?.last_name ?? inferred.lastName,
    displayName: profile?.display_name ?? account.metadataName,
    phoneNumber: profile?.phone_number ?? '',
    avatarUrl: profile ? profile.avatar_url : account.metadataAvatarUrl || null,
    avatarPath: profile?.avatar_path ?? null,
    timezone: profile?.timezone ?? 'UTC'
  };
}

function fullName(values: AdminProfileInput, account: AccountInfo) {
  return (
    values.displayName ||
    [values.firstName, values.lastName].filter(Boolean).join(' ') ||
    account.metadataName ||
    account.email
  );
}

function profileName(values: AdminProfileInput) {
  return [values.firstName, values.lastName].filter(Boolean).join(' ') || values.displayName;
}

function formatAccountDate(value: string, timeZone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone
  }).format(date);
}

async function responsePayload(response: Response) {
  return (await response.json()) as ProfilePayload;
}

export default function ProfileViewPage() {
  const [section, setSection] = useState<SectionId>('personal');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [values, setValues] = useState<AdminProfileInput | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = saving || avatarLoading || passwordLoading;

  const displayName = useMemo(
    () => (values && account ? fullName(values, account) : 'Your profile'),
    [values, account]
  );

  const fetchProfile = useCallback(async () => {
      const response = await fetch('/api/admin/profile', { cache: 'no-store' });
      const payload = await responsePayload(response);
      if (!response.ok) throw new Error(payload.error || 'Could not load profile settings.');
      if (!payload.account) throw new Error('The profile response did not include account details.');
      return payload;
  }, []);

  const applyProfilePayload = useCallback((payload: ProfilePayload) => {
      setAccount(payload.account);
      setValues(valuesFromProfile(payload.profile, payload.account));
      setAvatarPreviewUrl(
        payload.profile
          ? payload.profile.avatar_display_url ?? payload.profile.avatar_url ?? ''
          : payload.account.metadataAvatarUrl
      );
      if (payload.warning) setFeedback({ kind: 'warning', message: payload.warning });
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      applyProfilePayload(await fetchProfile());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load profile settings.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [applyProfilePayload, fetchProfile]);

  useEffect(() => {
    let active = true;
    void fetchProfile()
      .then((payload) => {
        if (active) applyProfilePayload(payload);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Could not load profile settings.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyProfilePayload, fetchProfile]);

  function updateValue<Key extends keyof AdminProfileInput>(
    key: Key,
    value: AdminProfileInput[Key]
  ) {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateFullName(value: string) {
    const { firstName, lastName } = splitName(value);
    setValues((current) =>
      current ? { ...current, firstName, lastName, displayName: value.trim() } : current
    );
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.firstName;
      delete next.lastName;
      delete next.displayName;
      return next;
    });
  }

  async function persistProfile(nextValues: AdminProfileInput) {
    const response = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...nextValues,
        avatarUrl: nextValues.avatarPath ? null : nextValues.avatarUrl
      })
    });
    const payload = await responsePayload(response);
    if (!response.ok || !payload.profile) {
      throw new Error(payload.error || 'Could not save profile settings.');
    }

    setValues(nextValues);
    window.dispatchEvent(new Event('tlx-admin-profile-updated'));
    return payload;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) return;
    setFeedback(null);
    setFieldErrors({});

    const parsed = adminProfileInputSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setFeedback({ kind: 'error', message: parsed.error.issues[0]?.message ?? 'Review your profile details.' });
      return;
    }

    setSaving(true);
    try {
      const payload = await persistProfile(parsed.data);
      setFeedback(payload.warning
        ? { kind: 'warning', message: payload.warning }
        : { kind: 'success', message: 'Your profile changes have been saved.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not save profile settings.'
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteUploadedAvatar(path: string) {
    const response = await fetch('/api/admin/profile/avatar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Could not remove the uploaded image.');
  }

  async function handleAvatarUpload(file: File | undefined) {
    if (!file || !values || !account) return;
    setFeedback(null);

    const parsed = adminProfileInputSchema.safeParse(values);
    if (!parsed.success) {
      setFeedback({ kind: 'error', message: parsed.error.issues[0]?.message ?? 'Review your profile details before uploading an image.' });
      return;
    }

    setAvatarLoading(true);
    let uploadedPath: string | null = null;
    try {
      const response = await fetch('/api/admin/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, size: file.size })
      });
      const signed = (await response.json()) as { path?: string; token?: string; error?: string };
      if (!response.ok || !signed.path || !signed.token) {
        throw new Error(signed.error || 'Could not prepare the profile image upload.');
      }

      const supabase = createSupabaseAuthBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(ADMIN_AVATAR_BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
      uploadedPath = signed.path;

        const { data: signedImage, error: signingError } = await supabase.storage
          .from(ADMIN_AVATAR_BUCKET)
          .createSignedUrl(signed.path, 24 * 60 * 60);
        if (signingError) {
          throw new Error(`Could not display the uploaded image: ${signingError.message}`);
        }

        const nextValues = {
          ...parsed.data,
          avatarUrl: null,
          avatarPath: signed.path
        };
      const payload = await persistProfile(nextValues);
      uploadedPath = null;
        setAvatarPreviewUrl(signedImage.signedUrl);
      setFeedback(
        payload.warning
          ? { kind: 'warning', message: payload.warning }
          : { kind: 'success', message: 'Your profile photo has been updated.' }
      );
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Could not upload the profile image.';
      if (uploadedPath) {
        try {
          await deleteUploadedAvatar(uploadedPath);
        } catch (cleanupError) {
          const cleanupMessage =
            cleanupError instanceof Error ? cleanupError.message : 'Could not remove the incomplete upload.';
          message = `${message} Incomplete upload cleanup failed: ${cleanupMessage}`;
        }
      }
      setFeedback({ kind: 'error', message });
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleAvatarRemove() {
    if (!values || (!values.avatarUrl && !values.avatarPath)) return;
    const parsed = adminProfileInputSchema.safeParse({ ...values, avatarUrl: null, avatarPath: null });
    if (!parsed.success) {
      setFeedback({ kind: 'error', message: parsed.error.issues[0]?.message ?? 'Review your profile details.' });
      return;
    }

    setFeedback(null);
    setAvatarLoading(true);
    try {
      const payload = await persistProfile(parsed.data);
      setAvatarPreviewUrl('');
      setFeedback(
        payload.warning
          ? { kind: 'warning', message: payload.warning }
          : { kind: 'success', message: 'Your profile photo has been removed.' }
      );
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not remove the profile photo.'
      });
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback(null);
    if (!passwordVerified) {
      setPasswordFeedback({ kind: 'error', message: 'Verify your current password before continuing.' });
      return;
    }
    if (password.length < 8) {
      setPasswordFeedback({ kind: 'error', message: 'Use a password with at least 8 characters.' });
      return;
    }
    if (password !== passwordConfirmation) {
      setPasswordFeedback({ kind: 'error', message: 'The password confirmation does not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await createSupabaseAuthBrowserClient().auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setPassword('');
      setPasswordConfirmation('');
      setCurrentPassword('');
      setPasswordVerified(false);
      setPasswordFeedback({ kind: 'success', message: 'Your password has been updated.' });
    } catch (error) {
      setPasswordFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not update the password.'
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleCurrentPasswordVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback(null);
    if (!account) return;
    if (!currentPassword) {
      setPasswordFeedback({ kind: 'error', message: 'Enter your current password to continue.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createSupabaseAuthBrowserClient();
      const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser();
      if (currentUserError) throw new Error(currentUserError.message);
      if (currentUserData.user?.id !== account.id) {
        throw new Error('Your sign-in session has changed. Refresh the page and try again.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: currentPassword
      });
      if (error) {
        if (error.code === 'invalid_credentials') {
          setPasswordFeedback({ kind: 'error', message: 'The current password is incorrect. Please try again.' });
          return;
        }
        throw new Error(error.message);
      }
      if (!data.user || data.user.id !== account.id) {
        throw new Error('The password could not be verified for this account.');
      }

      setCurrentPassword('');
      setPasswordVerified(true);
      setPasswordFeedback({ kind: 'success', message: 'Current password verified. Enter your new password.' });
    } catch (error) {
      setPasswordFeedback({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not verify the current password.'
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className='dashboard-profile-page'>
      <header className='dashboard-profile-heading'>
        <p className='dashboard-profile-eyebrow'>TLX ORIGINALS / ADMIN CONSOLE</p>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight'>Profile &amp; account</h1>
            <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
              Manage your identity, sign-in security and account preferences.
            </p>
          </div>
          <AdminSignOut />
        </div>
      </header>

      {feedback && <FeedbackBanner feedback={feedback} />}
      {loadError && (
        <div className='dashboard-profile-feedback dashboard-profile-feedback-error' role='alert'>
          <IconAlertCircle aria-hidden className='size-4 shrink-0' />
          <span>{loadError}</span>
          <Button type='button' variant='outline' size='sm' className='ml-auto' onClick={() => void loadProfile()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className='dashboard-profile-surface flex min-h-44 items-center justify-center'>
          <span className='inline-flex items-center gap-2 text-sm text-muted-foreground'>
            <IconClock aria-hidden className='size-4 animate-pulse' />
            Loading account details…
          </span>
        </div>
      ) : account && values ? (
        <>
          <section className='dashboard-profile-hero'>
            <div className='dashboard-profile-avatar-wrap'>
              <Avatar className='size-20 rounded-2xl border border-white/15'>
                <AvatarImage src={avatarPreviewUrl} alt={`${displayName} profile photo`} />
                <AvatarFallback className='rounded-2xl bg-sidebar-primary text-xl font-medium text-sidebar-primary-foreground'>
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='truncate text-xl font-semibold tracking-tight'>{displayName}</h2>
                <span className='dashboard-profile-badge'><IconShieldCheck aria-hidden className='size-3.5' />{account.role}</span>
              </div>
              <p className='mt-1 truncate text-sm text-muted-foreground'>{account.email}</p>
              <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground'>
                <span className='inline-flex items-center gap-1.5'>
                  <span className='size-1.5 rounded-full bg-muted-foreground/55' />
                  {account.status}
                </span>
                <span className='inline-flex items-center gap-1.5'>
                  <IconCalendar aria-hidden className='size-3.5' />
                  Joined {formatAccountDate(account.createdAt, values.timezone)}
                </span>
              </div>
            </div>
            <Button
              type='button'
              variant='outline'
              className='shrink-0'
              onClick={() => {
                setSection('personal');
                document.getElementById('profile-settings-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Edit profile
            </Button>
          </section>

          <div className='dashboard-profile-layout'>
            <nav className='dashboard-profile-nav' aria-label='Account settings'>
              {navigation.map(({ id, label, description, icon: Icon }) => (
                <button
                  type='button'
                  key={id}
                  className='dashboard-profile-nav-item'
                  aria-current={section === id ? 'page' : undefined}
                  onClick={() => setSection(id)}
                >
                  <Icon aria-hidden className='size-[18px] shrink-0' />
                  <span className='min-w-0 flex-1'>
                    <span className='block text-sm font-medium'>{label}</span>
                    <span className='mt-1 block text-xs text-muted-foreground'>{description}</span>
                  </span>
                </button>
              ))}
            </nav>

            <section id='profile-settings-panel' className='dashboard-profile-surface min-w-0'>
              {section === 'personal' && (
                <div>
                  <SectionHeading
                    title='Personal information'
                    description='Keep your administrator identity and contact details up to date.'
                  />
                  <div className='dashboard-profile-photo-row'>
                    <div className='flex min-w-0 items-center gap-3'>
                      <Avatar className='size-12 rounded-xl'>
                        <AvatarImage src={avatarPreviewUrl} alt={displayName} />
                        <AvatarFallback className='rounded-xl bg-sidebar-accent text-sidebar-accent-foreground'>
                          {displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0'>
                        <p className='text-sm font-medium'>Profile photo</p>
                        <p className='mt-1 text-xs text-muted-foreground'>JPEG, PNG, WebP or AVIF · up to 5 MB</p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/jpeg,image/png,image/webp,image/avif'
                      className='sr-only'
                      aria-label='Choose a profile photo'
                      disabled={busy || Boolean(loadError)}
                      onChange={(event) => void handleAvatarUpload(event.currentTarget.files?.[0])}
                    />
                    <div className='flex shrink-0 items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={busy || Boolean(loadError)}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {avatarLoading ? <IconClock aria-hidden className='size-4 animate-pulse' /> : <IconUpload aria-hidden className='size-4' />}
                        {values.avatarUrl || values.avatarPath ? 'Replace' : 'Upload'}
                      </Button>
                      {(values.avatarUrl || values.avatarPath) && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          aria-label='Remove profile photo'
                          title='Remove profile photo'
                          disabled={busy || Boolean(loadError)}
                          onClick={() => void handleAvatarRemove()}
                        >
                          <IconTrash aria-hidden className='size-4' />
                        </Button>
                      )}
                    </div>
                  </div>

                  <form className='dashboard-profile-form' onSubmit={(event) => void handleSave(event)}>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <ProfileField
                        id='profile-full-name'
                        label='Full name'
                        required
                        error={fieldErrors.firstName || fieldErrors.lastName || fieldErrors.displayName}
                        className='sm:col-span-2'
                      >
                        <Input
                          id='profile-full-name'
                          autoComplete='name'
                          placeholder='Enter your full name'
                          required
                          maxLength={100}
                          aria-invalid={Boolean(fieldErrors.firstName || fieldErrors.lastName || fieldErrors.displayName)}
                          value={profileName(values)}
                          disabled={busy || Boolean(loadError)}
                          onChange={(event) => updateFullName(event.currentTarget.value)}
                        />
                      </ProfileField>
                      <ProfileField
                        id='profile-email'
                        label='Email address'
                        hint={account.emailVerified ? 'Verified email address' : 'This address has not been verified.'}
                      >
                        <div className='relative'>
                          <IconMail aria-hidden className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                          <Input
                            id='profile-email'
                            type='email'
                            autoComplete='email'
                            placeholder='Enter your email address'
                            readOnly
                            aria-readonly='true'
                            value={account.email}
                            disabled={busy || Boolean(loadError)}
                            className='pl-9'
                          />
                        </div>
                      </ProfileField>
                      <ProfileField id='profile-phone' label='Phone number' hint='Use the international format, including country code.' error={fieldErrors.phoneNumber}>
                        <div className='relative'>
                          <IconPhone aria-hidden className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
                          <Input
                            id='profile-phone'
                            type='tel'
                            autoComplete='tel'
                            placeholder='+234 801 234 5678'
                            maxLength={32}
                            aria-invalid={Boolean(fieldErrors.phoneNumber)}
                            value={values.phoneNumber}
                            disabled={busy || Boolean(loadError)}
                            className='pl-9'
                            onChange={(event) => updateValue('phoneNumber', event.currentTarget.value)}
                          />
                        </div>
                      </ProfileField>
                    </div>
                    <div className='dashboard-profile-form-footer'>
                      <p className='text-xs text-muted-foreground'>
                        Your email address is managed by your authentication provider.
                      </p>
                      <Button type='submit' disabled={busy || Boolean(loadError)}>
                        {saving ? <IconClock aria-hidden className='size-4 animate-pulse' /> : <IconDeviceFloppy aria-hidden className='size-4' />}
                        Save changes
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {section === 'security' && (
                <div>
                  <SectionHeading
                    title='Security'
                    description='Review authentication for this account and keep your sign-in secure.'
                  />
                  <div className='dashboard-profile-security-list'>
                    <SecurityRow
                      icon={<IconMail aria-hidden className='size-4' />}
                      title='Email verification'
                      detail={account.email}
                      status={account.emailVerified ? 'Verified' : 'Not verified'}
                      positive={account.emailVerified}
                    />
                    <SecurityRow
                      icon={<IconLock aria-hidden className='size-4' />}
                      title='Sign-in provider'
                      detail={account.providers.length ? account.providers.join(', ') : 'Supabase Auth'}
                      status='Connected'
                      positive
                    />
                  </div>

                  <div className='dashboard-profile-subsection'>
                    <h3 className='text-base font-semibold'>Change password</h3>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Verify your current password before choosing a replacement.
                    </p>
                    <form
                      className='dashboard-profile-form mt-5'
                      onSubmit={(event) =>
                        void (passwordVerified
                          ? handlePasswordUpdate(event)
                          : handleCurrentPasswordVerification(event))
                      }
                    >
                      {passwordVerified ? (
                        <div className='grid gap-4 sm:grid-cols-2'>
                          <ProfileField id='profile-new-password' label='New password'>
                            <div className='relative'>
                              <Input
                                id='profile-new-password'
                                type={showNewPassword ? 'text' : 'password'}
                                autoComplete='new-password'
                                placeholder='Enter a new password'
                                minLength={8}
                                required
                                value={password}
                                disabled={passwordLoading || Boolean(loadError)}
                                className='pr-10'
                                onChange={(event) => {
                                  setPassword(event.currentTarget.value);
                                  setPasswordFeedback(null);
                                }}
                              />
                              <button
                                type='button'
                                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                aria-pressed={showNewPassword}
                                aria-controls='profile-new-password'
                                className='absolute top-0 right-0 inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                onClick={() => setShowNewPassword((visible) => !visible)}
                              >
                                {showNewPassword ? <EyeOff className='size-4' aria-hidden /> : <Eye className='size-4' aria-hidden />}
                              </button>
                            </div>
                          </ProfileField>
                          <ProfileField id='profile-confirm-password' label='Confirm new password'>
                            <div className='relative'>
                              <Input
                                id='profile-confirm-password'
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                autoComplete='new-password'
                                placeholder='Confirm your new password'
                                minLength={8}
                                required
                                value={passwordConfirmation}
                                disabled={passwordLoading || Boolean(loadError)}
                                className='pr-10'
                                onChange={(event) => {
                                  setPasswordConfirmation(event.currentTarget.value);
                                  setPasswordFeedback(null);
                                }}
                              />
                              <button
                                type='button'
                                aria-label={showPasswordConfirmation ? 'Hide confirmation password' : 'Show confirmation password'}
                                aria-pressed={showPasswordConfirmation}
                                aria-controls='profile-confirm-password'
                                className='absolute top-0 right-0 inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                onClick={() => setShowPasswordConfirmation((visible) => !visible)}
                              >
                                {showPasswordConfirmation ? <EyeOff className='size-4' aria-hidden /> : <Eye className='size-4' aria-hidden />}
                              </button>
                            </div>
                          </ProfileField>
                        </div>
                      ) : (
                        <ProfileField
                          id='profile-current-password'
                          label='Current password'
                          required
                          className='sm:max-w-md'
                        >
                          <div className='relative'>
                            <Input
                              id='profile-current-password'
                              type={showCurrentPassword ? 'text' : 'password'}
                              autoComplete='current-password'
                              placeholder='Enter your current password'
                              required
                              value={currentPassword}
                              aria-invalid={passwordFeedback?.kind === 'error'}
                              disabled={passwordLoading || Boolean(loadError)}
                              className='pr-10'
                              onChange={(event) => {
                                setCurrentPassword(event.currentTarget.value);
                                setPasswordFeedback(null);
                              }}
                            />
                            <button
                              type='button'
                              aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                              aria-pressed={showCurrentPassword}
                              aria-controls='profile-current-password'
                              className='absolute top-0 right-0 inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                              onClick={() => setShowCurrentPassword((visible) => !visible)}
                            >
                              {showCurrentPassword ? <EyeOff className='size-4' aria-hidden /> : <Eye className='size-4' aria-hidden />}
                            </button>
                          </div>
                        </ProfileField>
                      )}
                      {passwordFeedback && <FeedbackBanner feedback={passwordFeedback} />}
                      <div className='dashboard-profile-form-footer'>
                        <p className='text-xs text-muted-foreground'>
                          {passwordVerified
                            ? 'Use at least 8 characters. Your project’s Auth password rules still apply.'
                            : 'Enter your current password to continue.'}
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          <Button type='submit' variant='outline' disabled={passwordLoading || Boolean(loadError)}>
                            {passwordLoading
                              ? <IconClock aria-hidden className='size-4 animate-pulse' />
                              : passwordVerified
                                ? <IconDeviceFloppy aria-hidden className='size-4' />
                                : <IconLock aria-hidden className='size-4' />}
                            {passwordLoading
                              ? passwordVerified ? 'Updating…' : 'Verifying…'
                              : passwordVerified ? 'Update password' : 'Continue'}
                          </Button>
                          {passwordVerified && (
                            <Button
                              type='button'
                              variant='ghost'
                              disabled={passwordLoading}
                              onClick={() => {
                                setCurrentPassword('');
                                setPassword('');
                                setPasswordConfirmation('');
                                setPasswordVerified(false);
                                setPasswordFeedback(null);
                                setShowCurrentPassword(false);
                                setShowNewPassword(false);
                                setShowPasswordConfirmation(false);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                  <p className='mt-5 text-xs leading-relaxed text-muted-foreground'>
                    Session revocation controls are not available in the connected authentication provider and are not shown here.
                  </p>
                </div>
              )}

              {section === 'preferences' && (
                <div>
                  <SectionHeading
                    title='Preferences'
                    description='Choose your admin time zone and the currency shown on the storefront.'
                  />
                  <form className='dashboard-profile-form' onSubmit={(event) => void handleSave(event)}>
                    <ProfileField id='profile-timezone' label='Time zone' hint='Used to format account dates in the dashboard.' error={fieldErrors.timezone}>
                      <select
                        id='profile-timezone'
                        className='dashboard-profile-select'
                        value={values.timezone}
                        aria-invalid={Boolean(fieldErrors.timezone)}
                        disabled={busy || Boolean(loadError)}
                        onChange={(event) => updateValue('timezone', event.currentTarget.value)}
                      >
                        {!timeZoneOptions.includes(values.timezone) && (
                          <option value={values.timezone}>{values.timezone}</option>
                        )}
                        {timeZoneOptions.map((timeZone) => (
                          <option key={timeZone} value={timeZone}>{timeZone.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                    </ProfileField>
                    <div className='dashboard-profile-form-footer'>
                      <p className='text-xs text-muted-foreground'>
                        Your preference is stored with your profile and used for account dates.
                      </p>
                      <Button type='submit' disabled={busy || Boolean(loadError)}>
                        {saving ? <IconClock aria-hidden className='size-4 animate-pulse' /> : <IconDeviceFloppy aria-hidden className='size-4' />}
                        Save preference
                      </Button>
                    </div>
                  </form>
                  <StorefrontCurrencyPreference />
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ProfileField({
  id,
  label,
  hint,
  required,
  error,
  className,
  children
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid content-start gap-2 ${className ?? ''}`}>
      <label htmlFor={id} className='text-sm font-medium'>
        {label}{required && <span className='ml-1 text-destructive'>*</span>}
      </label>
      {children}
      {error && <p className='text-xs text-destructive' role='alert'>{error}</p>}
      {hint && <p className='text-xs leading-relaxed text-muted-foreground'>{hint}</p>}
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className='dashboard-profile-section-heading'>
      <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
    </div>
  );
}

function SecurityRow({
  icon,
  title,
  detail,
  status,
  positive
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  status: string;
  positive: boolean;
}) {
  return (
    <div className='dashboard-profile-security-row'>
      <span className='dashboard-profile-security-icon'>{icon}</span>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium'>{title}</p>
        <p className='mt-1 truncate text-xs text-muted-foreground'>{detail}</p>
      </div>
      <span className={positive ? 'dashboard-profile-security-status is-positive' : 'dashboard-profile-security-status'}>
        {positive && <IconCheck aria-hidden className='size-3.5' />}
        {status}
      </span>
    </div>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  const Icon =
    feedback.kind === 'success'
      ? IconCircleCheck
      : feedback.kind === 'warning'
        ? IconAlertCircle
        : IconAlertCircle;
  return (
    <div
      className={`dashboard-profile-feedback dashboard-profile-feedback-${feedback.kind}`}
      role={feedback.kind === 'error' ? 'alert' : 'status'}
    >
      <Icon aria-hidden className='size-4 shrink-0' />
      <span>{feedback.message}</span>
    </div>
  );
}
