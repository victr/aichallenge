import React, { useState } from 'react';

export default function Day3() {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('ok');
  const [loading, setLoading] = useState(false); // added loading state

  // moved systemPrompt out so we can store it in conversation state
  const systemPrompt = `
You are a conversational assistant that collects information until you can produce a final technical specification.
Goal: gather the details needed to produce a final TypeScript technical specification document.

Required fields to collect:
  - "title": string
  - "description": string
  - "requirements": array of strings
  - "assumptions": array of strings
  - "acceptance_criteria": array of strings
  - "final_spec": string (the final document/content)

Behavior rules:
  1) Ask short, focused follow-up questions when any required field is missing.
  2) When you have all required fields, RESPOND ONLY with a single polished, well-structured document that presents the collected information. The document should be professional and easy to read, using clear headings, bulleted lists for arrays.
  3) Do NOT return JSON, code fences, or any extra commentary — only the final document text itself.
  4) After returning that document, stop and do not ask additional questions.
  5) Keep follow-up prompts concise and focused on collecting just the missing information.
`;

  // conversation history: STARTS with the system prompt
  const [messages, setMessages] = useState([{ role: 'system', content: systemPrompt }]);

  async function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.elements.userInput.value.trim();
    if (!input) return;

    setLoading(true);
    setStatus('ok');

    try {
      // append user's message to conversation and send full history
      const userMsg = { role: 'user', content: input };
      const history = [...messages, userMsg];
      setMessages(history);

      const res = await fetch('http://localhost:3000/api/talktome', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: history })
      });

      // parse body (json or text)
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : await res.text();

      if (!res.ok) {
        // extract message for error display
        const errMsg = typeof data === 'string' ? data : (data && data.message) || JSON.stringify(data);
        console.error('Server responded with', res.status, errMsg);
        setStatus(`Error: ${errMsg}`);
        return;
      }

      // handle response shape: either string or { message: '...' }
      const message = typeof data === 'string' ? data : (data && data.message) || JSON.stringify(data);
      setResponse(message);
      setStatus('ok');

      // store assistant reply so next request includes it (important!)
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);
    } catch (err) {
      console.error(err);
      setStatus('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const [inputValue, setInputValue] = useState('');

  return (
    <div className="row">
      <div className="col-md-8">
        <h2>Day 3</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="userInput" className="form-label">Ask the agent</label>
            <textarea
              id="userInput"
              name="userInput"
              className="form-control"
              rows={3}
              maxLength={200}
              placeholder="Type your question (max 200 chars)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                // Submit on Enter (unless user holds Shift/Ctrl/Meta/Alt)
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) {
                    if (typeof form.requestSubmit === 'function') {
                      form.requestSubmit();
                    } else {
                      // fallback: click the submit button
                      const submitBtn = form.querySelector('button[type="submit"]');
                      if (submitBtn) submitBtn.click();
                    }
                  }
                }
              }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputValue.trim() || loading}          // disable while loading
            aria-disabled={!inputValue.trim() || loading}
          >
            Send
            {loading && (
              <span
                className="spinner-border spinner-border-sm ms-2"
                role="status"
                aria-hidden="true"
                style={{ verticalAlign: 'text-bottom' }}
              />
            )}
          </button>
        </form>

        <div className="mt-4">
          <div className="border rounded p-3" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
            {response || <span className="text-muted">No response yet</span>}
          </div>
        </div>
      </div>

      <div className="col-md-4 mt-4 mt-md-0">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Info</h5>
            <p className="card-text">Set a constraint so the model stops by itself at the right moment.
              Describe in the prompt what final result the model should collect and return to you.</p>
            <p className="card-text">
            <strong>Goal: </strong>
            You interact with the model, and it generates a final result based on your conversation (e.g., a technical specification).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
