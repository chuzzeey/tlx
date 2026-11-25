'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@dashboard/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@dashboard/components/ui/alert-dialog';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';

export default function AdminSignOut({
  renderTrigger
}: {
  renderTrigger?: (onClick: () => void) => ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      const { error } = await createSupabaseAuthBrowserClient().auth.signOut();
      if (error) {
        toast.error(`Sign out failed: ${error.message}`);
        return;
      }
      window.location.assign('/auth/sign-in');
    } catch (error) {
      toast.error(error instanceof Error ? `Sign out failed: ${error.message}` : 'Sign out failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {renderTrigger
        ? renderTrigger(() => {
            void signOut();
          })
        : (
          <Button
            type='button'
            variant='outline'
            disabled={pending}
            onClick={() => setConfirming(true)}
          >
            Sign out
          </Button>
        )}
      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!pending) setConfirming(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of the admin dashboard and returned to the sign-in page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void signOut();
              }}
            >
              {pending ? 'Signing out…' : 'Yes, sign out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
