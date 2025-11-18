import { useState, useEffect } from 'react';
import { marked } from 'marked';

export default function Day5() {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('ok');
  const [loading, setLoading] = useState(false); // added loading state
  const [tokens, setTokens] = useState(null); // new tokens state

  // local tokenizer fallback (mirrors server logic)
  function countTokensLocal(text) {
    if (!text) return 0;
    const tokens = text.match(/[A-Za-z0-9]+|[^\sA-Za-z0-9]/g);
    return tokens ? tokens.length : 0;
  }

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
        body: JSON.stringify({ 
          prompt: input,
          max_output_tokens: 10000
        })
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

      // prefer server-provided tokens; otherwise estimate locally
      if (data && data.tokens) {
        setTokens(data.tokens);
      } else {
        const inputCount = countTokensLocal(input);
        const outputCount = countTokensLocal(message);
        setTokens({
          model: (data && data.model) || 'unknown',
          context_limit: (data && data.context_limit) || 8192,
          input: inputCount,
          output: outputCount,
          total: inputCount + outputCount
        });
      }
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
        <h2>Day 5</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="userInput" className="form-label">Ask the agent</label>
            <textarea
              id="userInput"
              name="userInput"
              className="form-control"
              rows={3}
              maxLength={100000}
              placeholder="Type your question (max 10000 chars)"
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
          <div className="border rounded p-3" style={{ minHeight: '80px'}}>
            {response ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(response) }} />
              ) : (
                <span className="text-muted">No response yet</span>
              )}
          </div>

          {/* Token counts display */}
          <div className="mt-2">
            {tokens ? (
              <div>
                <div>
                  <strong>Model:</strong> {tokens.model} &nbsp;|&nbsp;
                  <strong>Context limit:</strong> {tokens.context_limit}
                </div>
                <div>
                  <strong>Input tokens:</strong> {tokens.input} &nbsp;|&nbsp;
                  <strong>Output tokens:</strong> {tokens.output} &nbsp;|&nbsp;
                  <strong>Total:</strong> {tokens.total}
                </div>
                {tokens.total >= tokens.context_limit ? (
                  <div className="text-danger">Total tokens >= model context limit — response may be truncated or rejected.</div>
                ) : tokens.total > tokens.context_limit * 0.9 ? (
                  <div className="text-warning">Total tokens are approaching the model context limit.</div>
                ) : null}
              </div>
            ) : (
              <div className="text-muted">Token counts will appear here after a request.</div>
            )}
          </div>
        </div>
      </div>

      <div className="col-md-4 mt-4 mt-md-0">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Info</h5>
            <p className="card-text">Add token counting to your code (for both request and response).
              Compare three cases:
              * a short prompt,
              * a long prompt,
              * a prompt that exceeds the model’s context limit.
            </p>
            <p className="card-text">
              <strong>Goal: </strong>
              Code that counts tokens and clearly demonstrates how the model’s behavior changes depending on the prompt length and limits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
