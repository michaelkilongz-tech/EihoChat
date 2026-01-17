// Cloudflare Worker for DeepSeek AI Backend
// OUR Groq API Key goes here

export default {
  async fetch(request, env) {
    // ====================
    // CORS Configuration
    // ====================
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle OPTIONS (preflight) requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Handle GET requests (health check)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'DeepSeek AI Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Only POST allowed for chat
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed',
        success: false
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    try {
      // ====================
      // Parse request body
      // ====================
      const requestData = await request.json();
      const { message, model = 'llama-3.1-8b-instant', conversation = [] } = requestData;

      // Validate request
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return new Response(JSON.stringify({
          error: 'Message is required and must be a non-empty string',
          success: false
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Validate message length
      if (message.length > 5000) {
        return new Response(JSON.stringify({
          error: 'Message is too long. Maximum 5000 characters.',
          success: false
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // ====================
      // OUR GROQ API KEY
      // ====================
      // Replace with your actual Groq API key
      const GROQ_API_KEY = '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';
      // ====================

      // ====================
      // Prepare messages for Groq API
      // ====================
      const systemMessage = {
        role: 'system',
        content: `You are DeepSeek AI, a helpful and intelligent AI assistant. 
        You provide accurate, detailed, and thoughtful responses.
        Format your responses with proper markdown when appropriate.
        For code, use code blocks with language specification.
        Be concise but thorough.`
      };

      // Build conversation history (last 10 messages for context)
      const recentMessages = conversation.slice(-10);
      
      const messages = [
        systemMessage,
        ...recentMessages,
        { role: 'user', content: message.trim() }
      ];

      // ====================
      // Call Groq API
      // ====================
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DeepSeek-AI-Backend/1.0'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false,
        }),
      });

      // ====================
      // Handle Groq API Response
      // ====================
      if (!groqResponse.ok) {
        let errorMessage = 'API request failed';
        
        try {
          const errorData = await groqResponse.json();
          errorMessage = errorData.error?.message || `HTTP ${groqResponse.status}`;
          
          // Handle specific error cases
          if (groqResponse.status === 429) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else if (groqResponse.status === 401) {
            errorMessage = 'Invalid API key. Please check configuration.';
          } else if (groqResponse.status === 400) {
            errorMessage = 'Invalid request format.';
          }
        } catch (e) {
          errorMessage = `HTTP ${groqResponse.status}`;
        }

        return new Response(JSON.stringify({
          error: errorMessage,
          success: false,
          status: groqResponse.status
        }), {
          status: groqResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      // Parse successful response
      const responseData = await groqResponse.json();
      
      // Validate response structure
      if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        throw new Error('Invalid response format from AI service');
      }

      const aiResponse = responseData.choices[0].message.content;
      const usage = responseData.usage || {};
      const responseId = responseData.id || `chat_${Date.now()}`;

      // ====================
      // Return successful response
      // ====================
      return new Response(JSON.stringify({
        response: aiResponse,
        success: true,
        usage: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0
        },
        model: model,
        id: responseId,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Response-Time': Date.now() - request.headers.get('X-Request-Time') || 'unknown'
        }
      });

    } catch (error) {
      // ====================
      // Handle unexpected errors
      // ====================
      console.error('Backend Error:', error);

      return new Response(JSON.stringify({
        error: 'Internal server error',
        success: false,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};
