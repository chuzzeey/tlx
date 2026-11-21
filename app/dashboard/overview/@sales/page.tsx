import { delay } from '@dashboard/constants/mock-api';
import { RecentSales } from '@dashboard/features/overview/components/recent-sales';

export default async function Sales() {

  await delay(3000);
  return <RecentSales />;
}
