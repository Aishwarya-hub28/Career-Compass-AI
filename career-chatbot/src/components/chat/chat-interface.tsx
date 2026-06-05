import React, { useState, useRef, useEffect } from 'react';
import { useChatStream, type Attachment } from '@/hooks/use-chat-stream';
import { Markdown } from '@/lib/markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, User, Sparkles, Compass, Lightbulb, Briefcase, Stethoscope, Landmark, GraduationCap, Wrench, Paperclip, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateGeminiConversation, getListGeminiConversationsQueryKey } from '@workspace/api-client-react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

export function ChatArea({ conversationId }: { conversationId?: number }) {
  const { messages, isLoadingHistory, isStreaming, sendMessage } = useChatStream(conversationId, 'career');
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateGeminiConversation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

    files.forEach((file) => {
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Max 10 MB.`);
        return;
      }
      if (!allowed.includes(file.type)) {
        alert(`${file.name}: unsupported format. Use images, PDF, or plain text.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setPendingFiles((prev) => [...prev, { data: base64, mimeType: file.type, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingFiles.length === 0) || isStreaming) return;

    const messageText = input.trim() || (pendingFiles.length > 0 ? `Please analyze ${pendingFiles.map(f => f.name).join(', ')}` : '');

    if (!conversationId) {
      createMutation.mutate(
        { data: { title: messageText.substring(0, 40) + (messageText.length > 40 ? '...' : '') } },
        {
          onSuccess: (newConv) => {
            queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
            setLocation(`/c/${newConv.id}`);
            sessionStorage.setItem('pending_message', messageText);
            if (pendingFiles.length > 0) {
              sessionStorage.setItem('pending_files', JSON.stringify(pendingFiles));
            }
          }
        }
      );
      return;
    }

    sendMessage(messageText, pendingFiles.length > 0 ? pendingFiles : undefined);
    setInput('');
    setPendingFiles([]);
  };

  useEffect(() => {
    if (conversationId && messages.length === 0 && !isLoadingHistory && !isStreaming) {
      const pendingMsg = sessionStorage.getItem('pending_message');
      if (pendingMsg) {
        sessionStorage.removeItem('pending_message');
        const filesJson = sessionStorage.getItem('pending_files');
        let files: Attachment[] | undefined;
        if (filesJson) {
          sessionStorage.removeItem('pending_files');
          try { files = JSON.parse(filesJson); } catch { files = undefined; }
        }
        sendMessage(pendingMsg, files);
      }
    }
  }, [conversationId, messages.length, isLoadingHistory, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const displayMessages = [...messages];
  if (conversationId && displayMessages.length === 0 && !isLoadingHistory && !isStreaming) {
    displayMessages.push({
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! I'm CareerPath AI. I'm here to help you navigate your professional journey, whether you're a student deciding on streams, a professional looking for growth, or someone considering a complete career change.\n\nYou can also **attach files or images** — share your resume, certificates, or marksheets for analysis.\n\nTo get started, could you tell me a little bit about your current situation and what your goals are?",
      createdAt: new Date().toISOString(),
    });
  }

  const canSend = (input.trim().length > 0 || pendingFiles.length > 0) && !isStreaming && !(!conversationId && createMutation.isPending);

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
          {!conversationId ? (
            <WelcomeState onPromptClick={(prompt) => setInput(prompt)} />
          ) : isLoadingHistory ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Loading conversation…</div>
          ) : (
            <>
              {displayMessages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={cn(
                    "flex gap-4 w-full animate-in slide-in-from-bottom-2 fade-in duration-300",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div className={cn(
                    "px-5 py-4 rounded-2xl max-w-[90%] sm:max-w-[80%] shadow-sm",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm text-card-foreground"
                  )}>
                    {msg.role === 'user' ? (
                      <div className="space-y-2">
                        {msg.attachments?.map((att, ai) => (
                          <AttachmentPreview key={ai} att={att} />
                        ))}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ) : (
                      <Markdown content={msg.content} />
                    )}

                    {msg.isStreaming && (
                      <div className="flex gap-1 mt-3 items-center text-muted-foreground h-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} className="h-4" />
            </>
          )}
        </div>
      </div>

      <div className="p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <div className="max-w-3xl mx-auto">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-2">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5 text-xs font-medium text-foreground max-w-[200px]">
                  {f.mimeType.startsWith('image/') ? <Image className="w-3.5 h-3.5 shrink-0 text-primary" /> : <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />}
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-muted-foreground hover:text-destructive shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-card border border-border shadow-sm hover:shadow-md rounded-2xl p-2 focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-xl h-10 w-10 shrink-0 mb-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file or image"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={conversationId ? "Ask for career advice, or attach a file…" : "What's on your mind regarding your career?"}
              className="min-h-[44px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 py-3 bg-transparent text-base"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              className={cn(
                "rounded-xl h-10 w-10 shrink-0 mb-1 transition-all duration-300",
                canSend ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" : "bg-muted text-muted-foreground hover:bg-muted"
              )}
              disabled={!canSend}
            >
              <SendHorizontal className="w-5 h-5" />
            </Button>
          </form>
          <div className="text-center mt-3">
            <span className="text-xs text-muted-foreground/70">
              CareerPath AI provides guidance based on general industry knowledge, not professional counseling.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttachmentPreview({ att }: { att: Attachment }) {
  if (att.mimeType.startsWith('image/')) {
    return (
      <img
        src={`data:${att.mimeType};base64,${att.data}`}
        alt={att.name}
        className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-white/20"
      />
    );
  }
  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs">
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-[160px]">{att.name}</span>
    </div>
  );
}

function WelcomeState({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  const prompts = [
    { title: "Student Streams", desc: "What can I do after 12th Commerce?", prompt: "I am a 12th Commerce student and I'm unsure what degree to pursue next. What are my options?" },
    { title: "Passion vs Reality", desc: "I love art but my parents want engineering", prompt: "I really want to pursue a career in art/design, but my parents are pushing me towards engineering. How can I handle this and what are practical art careers?" },
    { title: "Career Changer", desc: "I'm 28 and want to change careers", prompt: "I am 28 years old and feeling stuck in my current job. I want to change careers entirely but don't know where to start. Any advice?" },
    { title: "Tech Careers", desc: "Best tech careers without coding?", prompt: "I want to work in the tech industry because of the growth, but I don't want to learn how to code. What are the best roles for me?" }
  ];

  const categories = [
    { name: "Technology", icon: <Lightbulb className="w-3 h-3" />, prompt: "What are the most promising technology careers in the next 5 years for a beginner?" },
    { name: "Creative", icon: <Sparkles className="w-3 h-3" />, prompt: "How can I build a stable career in creative fields like design or writing?" },
    { name: "Business", icon: <Briefcase className="w-3 h-3" />, prompt: "What are good business roles that don't require an MBA?" },
    { name: "Healthcare", icon: <Stethoscope className="w-3 h-3" />, prompt: "What are some rewarding healthcare careers that require less than 4 years of college?" },
    { name: "Finance", icon: <Landmark className="w-3 h-3" />, prompt: "How do I start a career in finance if my background is not in accounting?" },
    { name: "Education", icon: <GraduationCap className="w-3 h-3" />, prompt: "I want to teach but not in a traditional school setting. What are my options?" },
    { name: "Skilled Trades", icon: <Wrench className="w-3 h-3" />, prompt: "What are the highest paying skilled trades and how do I get an apprenticeship?" },
  ];

  return (
    <div className="flex flex-col items-center justify-center mt-6 sm:mt-16 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-6">
        <Compass className="w-10 h-10 text-primary-foreground -rotate-3" />
      </div>

      <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
        Your career, <span className="text-primary">your path.</span>
      </h1>

      <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed">
        Let's find it together. Get personalized advice — chat, or attach a resume/certificate to analyze.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-12 max-w-2xl">
        {categories.map((cat, i) => (
          <button
            key={i}
            onClick={() => onPromptClick(cat.prompt)}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 font-medium rounded-full text-sm transition-colors border border-secondary/20 hover:border-secondary/40"
            style={{ color: 'hsl(var(--secondary))' }}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onPromptClick(p.prompt)}
            className="p-5 border border-border rounded-2xl bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300 text-left group flex flex-col gap-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors relative z-10">{p.title}</span>
            <span className="text-sm text-muted-foreground relative z-10 leading-relaxed">{p.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
