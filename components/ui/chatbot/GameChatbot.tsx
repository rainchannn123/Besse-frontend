'use client';

import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatbotService } from '@/services/chatbotService';
import { ChatbotMessage } from '@/types/chatbot';
import { useAuthStore } from '@/stores/authStore';

type ChatbotPageContext = 'mrf-collection' | 'broker-inventory' | 'municipality';

interface GameChatbotProps {
  pageContext: ChatbotPageContext;
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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([
    {
      role: 'assistant',
      content: WELCOME_BY_PAGE[pageContext],
      createdAt: new Date().toISOString(),
    },
  ]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, open]);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const handleSend = async () => {
    if (!canSend) return;

    const userText = input.trim();
    setInput('');
    setError(null);

    const nextMessages: ChatbotMessage[] = [
      ...messages,
      {
        role: 'user',
        content: userText,
        createdAt: new Date().toISOString(),
      },
    ];

    setMessages(nextMessages);
    setSending(true);

    try {
      const response = await chatbotService.sendMessage({
        message: userText,
        pageContext,
        sessionId: user?.currentSession,
        history: nextMessages.map(({ role, content }) => ({ role, content })),
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response?.reply || 'No response generated.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to get chatbot response.');
      setMessages(prev => [
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
        className={`pointer-events-auto w-[420px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 origin-bottom-right ${
          open
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 invisible'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Game Assistant</h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close chatbot"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={containerRef} className="h-96 overflow-y-auto px-3 py-3 bg-gray-50">
          <div className="space-y-2">
            {messages.map((m, idx) => (
              <div
                key={`${m.createdAt}-${idx}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
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
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-white text-gray-600 border border-gray-200 rounded-bl-md">
                  Typing...
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="px-3 pt-2 text-xs text-red-600">{error}</div>}

        <div className="p-3 border-t border-gray-100 bg-white rounded-b-2xl">
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
              placeholder="Ask for game help..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              maxLength={1000}
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(prev => !prev)}
        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle game chatbot"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
