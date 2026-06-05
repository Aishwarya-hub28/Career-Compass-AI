import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListGeminiMessages,
  getListGeminiMessagesQueryKey,
  getListGeminiConversationsQueryKey
} from '@workspace/api-client-react';

export interface Attachment {
  data: string;
  mimeType: string;
  name: string;
}

export interface Message {
  id: number | string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  attachments?: Attachment[];
  resumeData?: ResumeData;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
    grade?: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  skills: { technical: string[]; soft: string[] };
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  certifications?: Array<{ name: string; issuer: string; year: string }>;
  achievements?: string[];
}

function extractResumeData(text: string): ResumeData | null {
  const match = text.match(/<RESUME_DATA>([\s\S]*?)<\/RESUME_DATA>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as ResumeData;
  } catch {
    return null;
  }
}

function stripResumeTag(text: string): string {
  return text.replace(/<RESUME_DATA>[\s\S]*?<\/RESUME_DATA>/g, '').trim();
}

export function useChatStream(conversationId?: number, mode?: 'career' | 'resume') {
  const queryClient = useQueryClient();
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<Message | null>(null);
  const [latestResumeData, setLatestResumeData] = useState<ResumeData | null>(null);

  const { data: serverMessages = [], isLoading: isLoadingHistory } = useListGeminiMessages(
    conversationId!,
    { query: { enabled: !!conversationId } }
  );

  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    if (!conversationId) return;

    const tempUserId = `temp-${Date.now()}`;
    setOptimisticUserMessage({
      id: tempUserId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      attachments,
    });

    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
      const modeParam = mode ? `?mode=${mode}` : '';
      const resp = await fetch(
        `${BASE}/api/gemini/conversations/${conversationId}/messages${modeParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, attachments }),
        }
      );

      if (!resp.ok) throw new Error('Failed to send message');

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.done) {
                const resumeData = extractResumeData(accumulated);
                if (resumeData) setLatestResumeData(resumeData);

                setOptimisticUserMessage(null);
                setStreamingMessage('');
                setIsStreaming(false);
                queryClient.invalidateQueries({ queryKey: getListGeminiMessagesQueryKey(conversationId) });
                queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
              } else if (json.content) {
                accumulated += json.content;
                setStreamingMessage(stripResumeTag(accumulated));
              }
            } catch (e) {
              console.error("SSE parse error", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setIsStreaming(false);
      setOptimisticUserMessage(null);
    }
  }, [conversationId, mode, queryClient]);

  const messages: Message[] = serverMessages.map((m) => {
    const rd = extractResumeData(m.content);
    return {
      ...m,
      content: stripResumeTag(m.content),
      resumeData: rd ?? undefined,
    };
  });

  if (optimisticUserMessage) messages.push(optimisticUserMessage);
  if (isStreaming) {
    messages.push({
      id: 'streaming-assistant',
      role: 'assistant',
      content: streamingMessage,
      createdAt: new Date().toISOString(),
      isStreaming: true,
    });
  }

  return { messages, isLoadingHistory, isStreaming, sendMessage, latestResumeData };
}
