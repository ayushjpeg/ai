import React, { useEffect, useMemo, useRef, useState } from 'react';
import { streamGenerate } from './api/ollama';

const DEFAULT_MODEL = 'llama3.2:3b';

function MessageBubble({ role, content }) {
  return (
    <div className={`message-row message-row-${role}`}>
      <div className={`message message-${role}`}>
        <div className="message-content">{content || '...'}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am your on-prem Ollama assistant. Paste context or ask for tasks, and I will respond with concise action steps.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const controllerRef = useRef(null);
  const listRef = useRef(null);
  const baseUrl = useMemo(
    () => (import.meta.env.VITE_OLLAMA_BASE_URL || 'https://ollama-proxy.ayushjpeg.workers.dev').replace(/\/$/, ''),
    []
  );

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (customPrompt) => {
    const prompt = (customPrompt ?? input).trim();
    if (!prompt || loading) return;

    setError('');
    setLoading(true);
    setInput('');

    const userMessage = { role: 'user', content: prompt };
    const assistantMessage = { role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      await streamGenerate(
        { prompt, model, baseUrl },
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: (updated[lastIndex].content || '') + token,
            };
            return updated;
          });
        },
        controller.signal
      );
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: updated[lastIndex].content || '[error while generating]',
        };
        return updated;
      });
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <main className="chat">
        <header className="chat-header">
          <div className="header-left">
            <div className="logo">Ollama Based AI</div>
            <div className="eyebrow">On-prem Ollama</div>
            <div className="title">Chat</div>
          </div>
          <div className="actions">
            <div className="status-pill">{model}</div>
            <button className="ghost" onClick={stopGeneration} disabled={!loading}>
              Stop
            </button>
          </div>
        </header>

        <div className="messages" ref={listRef}>
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} role={msg.role} content={msg.content} />
          ))}
          {loading && <div className="typing">Streaming...</div>}
        </div>

        <div className="composer">
          <textarea
            rows={3}
            value={input}
            placeholder="Ask for tasks, summaries, or paste context"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
          />
          <div className="composer-actions">
            <button className="secondary" onClick={() => setInput('')} disabled={loading || !input}>
              Clear
            </button>
            <button className="primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </main>
    </div>
  );
}
