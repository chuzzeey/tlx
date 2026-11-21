import { delay } from '@dashboard/constants/mock-api';
import { BarGraph } from '@dashboard/features/overview/components/bar-graph';

export default async function BarStats() {

  await delay(1000);

  return <BarGraph />;
}
