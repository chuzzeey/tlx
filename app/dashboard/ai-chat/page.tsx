import PageContainer from '@dashboard/components/layout/page-container';
import { AiChatDemo } from '@dashboard/features/ai-chat/components/ai-chat-demo';

export const metadata = {
  title: 'Dashboard: AI Chat'
};

export default async function Page() {

  return (
    <PageContainer>
      <AiChatDemo />
    </PageContainer>
  );
}
