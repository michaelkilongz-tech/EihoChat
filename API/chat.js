// Secure Vercel Serverless Function for DeepSeek AI
export default async function handler(request, response) {
  // Handle CORS
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Only POST allowed for chat
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, model = 'llama-3.1-8b-instant', conversation = [] } = request.body;

    // Validate request
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return response.status(400).json({
        error: 'Message is required',
        success: false
      });
    }

    // Get API key from environment variable (SECURE)
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      throw new Error('API key not configured');
    }

    // Prepare messages for Groq
    const messages = [
      {
        role: 'system',
        content: 'You are DeepSeek AI, a helpful and intelligent assistant.'
      },
      ...conversation.slice(-6), // Last 6 messages for context
      { role: 'user', content: message.trim() }
    ];

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      
      return response.status(groqResponse.status).json({
        error: `API Error: ${groqResponse.status}`,
        success: false,
        details: groqResponse.status === 429 ? 'Rate limit exceeded' : 'Service error'
      });
    }

    const data = await groqResponse.json();
    const aiResponse = data.choices[0]?.message?.content || 'No response generated';

    return response.status(200).json({
      response: aiResponse,
      success: true,
      usage: data.usage || {},
      model: model
    });

  } catch (error) {
    console.error('Server error:', error);
    
    return response.status(500).json({
      error: 'Internal server error',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}