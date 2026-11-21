'use client';
import { Button } from '@dashboard/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@dashboard/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@dashboard/components/user-avatar-profile';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';
import { useSupabaseAuthUser } from '@dashboard/lib/supabase-auth-user';
import { useRouter } from 'next/navigation';
export function UserNav() {
  const user = useSupabaseAuthUser();
  const router = useRouter();
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant='ghost' className='relative h-8 w-8 rounded-full' />}
        >
          <UserAvatarProfile user={user} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' sideOffset={10}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm leading-none font-medium'>{user.fullName}</p>
                <p className='text-muted-foreground text-xs leading-none'>
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>New Team</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={async () => {
                const { error } = await createSupabaseAuthBrowserClient().auth.signOut();
                if (error) {
                  console.error('Supabase sign-out failed.', error.message);
                  return;
                }
                window.location.assign('/auth/sign-in');
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
