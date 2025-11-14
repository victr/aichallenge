import { useState, useEffect } from 'react';
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ca } from 'zod/v4/locales';

export default function Day2() {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('ok');
  const [loading, setLoading] = useState(false); // added loading state

  async function callAPI(payload) {
    const res = await fetch('http://localhost:3000/api/talktome', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
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
      return typeof data === 'string' ? data : (data && data.message) || JSON.stringify(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.elements.userInput.value.trim();
    if (!input) return;

    setLoading(true);
    setStatus('ok');

    try {
      let suggestedSchema;
      if (!schemaValue) {
        suggestedSchema = await callAPI(JSON.stringify({ 
          input: [
            {role: "system", content: `Provide JSON schema which can be used in the subsequent request to OpenAI API to format the response and nothing else. The schema should define an object with properties relevant to the user input. Respond with valid JSON but in plain text, do NOT use Markdown or code fences. Always wrap property names with double quotes. All fields must be required. Example: {
                type: "object",
                properties: {
                    steps: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                explanation: { type: "string" },
                                output: { type: "string" }
                            },
                            required: ["explanation", "output"],
                            additionalProperties: false
                        }
                    },
                    final_answer: { type: "string" }
                },
                required: ["steps", "final_answer"],
                additionalProperties: false'},`},
            {role: "user", content: input},
          ]
        }));
        setSchemaValue(suggestedSchema);
      }
      let schema
      try {
        schema = JSON.parse(suggestedSchema || schemaValue);
      } catch (e) {
        console.log(e)
        setStatus('Error: Invalid JSON schema');
        return;
      }
      let message = await callAPI(JSON.stringify({ 
          input: [
            {role: "system", content: roleValue},
            {role: "user", content: input}
          ],
          format: { type: "json_schema", "strict": true, "schema": schema, name: "structured_answer" } 
        }));
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
  const [roleValue, setRoleValue] = useState('Answer as a helpful assistant.');
  const [schemaValue, setSchemaValue] = useState('');

  return (
    <div className="row">
      <div className="col-md-8">
        <h2>Day 2</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="roleInput" className="form-label">Agent's role</label>
            <textarea
              id="roleInput"
              name="roleInput"
              className="form-control text-secondary"
              rows={3}
              maxLength={200}
              placeholder="Describe agent's role"
              value={roleValue}
              disabled={true}
              aria-disabled={true}
            />
          </div>
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
          <div className="mb-3">
            <label htmlFor="schemaInput" className="form-label">Response Schema</label>
            <textarea
              id="schemaInput"
              name="schemaInput"
              className="form-control"
              rows={10}
              placeholder=""
              value={schemaValue}
              onChange={(e) => setSchemaValue(e.target.value)}
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
          <div
            className="border rounded p-3"
            style={{
              minHeight: '80px',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',     
              overflowWrap: 'anywhere',   
              wordBreak: 'break-word',    
              fontFamily: "'Roboto Mono', monospace",    
              maxWidth: '100%'
            }}
          >
            {response || <span className="text-muted">No response yet</span>}
          </div>
        </div>

        <div className="mt-4 text-muted">
          <span>{status !== 'ok' ? `${status}` : ''}</span>
        </div>
      </div>

      
      <div className="col-md-4 mt-4 mt-md-0">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Info</h5>
            <div className="card-text">
              <ul>
                <li>Learn how to define a response format for your AI agent.</li>
                <li>Specify the desired output structure directly in the prompt.</li>
                <li>Provide an example of the expected output format.</li>
              </ul>
            </div>
            <p className="card-text"><b>Goal:</b> The response from the LLM can be correctly parsed by your application.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
