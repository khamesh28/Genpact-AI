import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import api from '../services/api';

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

// ─── Single message bubble ────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          <Bot size={13} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-gray-900 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
};

// ─── Suggestion chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'How many hours did I log this week?',
  "What's my team working on?",
  'Any overdue tasks?',
  'Summarize my activity',
];

// ─── Main widget ──────────────────────────────────────────────────────────────
const AIAssistant = () => {
  const { currentTeam } = useTeam();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading || !currentTeam?._id) return;

    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/teams/${currentTeam._id}/ai/chat`, {
        messages: history.map(m => ({ role: m.role, content: m.content })),
      });
      const aiContent = res.data?.data?.content || res.data?.message || 'Sorry, I couldn\'t get a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  if (!currentTeam) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-[200] w-13 h-13 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200 group ${
          open
            ? 'bg-gray-700 hover:bg-gray-600 rotate-0'
            : 'bg-gray-900 hover:bg-gray-700 hover:scale-105'
        }`}
        style={{ width: 52, height: 52 }}
        title="AI Assistant"
      >
        {open ? (
          <ChevronDown size={20} className="text-white" />
        ) : (
          <>
            <Sparkles size={18} className="text-white absolute opacity-100 group-hover:opacity-0 transition-opacity" />
            <Bot size={20} className="text-white absolute opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-[72px] right-6 z-[199] w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: 520 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">AI Assistant</p>
              <p className="text-[10px] text-gray-400 leading-tight">Powered by Claude</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear chat"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0" style={{ maxHeight: 340 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Ask me anything</p>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                I know your activities, projects,<br />tasks, and team context.
              </p>
              <div className="flex flex-col gap-2 w-full">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
              {loading && (
                <div className="flex justify-start mb-3">
                  <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot size={13} className="text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2.5 flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your work…"
            className="flex-1 resize-none text-sm outline-none text-gray-800 placeholder-gray-400 max-h-24 bg-transparent leading-relaxed"
            style={{ minHeight: 22 }}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            {loading ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Send size={13} className="text-white" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
