import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/lib/markdown';
import { useChatStream, type Attachment, type ResumeData } from '@/hooks/use-chat-stream';
import { useCreateGeminiConversation, getListGeminiConversationsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { generateResumePDF, generateResumeDocx } from '@/lib/resume-export';
import {
  ArrowLeft, SendHorizontal, User, Sparkles, FileText, Download,
  Paperclip, X, Image, FileDown, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

export default function ResumeBuilderPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createMutation = useCreateGeminiConversation();
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSentInitialRef = useRef(false);

  const { messages, isLoadingHistory, isStreaming, sendMessage, latestResumeData } = useChatStream(
    conversationId,
    'resume'
  );

  const resumeData = useMemo<ResumeData | null>(() => {
    if (latestResumeData) return latestResumeData;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].resumeData) return messages[i].resumeData!;
    }
    return null;
  }, [latestResumeData, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const startBuilder = useCallback(() => {
    if (started) return;
    setStarted(true);
    createMutation.mutate(
      { data: { title: 'Resume Builder Session' } },
      {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
          setConversationId(newConv.id);
        }
      }
    );
  }, [started, createMutation, queryClient]);

  useEffect(() => {
    if (
      conversationId &&
      messages.length === 0 &&
      !isLoadingHistory &&
      !isStreaming &&
      !hasSentInitialRef.current
    ) {
      hasSentInitialRef.current = true;
      sendMessage("Hello, I want to build my resume.");
    }
  }, [conversationId, messages.length, isLoadingHistory, isStreaming, sendMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { alert(`${file.name} too large (max 10 MB)`); return; }
      if (!allowed.includes(file.type)) { alert(`Unsupported format: ${file.name}`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPendingFiles((prev) => [...prev, { data: base64, mimeType: file.type, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && pendingFiles.length === 0) || isStreaming || !conversationId) return;
    const text = input.trim() || `Please analyze ${pendingFiles.map(f => f.name).join(', ')}`;
    sendMessage(text, pendingFiles.length > 0 ? pendingFiles : undefined);
    setInput('');
    setPendingFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleDownloadPDF = async () => {
    if (!resumeData) return;
    setIsExporting('pdf');
    try { await generateResumePDF(resumeData); }
    catch (err) { console.error('PDF export failed', err); }
    finally { setIsExporting(null); }
  };

  const handleDownloadDocx = async () => {
    if (!resumeData) return;
    setIsExporting('docx');
    try { await generateResumeDocx(resumeData); }
    catch (err) { console.error('DOCX export failed', err); }
    finally { setIsExporting(null); }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Resume Builder</h1>
              <p className="text-xs text-muted-foreground">AI-guided • PDF & Word export</p>
            </div>
          </div>
        </div>
        {resumeData && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadDocx}
              disabled={!!isExporting}
              className="gap-1.5 h-8 text-xs"
            >
              {isExporting === 'docx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              Word
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={!!isExporting}
              className="gap-1.5 h-8 text-xs"
            >
              {isExporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              PDF
            </Button>
          </div>
        )}
      </header>

      <div className={cn("flex flex-1 min-h-0", resumeData ? "gap-0" : "")}>
        <div className={cn("flex flex-col min-h-0", resumeData ? "w-1/2 border-r border-border" : "w-full")}>
          {!started ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Build Your Resume</h2>
              <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
                Our AI will guide you through creating a professional resume by asking you the right questions. Download as PDF or Word when done.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left max-w-lg w-full">
                {[
                  { step: '1', title: 'Answer questions', desc: 'AI asks about your background, skills & experience' },
                  { step: '2', title: 'AI writes it', desc: 'Professional descriptions crafted for you' },
                  { step: '3', title: 'Download', desc: 'Get your resume as PDF or Word document' },
                ].map((s) => (
                  <div key={s.step} className="p-4 rounded-xl bg-card border border-border">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mb-2">{s.step}</div>
                    <p className="text-sm font-semibold mb-1">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
              <Button onClick={startBuilder} size="lg" className="gap-2" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Start Building Resume
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-xl mx-auto space-y-6 pb-6">
                  {(isLoadingHistory || createMutation.isPending) ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Setting up your session…
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={msg.id || idx} className={cn("flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                        <div className={cn(
                          "px-4 py-3 rounded-2xl max-w-[85%] shadow-sm text-sm",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border border-border rounded-tl-sm text-card-foreground"
                        )}>
                          {msg.role === 'user' ? (
                            <div className="space-y-2">
                              {msg.attachments?.map((att, ai) => (
                                att.mimeType.startsWith('image/') ? (
                                  <img key={ai} src={`data:${att.mimeType};base64,${att.data}`} alt={att.name} className="max-w-[180px] rounded-lg" />
                                ) : (
                                  <div key={ai} className="flex items-center gap-1.5 bg-white/10 rounded px-2 py-1 text-xs">
                                    <FileText className="w-3 h-3" />{att.name}
                                  </div>
                                )
                              ))}
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          ) : (
                            <>
                              <Markdown content={msg.content} />
                              {msg.resumeData && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <span className="text-xs text-primary font-medium">✓ Resume generated — preview on the right</span>
                                </div>
                              )}
                            </>
                          )}
                          {msg.isStreaming && (
                            <div className="flex gap-1 mt-2 items-center text-muted-foreground h-4">
                              <div className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                              <div className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                              <div className="w-1.5 h-1.5 rounded-full bg-current typing-dot" />
                            </div>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                            <User className="w-3.5 h-3.5 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="p-3 border-t border-border bg-card/30">
                <div className="max-w-xl mx-auto">
                  {pendingFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {pendingFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1 text-xs font-medium">
                          {f.mimeType.startsWith('image/') ? <Image className="w-3 h-3 text-primary" /> : <FileText className="w-3 h-3 text-primary" />}
                          <span className="truncate max-w-[140px]">{f.name}</span>
                          <button onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))}>
                            <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt" className="hidden" onChange={handleFileSelect} />
                  <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-background border border-border rounded-xl p-2 focus-within:ring-2 focus-within:ring-ring/30 transition-all">
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Answer the question or type 'generate my resume'…"
                      className="min-h-[38px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 py-2 bg-transparent text-sm"
                      rows={1}
                      disabled={!conversationId || isStreaming}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className={cn("h-9 w-9 shrink-0 rounded-xl transition-all", (input.trim() || pendingFiles.length > 0) && !isStreaming ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                      disabled={(!input.trim() && pendingFiles.length === 0) || isStreaming || !conversationId}
                    >
                      <SendHorizontal className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>

        {resumeData && (
          <div className="w-1/2 overflow-y-auto bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resume Preview</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadDocx} disabled={!!isExporting} className="gap-1 h-7 text-xs">
                  {isExporting === 'docx' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />} Word
                </Button>
                <Button size="sm" onClick={handleDownloadPDF} disabled={!!isExporting} className="gap-1 h-7 text-xs">
                  {isExporting === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
                </Button>
              </div>
            </div>
            <ResumePreview data={resumeData} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResumePreview({ data }: { data: ResumeData }) {
  const { personalInfo, summary, education, experience, skills, projects, certifications, achievements } = data;

  return (
    <div className="p-8 bg-white text-gray-900 font-sans text-sm leading-relaxed min-h-screen" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div className="border-b-2 border-blue-900 pb-4 mb-5">
        <h1 className="text-3xl font-bold text-blue-900 mb-1">{personalInfo?.name}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-600 text-xs">
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo?.location && <span>• {personalInfo.location}</span>}
          {personalInfo?.linkedin && <span>• {personalInfo.linkedin}</span>}
          {personalInfo?.github && <span>• {personalInfo.github}</span>}
        </div>
      </div>

      {summary && (
        <section className="mb-5">
          <SectionHeader title="Professional Summary" />
          <p className="text-gray-700">{summary}</p>
        </section>
      )}

      {education?.length > 0 && (
        <section className="mb-5">
          <SectionHeader title="Education" />
          {education.map((edu, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{edu.degree} in {edu.field}</p>
                  <p className="text-gray-700">{edu.institution}</p>
                </div>
                <div className="text-right text-gray-500 text-xs shrink-0 ml-4">
                  <p>{edu.startYear} – {edu.endYear}</p>
                  {edu.grade && <p>{edu.grade}</p>}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {experience?.length > 0 && (
        <section className="mb-5">
          <SectionHeader title="Work Experience" />
          {experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{exp.role}</p>
                  <p className="text-gray-700">{exp.company}</p>
                </div>
                <p className="text-gray-500 text-xs shrink-0 ml-4">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</p>
              </div>
              <div className="mt-2 text-gray-700 pl-1">
                {exp.description.split('\n').filter(Boolean).map((line, li) => (
                  <p key={li} className="mb-1">• {line.replace(/^[-•*]\s*/, '')}</p>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {skills && (skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-5">
          <SectionHeader title="Skills" />
          {skills.technical?.length > 0 && (
            <p className="mb-1"><span className="font-semibold">Technical: </span>{skills.technical.join(', ')}</p>
          )}
          {skills.soft?.length > 0 && (
            <p><span className="font-semibold">Soft Skills: </span>{skills.soft.join(', ')}</p>
          )}
        </section>
      )}

      {projects?.length > 0 && (
        <section className="mb-5">
          <SectionHeader title="Projects" />
          {projects.map((proj, i) => (
            <div key={i} className="mb-3">
              <p className="font-semibold text-gray-900">{proj.name}{proj.link ? ` — ${proj.link}` : ''}</p>
              <p className="text-gray-700 mt-0.5">{proj.description}</p>
              {proj.technologies?.length > 0 && (
                <p className="text-gray-500 text-xs mt-0.5">Tech: {proj.technologies.join(', ')}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {certifications?.length > 0 && (
        <section className="mb-5">
          <SectionHeader title="Certifications" />
          {certifications.map((cert, i) => (
            <p key={i} className="mb-1">
              <span className="font-semibold">{cert.name}</span>
              <span className="text-gray-600"> — {cert.issuer}, {cert.year}</span>
            </p>
          ))}
        </section>
      )}

      {achievements?.length > 0 && (
        <section className="mb-5">
          <SectionHeader title="Achievements" />
          {achievements.map((ach, i) => <p key={i} className="mb-1">• {ach}</p>)}
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900 border-b border-blue-200 pb-1 mb-2">
      {title}
    </h2>
  );
}
