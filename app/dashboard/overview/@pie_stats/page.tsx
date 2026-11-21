import { delay } from '@dashboard/constants/mock-api';
import { PieGraph } from '@dashboard/features/overview/components/pie-graph';

export default async function Stats() {

  await delay(1000);
  return <PieGraph />;
}
