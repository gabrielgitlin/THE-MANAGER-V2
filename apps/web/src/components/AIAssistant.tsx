import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Bot, User, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import OpenAI from 'openai';
import { formatTime } from '../lib/utils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo purposes - in production, make API calls server-side
});

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi, I'm AI Mentor, your general AI helper. I can answer questions about music, the industry, or any other topic. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.choices[0].message.content || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      // Fallback response if API call fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later or check your API key configuration.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--surface)', borderRadius: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--surface-2)' }}>
              <Bot className="w-5 h-5" style={{ color: 'var(--brand-1)' }} />
            </div>
            <div>
              <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>AI Mentor</h2>
              <p className="text-xs" style={{ color: 'var(--t2)' }}>General knowledge assistant powered by industry experts and AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full"
            style={{ color: 'var(--t3)', backgroundColor: 'transparent' }}
          >
            <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="Close" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3`}
                style={{
                  backgroundColor: message.role === 'user' ? 'var(--brand-1)' : 'var(--surface-2)',
                  color: message.role === 'user' ? 'var(--t1)' : 'var(--t1)',
                  borderRadius: 0
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">
                    {message.role === 'user' ? 'You' : 'AI Mentor'}
                  </span>
                  <span className="text-xs opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.role === 'assistant' && (
                  <div className="flex justify-end mt-2 gap-2">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="p-1 rounded"
                      style={{ color: 'var(--t3)', backgroundColor: 'transparent' }}
                      title="Copy to clipboard"
                    >
                      <img src="/TM-Copy-negro.svg" className="pxi-sm icon-muted" alt="Copy" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-medium">AI Mentor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="w-full p-3 pr-10 border resize-none"
                rows={1}
                style={{ minHeight: "44px", maxHeight: "120px", backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t1)', borderRadius: 0 }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                style={{ color: 'var(--brand-1)' }}
              >
                <img src="/TM-Send-negro.svg" className="pxi-lg icon-green absolute right-3 bottom-3" alt="Send" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--brand-1)' }} />
              <span className="text-xs" style={{ color: 'var(--t2)' }}>Provide direct answers to questions. Be helpful and concise.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}