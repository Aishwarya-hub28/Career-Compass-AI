import { useLocation, useParams } from 'wouter';
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  useDeleteGeminiConversation,
  getListGeminiConversationsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { MessageSquare, PlusCircle, Trash2, Compass, ArrowRight, FileText, Map } from 'lucide-react';
import { format } from 'date-fns';

export function ChatSidebar() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const currentId = params.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useListGeminiConversations();
  const createMutation = useCreateGeminiConversation();
  const deleteMutation = useDeleteGeminiConversation();

  const handleNewChat = () => {
    createMutation.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
          setLocation(`/c/${newConv.id}`);
        }
      }
    );
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
            if (currentId === id) setLocation('/');
          }
        }
      );
    }
  };

  const isResumePage = location === '/resume';

  return (
    <Sidebar variant="inset" className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-5 flex flex-col gap-3">
        <div
          className="flex items-center gap-3 px-1 cursor-pointer"
          onClick={() => setLocation('/')}
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">CareerPath</span>
        </div>

        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 rounded-xl h-11 font-medium transition-all"
          variant="outline"
          disabled={createMutation.isPending}
        >
          <PlusCircle className="w-5 h-5" />
          New Journey
        </Button>

        <Button
          onClick={() => setLocation('/resume')}
          className={`w-full justify-start gap-2 shadow-none border rounded-xl h-10 font-medium transition-all text-sm ${
            isResumePage
              ? 'bg-secondary/20 text-secondary border-secondary/30'
              : 'bg-secondary/5 text-secondary hover:bg-secondary/15 border-secondary/20'
          }`}
          variant="outline"
        >
          <FileText className="w-4 h-4" />
          Build Resume
        </Button>

        <Button
          onClick={() => setLocation('/roadmap')}
          className={`w-full justify-start gap-2 shadow-none border rounded-xl h-10 font-medium transition-all text-sm ${
            location === '/roadmap'
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'bg-primary/5 text-primary hover:bg-primary/10 border-primary/15'
          }`}
          variant="outline"
        >
          <Map className="w-4 h-4" />
          Career Roadmap
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
            Recent Conversations
          </SidebarGroupLabel>
          <SidebarMenu>
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground animate-pulse">Loading past chats…</div>
            ) : conversations.length === 0 ? (
              <div className="px-2 py-8 flex flex-col items-center text-center text-muted-foreground animate-in fade-in duration-500">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5 text-accent-foreground" />
                </div>
                <p className="text-sm mb-4 leading-relaxed px-4">Your career journey starts here. Let's find your path.</p>
                <Button
                  variant="link"
                  onClick={handleNewChat}
                  className="text-primary h-auto p-0 font-semibold gap-1"
                >
                  Start chatting <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              conversations.map(conv => (
                <SidebarMenuItem key={conv.id} className="mb-1">
                  <SidebarMenuButton
                    isActive={currentId === conv.id}
                    onClick={() => setLocation(`/c/${conv.id}`)}
                    className="group flex justify-between items-center w-full h-11 rounded-xl data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50 group-data-[active=true]:opacity-100 group-data-[active=true]:text-primary" />
                      <span className="truncate text-[15px]">{conv.title || "New Conversation"}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 ml-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-lg transition-all"
                      onClick={(e) => handleDelete(e, conv.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
