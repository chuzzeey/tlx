import PageContainer from '@dashboard/components/layout/page-container';

export default function WorkspacesView() {
  return (
    <PageContainer pageTitle='Workspaces'>
      <p className='text-sm text-muted-foreground'>
        The TLX admin uses individual Supabase Auth accounts; workspace management is not enabled.
      </p>
    </PageContainer>
  );
}
