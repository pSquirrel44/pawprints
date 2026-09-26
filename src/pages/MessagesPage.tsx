import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Conversation, Message } from '../types/index';
import { useApp } from '../lib/AppContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { formatDistanceToNow, getPathUsername } from '../lib/utils';

export default function MessagesPage() {
  const location = useLocation();
  const chatUsername = getPathUsername(location.pathname, 'messages');
  const { theme, token, currentUser, refreshUnread } = useApp();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    api.getConversations(token).then(d => setConversations(d as Conversation[])).finally(() => setLoadingConvos(false));
  }, [token]);

  useEffect(() => {
    if (!token || !chatUsername) return;
    setLoadingMsgs(true);
    api.getMessages(chatUsername, token)
      .then(d => { setMessages(d as Message[]); refreshUnread(); })
      .finally(() => setLoadingMsgs(false));
  }, [chatUsername, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!token || !chatUsername) return;
    const interval = setInterval(async () => {
      const data = await api.getMessages(chatUsername, token) as Message[];
      setMessages(data);
    }, 5000);
    return () => clearInterval(interval);
  }, [chatUsername, token]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !chatUsername || !newMessage.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const msg = await api.sendMessage(chatUsername, newMessage.trim(), token) as Message;
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Message failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>Sign in to view messages</div>;
  }

  return (
    <div className="messages-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Conversations list */}
      <div className="conversations-panel" style={{
        width: 300, flexShrink: 0, borderRight: `1px solid ${theme.border}`,
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px', fontWeight: 700, color: theme.text, fontSize: 16,
          borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, background: theme.bg }}>
          Messages
        </div>
        {loadingConvos ? (
          <div style={{ padding: 20, color: theme.textMuted, textAlign: 'center' }}>Loading…</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: 20, color: theme.textMuted, textAlign: 'center', fontSize: 14 }}>
            No conversations yet.
          </div>
        ) : conversations.map(c => (
          <Link key={c.other_user_id} to={`/messages/${c.username}`}
            style={{
              display: 'flex', gap: 10, padding: '12px 16px', textDecoration: 'none',
              background: chatUsername === c.username ? theme.surfaceHover : 'transparent',
              borderBottom: `1px solid ${theme.border}`,
            }}>
            <img src={c.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${c.username}`}
              alt={c.display_name} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{c.display_name}</span>
                {c.unread_count > 0 && (
                  <span style={{ background: theme.primary, color: '#fff', borderRadius: 10,
                    padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                    {c.unread_count}
                  </span>
                )}
              </div>
              <div style={{ color: theme.textMuted, fontSize: 12,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.last_msg}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Chat area */}
      <div className="chat-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!chatUsername ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: theme.textMuted, fontSize: 15 }}>
            Select a conversation or search for someone to message
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center', gap: 10, background: theme.bg }}>
              <Link to={`/profile/${chatUsername}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${chatUsername}`}
                  alt={chatUsername} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <span style={{ color: theme.text, fontWeight: 600 }}>@{chatUsername}</span>
              </Link>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', color: theme.textMuted }}>Loading…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: theme.textMuted, marginTop: 40 }}>
                  No messages yet. Say hello!
                </div>
              ) : messages.map(m => {
                const isMine = m.sender_id === currentUser?.id;
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine ? theme.gradientBtn : theme.surface,
                      color: isMine ? '#fff' : theme.text, fontSize: 14,
                    }}>
                      <div>{m.content}</div>
                      <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                        {formatDistanceToNow(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {sendError && (
              <div role="alert" style={{ padding: '8px 16px', color: '#ef4444', fontSize: 13 }}>
                {sendError}
              </div>
            )}
            <form onSubmit={sendMessage} style={{ padding: '12px 16px',
              borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 8 }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={`Message @${chatUsername}…`}
                style={{
                  flex: 1, padding: '10px 16px', background: theme.surface,
                  border: `1px solid ${theme.border}`, borderRadius: 24,
                  color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <Button type="submit" loading={sending} disabled={!newMessage.trim()}>
                Send
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
