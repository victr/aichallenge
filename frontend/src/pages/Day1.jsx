import { useState, useEffect } from 'react';

export default function Day1() {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('ok');
  const [loading, setLoading] = useState(false); // added loading state

  async function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.elements.userInput.value.trim();
    if (!input) return;

    setLoading(true);
    setStatus('ok');

    try {
      const res = await fetch('http://localhost:3000/api/talktome', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
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
        <h2>Day 1</h2>
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
            <p className="card-text">Build a simple AI agent that can answer questions and display responses in your own interface.
 The agent should send and receive requests via an HTTP client.</p>
            <p className="card-text">
 <strong>Goal: </strong>
 The agent correctly accepts user input, makes a call to the selected model/tool, and returns the response.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
