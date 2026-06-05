import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Map, Loader2, ChevronRight, Clock, Target, BookOpen,
  ExternalLink, TrendingUp, Building2, Lightbulb, Star, CheckCircle,
  Search, Sparkles
} from 'lucide-react';
import { useLocation } from 'wouter';

interface Resource {
  name: string;
  platform: string;
  url: string;
  free: boolean;
}

interface Phase {
  phase: number;
  title: string;
  duration: string;
  description: string;
  topics: string[];
  resources: Resource[];
  milestone: string;
}

interface Roadmap {
  career: string;
  overview: string;
  totalDuration: string;
  salaryRange: string;
  jobGrowth: string;
  phases: Phase[];
  skills: string[];
  jobTitles: string[];
  topCompanies: string[];
  tips: string[];
}

const POPULAR_CAREERS = [
  'Software Developer', 'Data Scientist', 'UI/UX Designer', 'Digital Marketer',
  'Chartered Accountant', 'Cybersecurity Analyst', 'Content Creator',
  'Civil Engineer', 'UPSC / IAS Officer', 'Graphic Designer',
];

const PHASE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', line: 'bg-blue-200' },
  { bg: 'bg-teal-50', border: 'border-teal-200', dot: 'bg-teal-500', badge: 'bg-teal-100 text-teal-700', line: 'bg-teal-200' },
  { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700', line: 'bg-violet-200' },
  { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', line: 'bg-amber-200' },
  { bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', line: 'bg-rose-200' },
];

export default function RoadmapPage() {
  const [, setLocation] = useLocation();
  const [career, setCareer] = useState('');
  const [background, setBackground] = useState('');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const roadmapRef = useRef<HTMLDivElement>(null);

  const generate = async (careerName = career) => {
    if (!careerName.trim()) return;
    setLoading(true);
    setError('');
    setRoadmap(null);

    try {
      const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
      const resp = await fetch(`${BASE}/api/gemini/roadmap/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career: careerName.trim(), background: background.trim() }),
      });

      if (!resp.ok) throw new Error('Generation failed');
      const data = await resp.json();
      setRoadmap(data);
      setTimeout(() => roadmapRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setError('Could not generate the roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePopular = (c: string) => {
    setCareer(c);
    generate(c);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLocation('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Map className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Career Roadmap</h1>
            <p className="text-xs text-muted-foreground">Step-by-step learning path for any career</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Map className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Get Your Career Roadmap</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Enter any career and get a personalised step-by-step learning path with free resources, timelines, and milestones.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Career / Job Role</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={career}
                  onChange={e => setCareer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generate()}
                  placeholder="e.g. Data Scientist, Graphic Designer, IAS Officer…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Your Background <span className="font-normal normal-case text-muted-foreground/70">(optional)</span></label>
              <input
                type="text"
                value={background}
                onChange={e => setBackground(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                placeholder="e.g. 12th pass, B.Com graduate, 2 years in sales…"
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <Button
              onClick={() => generate()}
              disabled={!career.trim() || loading}
              className="w-full gap-2 h-11"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating your roadmap…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Roadmap</>
              )}
            </Button>
          </div>
        </div>

        {!roadmap && !loading && (
          <div className="animate-in fade-in duration-500">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Popular Careers</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CAREERS.map(c => (
                <button
                  key={c}
                  onClick={() => handlePopular(c)}
                  className="px-3.5 py-1.5 text-sm rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 animate-in fade-in duration-300">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Crafting your personalised roadmap…</p>
            <p className="text-xs text-muted-foreground/60 mt-1">This usually takes 5–10 seconds</p>
          </div>
        )}

        {roadmap && (
          <div ref={roadmapRef} className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">{roadmap.career}</h2>
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">{roadmap.overview}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setRoadmap(null); setCareer(''); }} className="shrink-0 gap-1.5 text-xs">
                  <Map className="w-3.5 h-3.5" /> New Roadmap
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                <StatBadge icon={<Clock className="w-3.5 h-3.5" />} label="Total Duration" value={roadmap.totalDuration} />
                <StatBadge icon={<TrendingUp className="w-3.5 h-3.5" />} label="Job Growth" value={roadmap.jobGrowth} />
                <StatBadge icon={<Star className="w-3.5 h-3.5" />} label="Salary (India)" value={roadmap.salaryRange} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" /> Learning Phases
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-200 via-teal-200 to-violet-200" />
                <div className="space-y-4">
                  {roadmap.phases.map((phase, idx) => {
                    const colors = PHASE_COLORS[idx % PHASE_COLORS.length];
                    return (
                      <div key={idx} className="relative flex gap-4">
                        <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-3 shadow-sm", colors.dot)}>
                          {phase.phase}
                        </div>
                        <div className={cn("flex-1 rounded-2xl border p-5 shadow-sm", colors.bg, colors.border)}>
                          <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                            <h4 className="font-bold text-foreground">{phase.title}</h4>
                            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1", colors.badge)}>
                              <Clock className="w-3 h-3" /> {phase.duration}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{phase.description}</p>

                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What to Learn</p>
                            <div className="flex flex-wrap gap-1.5">
                              {phase.topics.map((topic, ti) => (
                                <span key={ti} className="text-xs px-2.5 py-1 rounded-lg bg-background/80 border border-border text-foreground font-medium">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>

                          {phase.resources.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Resources
                              </p>
                              <div className="space-y-2">
                                {phase.resources.map((res, ri) => (
                                  <a
                                    key={ri}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-background/80 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                                      <span className="text-xs font-medium text-foreground group-hover:text-primary truncate transition-colors">{res.name}</span>
                                      <span className="text-xs text-muted-foreground shrink-0">· {res.platform}</span>
                                    </div>
                                    {res.free && (
                                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">FREE</span>
                                    )}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-3 border-t border-current/10">
                            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                            <p className="text-xs font-medium text-foreground/80">
                              <span className="font-semibold text-foreground">Milestone: </span>{phase.milestone}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roadmap.jobTitles?.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-primary" /> Job Titles to Aim For
                  </h4>
                  <div className="space-y-1.5">
                    {roadmap.jobTitles.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {roadmap.topCompanies?.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" /> Top Hiring Companies
                  </h4>
                  <div className="space-y-1.5">
                    {roadmap.topCompanies.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {roadmap.skills?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary" /> Key Skills to Build
                </h4>
                <div className="flex flex-wrap gap-2">
                  {roadmap.skills.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {roadmap.tips?.length > 0 && (
              <div className="bg-gradient-to-br from-secondary/10 to-transparent rounded-2xl border border-secondary/20 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-secondary" /> Pro Tips
                </h4>
                <div className="space-y-2.5">
                  {roadmap.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <span className="text-secondary font-bold shrink-0 mt-0.5">→</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2 pb-8">
              <Button variant="outline" onClick={() => { setRoadmap(null); setCareer(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="gap-2">
                <Map className="w-4 h-4" /> Explore Another Career
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 border border-border rounded-xl px-3 py-2">
      <span className="text-primary">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}
