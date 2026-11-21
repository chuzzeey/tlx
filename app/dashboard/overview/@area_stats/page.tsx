import { delay } from '@dashboard/constants/mock-api';
import { AreaGraph } from '@dashboard/features/overview/components/area-graph';

export default async function AreaStats() {

  await delay(2000);
  return <AreaGraph />;
}
