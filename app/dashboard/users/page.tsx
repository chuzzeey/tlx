import PageContainer from '@dashboard/components/layout/page-container';
import UserListingPage from '@dashboard/features/users/components/user-listing';
import { searchParamsCache } from '@dashboard/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { usersInfoContent } from '@dashboard/features/users/info-content';
import { UserFormSheetTrigger } from '@dashboard/features/users/components/user-form-sheet';

export const metadata = {
  title: 'Dashboard: Users'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function UsersPage(props: PageProps) {

  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Users'
      pageDescription='Manage users (React Query + nuqs table pattern.)'
      infoContent={usersInfoContent}
      pageHeaderAction={<UserFormSheetTrigger />}
    >
      <UserListingPage />
    </PageContainer>
  );
}
