import { NextRequest, NextResponse } from 'next/server';
import { getCachedSettings } from '@/lib/data-fetching';
import { retrieveRelevantContext } from '@/services/ragService';
import { getChatResponse } from '@/services/geminiService';
import { auth } from '@/auth';

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Fetch global AI configuration
    const settings = await getCachedSettings();
    const aiConfig = settings?.aiConfig || {};
    
    const apiKey = aiConfig.geminiApiKey;

    if (!apiKey) {
      console.error('Gemini API Key is missing');
      return NextResponse.json({ error: 'AI Service Unavailable. Gemini API Key is not configured.' }, { status: 503 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const validatedMessages = messages
      .filter((msg: any) => {
        return (
          msg &&
          typeof msg === 'object' &&
          typeof msg.content === 'string' &&
          msg.content.trim().length > 0 &&
          (msg.role === 'user' || msg.role === 'assistant')
        );
      })
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content.substring(0, MAX_CONTENT_LENGTH)
      }));

    if (validatedMessages.length === 0) {
      return NextResponse.json({ error: 'Valid messages are required' }, { status: 400 });
    }

    if (validatedMessages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: `Too many messages. Max allowed: ${MAX_MESSAGES}` }, { status: 422 });
    }

    // Extract the latest message and history
    const latestMessageObj = validatedMessages[validatedMessages.length - 1];
    if (latestMessageObj.role !== 'user') {
      return NextResponse.json({ error: 'Latest message must be from user' }, { status: 400 });
    }
    const latestMessage = latestMessageObj.content;
    const history = validatedMessages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: msg.content
    }));

    // Retrieve real-time relevant database records via vector search
    const context = await retrieveRelevantContext(latestMessage, (session?.user as any)?.id, apiKey);
    console.log("RAG Context retrieved, length:", context ? context.length : 0);

    const response = await getChatResponse(latestMessage, history, context, apiKey);

    return NextResponse.json({ message: response });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to connect to AI' }, { status: 500 });
  }
}
