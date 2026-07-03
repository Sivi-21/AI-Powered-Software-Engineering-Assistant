import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, BookOpen, Loader2 } from 'lucide-react';
import { queryCodebase } from '../api';

export default function CodeChat({ project }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I am your AI repository engineer. I have indexed this repository. Ask me anything, for example:\n- *Explain this repository's structure*\n- *Find all API endpoints*\n- *How is error handling implemented?*`
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
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '0', overflow: 'hidden' }}>
      
      {/* Chat Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(255, 255, 255, 0.01)'
      }}>
        <MessageSquare size={20} style={{ color: 'var(--accent-color)' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Codebase Chat Assistant</h3>
          <span style={{ fontSize: '11px', color: 'var(--success-color)' }}>Project: {project.name} (RAG Mode)</span>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        background: 'rgba(10, 9, 21, 0.2)'
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
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isBot ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${isBot ? 'var(--accent-color)' : 'rgba(99, 102, 241, 0.3)'}`,
                boxShadow: isBot ? '0 0 10px rgba(59, 130, 246, 0.1)' : 'none'
              }}>
                {isBot ? <Bot size={18} style={{ color: 'var(--accent-color)' }} /> : <User size={18} style={{ color: '#818cf8' }} />}
              </div>

              {/* Speech bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                  background: isBot ? 'var(--bg-card)' : 'rgba(59, 130, 246, 0.12)',
                  border: `1px solid ${isBot ? 'var(--border-color)' : 'rgba(59, 130, 246, 0.3)'}`,
                  padding: '12px 16px',
                  borderRadius: isBot ? '0px 16px 16px 16px' : '16px 0px 16px 16px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  {msg.content}
                </div>
                
                {/* Sources list */}
                {isBot && msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginTop: '4px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      <BookOpen size={12} />
                      <span>REFERENCE FILES:</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {msg.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '3px 8px',
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--accent-color)'
            }}>
              <Bot size={18} style={{ color: 'var(--accent-color)' }} />
            </div>
            
            {/* Animated Typing Indicator */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '16px 20px',
              borderRadius: '0px 16px 16px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }} />
              <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
              <span className="typing-dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && !loading && (
        <div style={{
          padding: '0 20px 10px 20px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={(e) => handleSend(e, p)}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(10, 9, 21, 0.4)',
        display: 'flex',
        gap: '12px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the repository..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(10, 9, 21, 0.6)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '14px',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '12px', borderRadius: '8px' }}
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
