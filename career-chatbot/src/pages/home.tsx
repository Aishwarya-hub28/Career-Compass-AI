import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/layout/sidebar";
import { ChatArea } from "@/components/chat/chat-interface";
import { useParams } from "wouter";

export default function Home() {
  const params = useParams();
  const conversationId = params.id ? parseInt(params.id) : undefined;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        <ChatSidebar />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center p-4 border-b border-border bg-background">
            <SidebarTrigger className="mr-4" />
            <h1 className="font-semibold text-primary">CareerPath AI</h1>
          </header>
          
          {/* Chat Area */}
          <div className="flex-1 overflow-hidden relative">
            <ChatArea conversationId={conversationId} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
