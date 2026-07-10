import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, BookOpen, Loader2 } from 'lucide-react';
import { queryCodebase } from '../api';

export default function CodeChat({ project }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I am your AI repository engineer. I have indexed this repository. Ask me anything, for example:\n- Explain this repository's structure\n- Find all API endpoints\n- How is error handling implemented?`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const queryText = textOverride || input;
    if (!queryText.trim() || loading) return;

    // Build chat history list
    const historyList = messages.map(m => ({ role: m.role, content: m.content }));

    // Append User message
    const userMsg = { role: "user", content: queryText };
    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInput("");
    setLoading(true);

    try {
      const data = await queryCodebase(project.id, queryText, historyList);
      const assistantMsg = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || []
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        role: "assistant",
        content: `Sorry, I failed to query the codebase: ${err.message || "Unknown API error"}.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Explain this repository architecture",
    "Where is the configuration defined?",
    "Find all API endpoints",
    "How is error handling structured?"
  ];

  return (
    <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '0', overflow: 'hidden' }}>
      
      {/* Chat Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)'
      }}>
        <MessageSquare size={16} style={{ color: 'var(--text-secondary)' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', letterSpacing: '-0.01em' }}>Codebase Chat Assistant</h3>
          <span style={{ fontSize: '11px', color: 'var(--success-color)' }}>Project: {project.name}</span>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--bg-primary)'
      }}>
        {messages.map((msg, index) => {
          const isBot = msg.role === "assistant";
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                flexDirection: isBot ? 'row' : 'row-reverse',
                maxWidth: '85%'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--border-color)'
              }}>
                {isBot ? <Bot size={14} style={{ color: 'var(--text-primary)' }} /> : <User size={14} style={{ color: 'var(--text-secondary)' }} />}
              </div>

              {/* Speech bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  background: isBot ? 'var(--bg-card)' : '#27272a',
                  border: '1px solid var(--border-color)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)'
                }}>
                  {msg.content}
                </div>
                
                {/* Sources list */}
                {isBot && msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginTop: '2px',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>
                      <BookOpen size={10} />
                      <span>REFERENCE FILES:</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            background: 'var(--bg-primary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontFamily: 'Consolas, monospace'
                          }}
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <Bot size={14} style={{ color: 'var(--text-primary)' }} />
            </div>
            
            {/* Animated Typing Indicator */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '10px 14px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span className="typing-dot" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block' }} />
              <span className="typing-dot" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animationDelay: '0.2s' }} />
              <span className="typing-dot" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && !loading && (
        <div style={{
          padding: '10px 20px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          background: 'var(--bg-primary)'
        }}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={(e) => handleSend(e, p)}
              className="btn-secondary"
              style={{
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the repository..."
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '8px 12px' }}
          disabled={loading || !input.trim()}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
