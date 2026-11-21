import PageContainer from '@dashboard/components/layout/page-container';

export default function BillingView() {
  return (
    <PageContainer pageTitle='Billing' pageDescription='Store billing is not configured.'>
      <p className='text-sm text-muted-foreground'>
        Billing management is not available in the TLX admin dashboard.
      </p>
    </PageContainer>
  );
}
