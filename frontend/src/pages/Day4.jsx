import { useState, useEffect } from 'react';
import { marked } from 'marked';

export default function Day4() {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('ok');
  const [loading, setLoading] = useState(false);

  // states for three temperature outputs + comparison
  const [outT0, setOutT0] = useState('');
  const [outT07, setOutT07] = useState('');
  const [outT12, setOutT12] = useState('');
  const [comparison, setComparison] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const input = e.target.elements.userInput.value.trim();
    if (!input) return;

    setLoading(true);
    setStatus('ok');
    // clear previous outputs
    setOutT0('');
    setOutT07('');
    setOutT12('');
    setComparison('');

    try {
      // Run same prompt with three different temperatures
      const temps = [
        { value: 0, setter: setOutT0 },
        { value: 0.7, setter: setOutT07 },
        { value: 1.2, setter: setOutT12 }
      ];

      const outputs = [];

      for (const temp of temps) {
        const res = await fetch('http://localhost:3000/api/talktome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            input: [{ 
              role: 'system', content: 'Be concise. Limit your response to 1-2 sentences per each section of the output.',
              role: 'user', content: input 
            }],
            max_output_tokens: 400,
            temperature: temp.value 
          })
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();

        if (!res.ok) {
          const errMsg = typeof data === 'string' ? data : (data && data.message) || JSON.stringify(data);
          console.error('Server responded with', res.status, errMsg);
          setStatus(`Error at temp=${temp.value}: ${errMsg}`);
          setLoading(false);
          return;
        }

        const message = typeof data === 'string' ? data : (data && data.message) || JSON.stringify(data);
        temp.setter(message);
        outputs.push({ temp: temp.value, output: message });
      }

      // Fourth request: comparison analysis
      const compareSystemPrompt = `You are an AI evaluator. Compare three outputs produced by an LLM for the same user prompt using three different temperature values (0, 0.7, and 1.2).

Analyze each output in terms of:
1. **Accuracy**: How factually correct and precise is the response?
2. **Creativity**: How varied, imaginative, or novel is the response?
3. **Diversity**: How much variation exists in word choice, structure, and approach?

Provide a structured comparison and conclude with recommendations:
- Which temperature works best for **factual/precise tasks** (e.g., technical docs, code generation)?
- Which temperature works best for **creative tasks** (e.g., storytelling, brainstorming)?
- Which temperature works best for **balanced tasks** (e.g., content writing, problem-solving)?

Be concise and clear.`;

      const comparePrompt = `
USER PROMPT:
"${input}"

OUTPUT (temperature = 0):
${outputs[0].output}

OUTPUT (temperature = 0.7):
${outputs[1].output}

OUTPUT (temperature = 1.2):
${outputs[2].output}

Please provide your comparison and recommendations.`;

      const compRes = await fetch('http://localhost:3000/api/talktome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: [
            { role: 'system', content: compareSystemPrompt },
            { role: 'user', content: comparePrompt }
          ],
          temperature: 0 // use low temp for consistent evaluation
        })
      });

      const compContentType = compRes.headers.get('content-type') || '';
      const compData = compContentType.includes('application/json') ? await compRes.json() : await compRes.text();

      if (!compRes.ok) {
        const errMsg = typeof compData === 'string' ? compData : (compData && compData.message) || JSON.stringify(compData);
        console.error('Comparison request failed:', errMsg);
        setStatus(`Error in comparison: ${errMsg}`);
        setLoading(false);
        return;
      }

      const compMessage = typeof compData === 'string' ? compData : (compData && compData.message) || JSON.stringify(compData);
      setComparison(compMessage);
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
        <h2>Day 4</h2>
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
          <div className="mb-4">
            <h5 className="">Output (temperature = 0)</h5>
            <div className="border rounded p-3" style={{ 
              minHeight: '80px', 
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f8f9fa'
            }}>
              {outT0 ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(outT0) }} />
              ) : (
                <span className="text-muted">No response yet</span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h5 className="">Output (temperature = 0.7)</h5>
            <div className="border rounded p-3" style={{ 
              minHeight: '80px', 
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f8f9fa'
            }}>
              {outT07 ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(outT07) }} />
              ) : (
                <span className="text-muted">No response yet</span>
              )}

            </div>
          </div>

          <div className="mb-4">
            <h5 className="">Output (temperature = 1.2)</h5>
            <div className="border rounded p-3" style={{ 
              minHeight: '80px', 
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f8f9fa'
            }}>
              {outT12 ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(outT12) }} />
              ) : (
                <span className="text-muted">No response yet</span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h5 className="text-success">Comparison & Recommendations</h5>
            <div className="border border-success rounded p-3" style={{ 
              minHeight: '120px', 
              whiteSpace: 'pre-wrap',
              backgroundColor: '#f0f8f0'
            }}>
              {comparison ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(comparison) }} />
              ) : (
                <span className="text-muted">No comparison yet</span>
              )}
            </div>
          </div>
        </div>

        {status !== 'ok' && (
          <div className="mt-3 alert alert-danger" role="alert">
            {status}
          </div>
        )}
      </div>

      <div className="col-md-4 mt-4 mt-md-0">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Info</h5>
            <p className="card-text">Run the same prompt with three different temperature values: 0, 0.7, and 1.2.
              Compare the outputs in terms of accuracy, creativity, and diversity.
              Describe which temperature works best for which types of tasks.
            </p>
            <p className="card-text">
              <strong>Goal: </strong>
              Provide text or code examples showing how the answers change with different temperature settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
