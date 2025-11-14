class AIError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default class AIClient {
  constructor(apiKey, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required to construct AIClient');
    }
  }

  async ask(payload) {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body
      });
    } catch (err) {
      console.error('Network error while calling OpenAI', err);
      throw new AIError(502, 'Upstream API error');
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('OpenAI Responses API error', response.status, errText);
      throw new AIError(502, 'Upstream API error');
    }

    const data = await response.json().catch(() => null);

    if (response.status === "incomplete" && response.incomplete_details.reason === "max_output_tokens") {
        // Handle the case where the model did not return a complete response  
        throw new Error("Incomplete response");
    }

    // Robust extraction to handle different possible response shapes
    let message = null;
    if (data) {
      if (Array.isArray(data.output) && data.output.length) {
        const parts = [];
        for (const out of data.output) {
          if (typeof out === 'string') {
            parts.push(out);
          } else if (typeof out?.text === 'string') {
            parts.push(out.text);
          } else if (Array.isArray(out?.content)) {
            for (const c of out.content) {
              if (typeof c?.text === 'string') parts.push(c.text);
            }
          }
        }
        if (parts.length) {
            for (const p of parts) {
                let parsed = undefined;
                try {
                    parsed = typeof p === 'string' ? JSON.parse(p) : p;
                } catch (e) {
                    // not JSON, skip
                }
                if (parsed && typeof parsed === 'object' && 'type' in parsed) {
                    if (parsed.type === 'refusal') {
                        throw new AIError(403, 'AI refused to answer');
                    } else if (parsed.type === 'object') {
                    } else if (parsed.type === 'output_text') {
                        // nop
                    } else {
                        console.error('Unexpected OpenAI response content type', parsed);
                        throw new AIError(502, 'Invalid response from AI service');
                    }
                    break;
                }
            }
            message = parts.join('\n').trim();
        }
      }

      // fallback to chat completions style if present
      if (!message) {
        message = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
      }
    }

    if (!message) {
      console.error('Unexpected OpenAI response shape', data);
      throw new AIError(502, 'Invalid response from AI service');
    }

    return message;
  }
}
