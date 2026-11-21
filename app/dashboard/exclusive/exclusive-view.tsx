import PageContainer from '@dashboard/components/layout/page-container';

export default function ExclusiveView() {
  return (
    <PageContainer pageTitle='Store tools'>
      <p className='text-sm text-muted-foreground'>
        This starter-template page is not part of TLX store administration.
      </p>
    </PageContainer>
  );
}
