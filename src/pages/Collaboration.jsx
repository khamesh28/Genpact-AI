import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, MessageSquare, Users, Hash } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import messageService from '../services/messageService';
import teamService from '../services/teamService';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const POLL_INTERVAL = 3000;

const roleColor = (role) => {
  const map = {
    admin:   'bg-red-100 text-red-700',
    manager: 'bg-purple-100 text-purple-700',
    owner:   'bg-amber-100 text-amber-700',
    sme:     'bg-cyan-100 text-cyan-700',
    member:  'bg-green-100 text-green-700',
    viewer:  'bg-gray-100 text-gray-500',
  };
  return map[(role || '').toLowerCase()] || map.viewer;
};

const Avatar = ({ name, size = 8 }) => (
  <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0`}>
    <span className="text-white text-xs font-bold">{name?.charAt(0)?.toUpperCase() || '?'}</span>
  </div>
);

const Collaboration = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const lastIdRef = useRef(null);

  // Fetch members once
  useEffect(() => {
    if (!currentTeam?._id) return;
    teamService.getTeamMembers(currentTeam._id)
      .then(res => setMembers(res.data || []))
      .catch(() => {});
  }, [currentTeam?._id]);

  // Initial message load
  const loadMessages = useCallback(async (silent = false) => {
    if (!currentTeam?._id) return;
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await messageService.getMessages(currentTeam._id, { limit: 60 });
      const msgs = res.data || [];
      setMessages(msgs);
      if (msgs.length) lastIdRef.current = msgs[msgs.length - 1]._id;
    } catch {
      if (!silent) toast.error('Could not load messages');
    } finally {
      setLoadingMsgs(false);
    }
  }, [currentTeam?._id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Polling for new messages
  useEffect(() => {
    pollRef.current = setInterval(() => loadMessages(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await messageService.sendMessage(currentTeam._id, text.trim());
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await messageService.deleteMessage(currentTeam._id, msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch {
      toast.error('Could not delete message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const key = formatDate(msg.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex h-[calc(100vh-0px)] bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>

      {/* ── Left: member list ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team Chat</span>
          </div>
          <p className="text-base font-bold text-gray-900">{currentTeam?.name}</p>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members — {members.length}</span>
          </div>
          <div className="space-y-1">
            {members.map(m => (
              <div key={m._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                <div className="relative">
                  <Avatar name={m.user?.name} size={7} />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{m.user?.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColor(m.role)}`}>
                    {m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name} size={7} />
            <div>
              <p className="text-xs font-bold text-gray-900">{user?.name}</p>
              <p className="text-[10px] text-gray-400">You</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right: chat ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Team Chat</p>
            <p className="text-xs text-gray-400">{members.length} members · updates every 3s</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {loadingMsgs ? (
            <LoadingSpinner />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to say something to your team</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, msgs]) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[11px] font-semibold text-gray-400 px-2">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {msgs.map((msg, i) => {
                  const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                  const showAvatar = i === 0 || msgs[i - 1]?.sender?._id !== msg.sender?._id;
                  return (
                    <div key={msg._id} className={`flex gap-3 group py-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 flex-shrink-0 mt-1">
                        {showAvatar && <Avatar name={msg.sender?.name} size={8} />}
                      </div>
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showAvatar && (
                          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-bold text-gray-800">{isMe ? 'You' : msg.sender?.name}</span>
                            <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                          </div>
                        )}
                        <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-gray-900 text-white rounded-tr-sm'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                          {isMe && (
                            <button
                              onClick={() => handleDelete(msg._id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <Avatar name={user?.name} size={8} />
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition-all">
              <textarea
                rows={1}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${currentTeam?.name}...`}
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              />
            </div>
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-10 h-10 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 mt-2 ml-11">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
