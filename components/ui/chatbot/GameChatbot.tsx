'use client';

import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatbotService } from '@/services/chatbotService';
import { socketManager } from '@/lib/websocket/socketManager';
import { ChatbotMessage } from '@/types/chatbot';
import { useAuthStore } from '@/stores/authStore';
import { useWebSocket } from '@/hooks/useWebSocket';

type ChatbotPageContext = 'mrf-collection' | 'broker-inventory' | 'municipality';

interface GameChatbotProps {
  pageContext: ChatbotPageContext;
}

type ChatTab = 'bot' | 'team';

interface TeamMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

const WELCOME_BY_PAGE: Record<ChatbotPageContext, string> = {
  'mrf-collection': 'Hi! I can help with MRF queue, grading, and selling actions.',
  'broker-inventory': 'Hi! I can help with auctions, bids, and wholesaler decisions.',
  municipality: 'Hi! I can help with waste collection and city project choices.',
};

// Markdown renderer component with safe styling
const MarkdownMessage = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      // Headers
      h1: ({ ...props }) => <h1 className="text-base font-bold mt-2 mb-1" {...props} />,
      h2: ({ ...props }) => <h2 className="text-sm font-bold mt-2 mb-1" {...props} />,
      h3: ({ ...props }) => <h3 className="text-sm font-semibold mt-1 mb-1" {...props} />,
      // Lists
      ul: ({ ...props }) => <ul className="list-disc list-inside space-y-1" {...props} />,
      ol: ({ ...props }) => <ol className="list-decimal list-inside space-y-1" {...props} />,
      li: ({ ...props }) => <li className="text-sm" {...props} />,
      // Code
      code: ({ ...props }) => (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800" {...props} />
      ),
      pre: ({ ...props }) => (
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto my-1" {...props} />
      ),
      // Links
      a: ({ ...props }) => (
        <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer" {...props} />
      ),
      // Emphasis
      strong: ({ ...props }) => <strong className="font-bold" {...props} />,
      em: ({ ...props }) => <em className="italic" {...props} />,
      // Blockquote
      blockquote: ({ ...props }) => (
        <blockquote className="border-l-4 border-gray-300 pl-2 italic text-gray-700" {...props} />
      ),
      // Paragraph
      p: ({ ...props }) => <p className="text-sm leading-relaxed" {...props} />,
    }}
  >
    {content}
  </ReactMarkdown>
);

export default function GameChatbot({ pageContext }: GameChatbotProps) {
  const { user } = useAuthStore();
  const { isConnected, joinGame } = useWebSocket();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChatTab>('bot');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botMessages, setBotMessages] = useState<ChatbotMessage[]>([
    {
      role: 'assistant',
      content: WELCOME_BY_PAGE[pageContext],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [unreadTeamCount, setUnreadTeamCount] = useState(0);
  const isOpenRef = useRef(false);
  const activeTabRef = useRef<ChatTab>('bot');

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [botMessages, teamMessages, open, activeTab]);

  useEffect(() => {
    const handleTeamMessage = (payload: any) => {
      if (!payload?.message) return;
      const serverMessageId = payload.messageId ?? payload.id;
      const incomingId = serverMessageId
        ? String(serverMessageId)
        : `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setTeamMessages(prev => {
        if (serverMessageId && prev.some(m => m.id === String(serverMessageId))) return prev;
        const isMine = (payload.senderId || 'unknown') === user?._id;
        if (!isMine && !(isOpenRef.current && activeTabRef.current === 'team')) {
          setUnreadTeamCount(count => count + 1);
        }
        return [
          ...prev,
          {
            id: incomingId,
            senderId: payload.senderId || 'unknown',
            senderName: payload.senderName || 'Unknown',
            senderRole: payload.senderRole || 'player',
            message: payload.message,
            createdAt: payload.createdAt || new Date().toISOString(),
          },
        ];
      });
    };

    const currentSessionId = user?.currentSession;
    if (currentSessionId && isConnected) {
      joinGame(currentSessionId);
    }

    const handleGameEnded = () => {
      setTeamMessages([]);
      setUnreadTeamCount(0);
    };

    socketManager.on('team-chat-message', handleTeamMessage);
    socketManager.on('countdown-expired', handleGameEnded);

    return () => {
      socketManager.off('team-chat-message', handleTeamMessage);
      socketManager.off('countdown-expired', handleGameEnded);
    };
  }, [user?._id, user?.currentSession, isConnected, joinGame]);

  useEffect(() => {
    if (open && activeTab === 'team' && unreadTeamCount > 0) {
      setUnreadTeamCount(0);
    }
  }, [open, activeTab, unreadTeamCount]);

  useEffect(() => {
    setBotMessages([
      {
        role: 'assistant',
        content: WELCOME_BY_PAGE[pageContext],
        createdAt: new Date().toISOString(),
      },
    ]);
    setTeamMessages([]);
    setUnreadTeamCount(0);
    setInput('');
    setError(null);
    setActiveTab('bot');
    setOpen(false);
  }, [pageContext, user?.currentSession]);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const handleSend = async () => {
    if (!canSend) return;

    const userText = input.trim();
    setInput('');
    setError(null);

    if (activeTab === 'team') {
      const sessionId = user?.currentSession;
      if (!sessionId) {
        setError('No active session found for team chat.');
        return;
      }

      socketManager.emit('team-chat-message', {
        sessionId,
        message: userText,
      });
      return;
    }

    const nextMessages: ChatbotMessage[] = [
      ...botMessages,
      {
        role: 'user',
        content: userText,
        createdAt: new Date().toISOString(),
      },
    ];

    setBotMessages(nextMessages);
    setSending(true);

    try {
      const response = await chatbotService.sendMessage({
        message: userText,
        pageContext,
        sessionId: user?.currentSession ?? undefined,
        history: nextMessages.map(({ role, content }) => ({ role, content })),
      });

      setBotMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response?.reply || 'No response generated.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to get chatbot response.');
      setBotMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I am having trouble right now. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 pointer-events-none">
      <div
        className={`pointer-events-auto w-[460px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#50704C] bg-white shadow-2xl transition-all duration-300 origin-bottom-right ${
          open
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 invisible'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#50704C] bg-[#50704C] rounded-t-2xl" >
          <h3 className="text-sm font-semibold text-white whitespace-nowrap">Game Assistant</h3>

          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setActiveTab('bot')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border-2 border-[#466342] ${
                activeTab === 'bot'
                  ? 'bg-white text-[#50704C]'
                  : 'text-white/90 hover:bg-white/20'
              }`}
            >
              Bot
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border-2 border-[#466342] ${
                activeTab === 'team'
                  ? 'bg-white text-[#50704C]'
                  : 'text-white/90 hover:bg-white/20'
              }`}
            >
              Team
            </button>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-white/90 hover:bg-white/20"
            aria-label="Close chatbot"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={containerRef} className="h-[26rem] overflow-y-auto px-3 py-3 bg-white">
          <div className="space-y-2">
            {activeTab === 'bot' &&
              botMessages.map((m, idx) => (
                <div
                  key={`${m.createdAt}-${idx}`}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#50704C] text-white rounded-br-md'
                        : 'bg-white text-gray-800 border border-[#50704C] rounded-bl-md'
                    }`}
                  >
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <MarkdownMessage content={m.content} />
                    )}
                  </div>
                </div>
              ))}

            {activeTab === 'team' &&
              teamMessages.map((m, idx) => {
                const isMine = m.senderId === user?._id;
                return (
                  <div
                    key={`${m.createdAt}-${idx}`}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-[#50704C] text-white rounded-br-md'
                          : 'bg-white text-gray-800 border border-[#50704C] rounded-bl-md'
                      }`}
                    >
                      <div className={`text-[10px] mb-1 ${isMine ? 'text-[#A8DADC]' : 'text-[#50704C]'}`}>
                        {m.senderName} - {m.senderRole}
                      </div>
                      <div>{m.message}</div>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'bot' && sending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-white text-gray-600 border border-[#50704C] rounded-bl-md">
                  Typing...
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="px-3 pt-2 text-xs text-red-600">{error}</div>}

        <div className="p-3 border-t border-[#50704C] bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={activeTab === 'bot' ? 'Ask for game help...' : 'Message your team...'}
              className="flex-1 rounded-xl border border-[#50704C] bg-white px-3 py-2 text-sm outline-none focus:border-[#50704C]"
              maxLength={1000}
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#50704C] text-white disabled:opacity-50 hover:bg-[#50704C]"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(prev => !prev)}
        className="pointer-events-auto relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 transition-colors"
        aria-label="Toggle game chatbot"
      >
        <MessageCircle size={24} />
        {unreadTeamCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-5 text-center border border-white">
            {unreadTeamCount > 99 ? '99+' : unreadTeamCount}
          </span>
        )}
      </button>
    </div>
  );
}
