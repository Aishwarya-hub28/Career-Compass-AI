import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import {
  CreateGeminiConversationBody,
  DeleteGeminiConversationParams,
  GetGeminiConversationParams,
  ListGeminiMessagesParams,
  SendGeminiMessageParams,
} from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";

const router: IRouter = Router();

const CAREER_SYSTEM_PROMPT = `You are an expert, empathetic career counselor accessible to EVERYONE — regardless of educational background, age, or location. Your goal is to help people from ALL walks of life discover fulfilling career paths.

You help:
- School students (Class 10, 12) choosing their stream
- College students (BA, BCom, BSc, BBA, BCA, Engineering, any stream) exploring careers
- Graduate and post-graduate students (MA, MCom, MSc, MBA)
- Working professionals considering a career change
- Unemployed graduates seeking direction
- Anyone confused about "what to do after ___"
- People from rural and urban areas, any educational level

Career domains you cover:
🖥️ Technology: Software Developer, Data Scientist, Web Developer, Cybersecurity, IT Support, AI/ML Engineer
🎨 Creative: Graphic Designer, Video Editor, Content Writer, Photographer, UI/UX Designer, Animator
💼 Business: Marketing Manager, HR Manager, Sales Executive, Entrepreneur, Business Analyst, Digital Marketer
🏥 Healthcare: Nurse, Medical Lab Technician, Pharmacist, Physiotherapist, MBBS Doctor, Dentist
📚 Education: Teacher, Professor, Tutor, Educational Counselor, School Principal
💰 Finance: Accountant, Chartered Accountant (CA), Financial Analyst, Banker, Insurance Advisor
🏗️ Engineering: Civil Engineer, Mechanical Engineer, Electrical Engineer, Architect, Chemical Engineer
🍳 Hospitality: Chef, Hotel Manager, Tourism Guide, Event Manager, Restaurant Owner
🔧 Skilled Trades: Electrician, Plumber, Carpenter, Automotive Mechanic, HVAC Technician
🎭 Entertainment & Media: Actor, Musician, Journalist, Radio Jockey, Film Director
⚖️ Law: Lawyer, Legal Advisor, Paralegal, Judge, Corporate Counsel
🔬 Research & Science: Scientist, Researcher, Biotechnologist, Geologist, Meteorologist
🌱 Social Work & NGO: Social Worker, NGO Manager, Community Organizer, Counselor
🌾 Agriculture: Agricultural Officer, Farm Manager, Food Technologist, Agronomist
✈️ Defence & Government: Army/Navy/Air Force Officer, Civil Services (IAS/IPS), Police Officer

When the user uploads a file or image (resume, marksheet, certificate, document):
- Carefully analyze the content
- Provide specific, actionable feedback based on what you see
- For resumes: suggest improvements, highlight strengths, identify gaps
- For marksheets/certificates: suggest career paths based on the results
- For any document: extract relevant career insights

Guidelines:
- Be warm, encouraging, and non-judgmental — never dismiss any career as "lesser"
- Include BOTH degree-required AND skill/certification-based careers
- Mention free/low-cost learning paths (NPTEL, SWAYAM, Coursera financial aid, government schemes like PMKVY)
- Give salary ranges in Indian Rupees (INR) when relevant
- Mention job growth outlook for Indian market
- After giving recommendations, always ask if they want a learning roadmap for a specific career
- Remember context from earlier in the conversation — build on what you know about the person
- When recommending careers, suggest 5-7 from DIFFERENT industries to show breadth
- Be inclusive of people from non-English backgrounds — use simple, clear language

Start by warmly welcoming the user and asking about their background, interests, and goals.`;

const RESUME_BUILDER_SYSTEM_PROMPT = `You are a professional resume builder assistant. Help the user create a polished, job-ready resume by asking targeted questions in a warm, conversational way.

Follow this sequence — ask 1-2 questions at a time, don't overwhelm:
1. Full name, email, phone, city/state
2. Educational background (college/school, degree/stream/specialization, graduation year, marks/CGPA/percentage)
3. Work experience (if any): company name, job title, start/end dates (or current), 2-3 key responsibilities
4. Technical skills (software, tools, programming languages, etc.) and soft skills
5. Projects (name, technologies used, brief description, link if any)
6. Certifications or online courses (name, platform, year)
7. Achievements or awards (if any)
8. A brief professional summary (or offer to write one based on the info collected)

When the user uploads a document (existing resume, marksheet, etc.):
- Extract and acknowledge all relevant information from it
- Ask follow-up questions to fill any gaps

Once you have enough information (at minimum: name, contact, education, skills), ask: "I have enough information to generate your resume. Would you like me to create it now?"

When the user confirms (says yes, generate, create, done, etc.), output the complete resume in this EXACT format at the END of your message (after your conversational text):

<RESUME_DATA>
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+91-XXXXXXXXXX",
    "location": "City, State",
    "linkedin": "linkedin.com/in/...",
    "github": "github.com/..."
  },
  "summary": "2-3 sentence professional summary written in first person.",
  "education": [
    {
      "institution": "College/University Name",
      "degree": "B.Tech / B.Com / BA / etc.",
      "field": "Computer Science / Commerce / Arts / etc.",
      "startYear": "2020",
      "endYear": "2024",
      "grade": "8.5 CGPA / 78%"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "startDate": "Jun 2023",
      "endDate": "Dec 2023",
      "current": false,
      "description": "• Responsibility 1\n• Responsibility 2\n• Responsibility 3"
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2", "Skill 3"],
    "soft": ["Communication", "Teamwork", "Problem Solving"]
  },
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description of what it does and your role.",
      "technologies": ["React", "Node.js"],
      "link": "github.com/..."
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Platform/Institution",
      "year": "2023"
    }
  ],
  "achievements": ["Achievement 1", "Achievement 2"]
}
</RESUME_DATA>

Rules:
- Write professional, ATS-friendly descriptions for experience and projects
- If user has no experience, use an empty array []
- If user has no certifications/achievements, use empty arrays []
- Enhance descriptions to sound professional while keeping them accurate
- The summary should highlight key strengths based on what the user told you
- Always include the <RESUME_DATA> block when generating — the app uses it to render the resume preview`;

interface Attachment {
  data: string;
  mimeType: string;
  name: string;
}

interface MessageBody {
  content: string;
  attachments?: Attachment[];
}

function parseMessageBody(body: unknown): { ok: true; data: MessageBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.content !== "string" || !b.content) return { ok: false, error: "content is required" };
  const attachments: Attachment[] = [];
  if (Array.isArray(b.attachments)) {
    for (const att of b.attachments) {
      if (att && typeof att === "object") {
        const a = att as Record<string, unknown>;
        if (typeof a.data === "string" && typeof a.mimeType === "string" && typeof a.name === "string") {
          attachments.push({ data: a.data, mimeType: a.mimeType, name: a.name });
        }
      }
    }
  }
  return { ok: true, data: { content: b.content, attachments: attachments.length > 0 ? attachments : undefined } };
}

router.get("/gemini/conversations", async (req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(conversationsTable.createdAt);
  res.json(conversations);
});

router.post("/gemini/conversations", async (req, res): Promise<void> => {
  const parsed = CreateGeminiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conversation] = await db
    .insert(conversationsTable)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json(conversation);
});

router.get("/gemini/conversations/:id", async (req, res): Promise<void> => {
  const params = GetGeminiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...conversation, messages });
});

router.delete("/gemini/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteGeminiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/gemini/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListGeminiMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.json(messages);
});

router.post("/gemini/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendGeminiMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = parseMessageBody(req.body);
  if (!body.ok) {
    res.status(400).json({ error: body.error });
    return;
  }

  const mode = typeof req.query.mode === 'string' ? req.query.mode : 'career';
  const systemPrompt = mode === 'resume' ? RESUME_BUILDER_SYSTEM_PROMPT : CAREER_SYSTEM_PROMPT;

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const attachmentSummary = body.data.attachments?.length
    ? `\n[Attached files: ${body.data.attachments.map(a => a.name).join(', ')}]`
    : '';

  await db.insert(messagesTable).values({
    conversationId: params.data.id,
    role: "user",
    content: body.data.content + attachmentSummary,
  });

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const chatMessages = history.map((m, idx) => {
    const isLastUserMessage = idx === history.length - 1 && m.role === "user";

    if (isLastUserMessage && body.data.attachments?.length) {
      return {
        role: "user" as const,
        parts: [
          { text: body.data.content },
          ...body.data.attachments.map((att) => ({
            inlineData: { data: att.data, mimeType: att.mimeType },
          })),
        ],
      };
    }

    return {
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    };
  });

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: chatMessages,
    config: {
      maxOutputTokens: 8192,
      systemInstruction: systemPrompt,
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }
  }

  await db.insert(messagesTable).values({
    conversationId: params.data.id,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

const ROADMAP_SYSTEM_PROMPT = `You are a career roadmap expert. Generate a detailed, actionable career roadmap in strict JSON format. Only output valid JSON — no markdown, no explanation, no code fences.

The JSON must match this exact structure:
{
  "career": "string",
  "overview": "string (2-3 sentences about the career)",
  "totalDuration": "string (e.g. '12-18 months')",
  "salaryRange": "string (Indian salary range e.g. '₹4L - ₹18L per year')",
  "jobGrowth": "string (e.g. 'Very High', 'High', 'Moderate')",
  "phases": [
    {
      "phase": 1,
      "title": "string (phase name)",
      "duration": "string (e.g. '4-6 weeks')",
      "description": "string (what this phase covers)",
      "topics": ["string", "string", "string"],
      "resources": [
        {
          "name": "string (resource/course name)",
          "platform": "string (e.g. 'NPTEL', 'Coursera', 'YouTube')",
          "url": "string (real, valid URL)",
          "free": true
        }
      ],
      "milestone": "string (a concrete deliverable or achievement)"
    }
  ],
  "skills": ["string", "string"],
  "jobTitles": ["string", "string"],
  "topCompanies": ["string", "string"],
  "tips": ["string", "string", "string"]
}

Rules:
- Include 4-6 phases that progress logically from beginner to job-ready
- Each phase should have 3-6 topics and 2-4 resources
- Prioritise FREE resources (NPTEL, SWAYAM, YouTube, freeCodeCamp, Khan Academy, Coursera audit, government schemes)
- URLs must be real and working (use well-known platform URLs)
- Salary range in Indian Rupees (INR)
- Job titles should include both entry-level and mid-level
- Top companies should include Indian companies plus global MNCs with India presence
- Tips should be practical, India-specific career advice
- If user provided background, tailor the phases to start from their current level
- Output ONLY the JSON object, nothing else`;

router.post("/gemini/roadmap/generate", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (!body || typeof body.career !== "string" || !body.career.trim()) {
    res.status(400).json({ error: "career field is required" });
    return;
  }

  const career = body.career.trim();
  const background = typeof body.background === "string" ? body.background.trim() : "";

  const userPrompt = background
    ? `Generate a career roadmap for: ${career}. The user's current background: ${background}.`
    : `Generate a career roadmap for: ${career}.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      maxOutputTokens: 8192,
      systemInstruction: ROADMAP_SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const raw = response.text ?? "";

  let roadmap: unknown;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    roadmap = JSON.parse(cleaned);
  } catch {
    res.status(500).json({ error: "Failed to parse roadmap from AI response" });
    return;
  }

  res.json(roadmap);
});

export default router;
