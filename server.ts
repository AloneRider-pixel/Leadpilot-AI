import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { AnalysisEngine } from './server/ai/analysisEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI instance safely
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI();
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LeadPilot AI Backend',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

/**
 * 1. AI LEAD ANALYSIS ENGINE (Server-side Gemini with Strict Validation & Caching)
 */
app.post('/api/ai/analyze-lead', async (req: Request, res: Response) => {
  try {
    const { lead, conversationHistory, propertyContext, forceRefresh } = req.body;

    if (!lead || !lead.name) {
      return res.status(400).json({ error: 'Lead profile is required' });
    }

    const validatedAnalysis = await AnalysisEngine.analyzeLead(
      lead,
      conversationHistory || '',
      propertyContext,
      Boolean(forceRefresh)
    );

    res.json({
      success: true,
      analysis: validatedAnalysis,
    });
  } catch (error: unknown) {
    console.error('AI Lead Analysis Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'AI Lead analysis failed',
    });
  }
});

/**
 * 2. MULTILINGUAL CONVERSATION ANALYZER
 * Analyzes raw WhatsApp, emails, transcripts, or notes in English, Hindi, or Hinglish
 */
app.post('/api/ai/analyze-conversation', async (req: Request, res: Response) => {
  try {
    const { rawText, existingLeadContext } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Conversation or transcript text is required' });
    }

    const result = await AnalysisEngine.analyzeConversation(rawText, existingLeadContext);

    res.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    console.error('AI Conversation Analysis Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Conversation analysis failed',
    });
  }
});

/**
 * 3. 5-STEP FOLLOW-UP SEQUENCE GENERATOR
 */
app.post('/api/ai/generate-followups', async (req: Request, res: Response) => {
  try {
    const { lead } = req.body;
    if (!lead || !lead.name) {
      return res.status(400).json({ error: 'Lead profile is required' });
    }

    const sequence = await AnalysisEngine.generateFollowUpSequence(lead);

    res.json({
      success: true,
      sequence,
    });
  } catch (error: unknown) {
    console.error('AI Follow-up Generator Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Follow-up sequence generation failed',
    });
  }
});

/**
 * 2. PERSONALIZED WHATSAPP / SMS REPLY GENERATOR
 */
app.post('/api/ai/generate-reply', async (req: Request, res: Response) => {
  try {
    const { lead, promptInstruction, channel = 'WHATSAPP' } = req.body;
    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate a personalized ${channel} message for real estate client:
Client: ${lead.name}
Budget: ₹${lead.budget ? (lead.budget / 10000000).toFixed(2) + ' Cr' : 'Flexible'}
Property: ${lead.propertyType || 'Apartment'} in ${lead.city || 'NCR'}
Purpose: ${lead.purpose || 'Self-use'}
Instruction: ${promptInstruction || 'Confirm interest and offer a site visit slot this coming weekend.'}

Strict Rules:
- Highly conversational, professional, courteous.
- Do NOT fabricate discounts or fake units.
- Maximum 3-4 concise paragraphs with clear call-to-action.`,
    });

    res.json({
      success: true,
      reply: response.text?.trim(),
    });
  } catch (error: unknown) {
    console.error('AI Reply Generator Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Reply generation failed',
    });
  }
});

/**
 * 3. AI SALES COPILOT
 */
app.post('/api/ai/copilot', async (req: Request, res: Response) => {
  try {
    const { query, organizationSummary, contextData } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const ai = getGenAI();

    const systemPrompt = `You are the LeadPilot AI Copilot for Indian Real Estate Sales Teams.
You assist Managing Directors, Sales Managers, and Sales Executives with operational strategy, lead triage, and objection handling.
Rules:
- Ground your answers in the provided database context.
- For data questions, calculate or report from the provided metrics; never invent false metrics.
- Keep recommendations sharp, high-impact, and immediately actionable.
- Use INR (Lakhs/Crores) and Indian real estate terminology (site visits, RERA, possession, booking token).`;

    const userPrompt = `ORGANIZATION CONTEXT:
${JSON.stringify(organizationSummary, null, 2)}

RECENT LEADS & CONVERSATION DATA:
${JSON.stringify(contextData || {}, null, 2)}

USER QUESTION:
"${query}"

Answer the sales team's question:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({
      success: true,
      answer: response.text?.trim(),
    });
  } catch (error: unknown) {
    console.error('AI Copilot Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'AI Copilot query failed',
    });
  }
});

/**
 * 4. AI PROPERTY MATCHER
 */
app.post('/api/ai/match-properties', async (req: Request, res: Response) => {
  try {
    const { lead, properties } = req.body;
    const ai = getGenAI();

    const systemPrompt = `You are a real estate matching engine. Rank the matching properties for this lead.
Output strictly JSON matching this structure:
{
  "matches": [
    {
      "propertyId": string,
      "propertyName": string,
      "matchScore": number (0 to 100),
      "whyItMatches": string (specific reasons relating budget, location, configuration, and timeline),
      "highlights": string[]
    }
  ]
}
Filter out unavailable properties. Never invent inventory.`;

    const userPrompt = `LEAD REQUIREMENTS:
${JSON.stringify(lead, null, 2)}

AVAILABLE PROPERTIES:
${JSON.stringify(properties, null, 2)}

Match and rank properties:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{"matches":[]}');
    res.json({
      success: true,
      matches: parsed.matches || [],
    });
  } catch (error: unknown) {
    console.error('AI Property Matcher Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Property matching failed',
    });
  }
});

// Dev / Prod Vite Server setup
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadPilot AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
