import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';
import { formatTime } from '../lib/utils';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIManager({ isOpen, onClose }: AIManagerProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI Manager assistant. I can help you with anything related to THE MANAGER platform. I have access to your database and can answer questions about your shows, finances, catalog, team, tasks, and more.\n\nTry asking me things like:\n- 'How many shows do I have?'\n- 'Show me my financial overview'\n- 'List my albums'\n- 'What tasks are pending?'\n- 'Navigate to the calendar'\n\nWhat would you like to know?",
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const fetchDatabaseContext = async (userQuery: string): Promise<string> => {
    try {
      const lowerQuery = userQuery.toLowerCase();
      let context = '';

      // Get current session for authenticated queries
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        context += '\n\nNote: User is not authenticated. Some data may not be accessible due to Row Level Security policies.\n';
      }

      if (lowerQuery.includes('show') || lowerQuery.includes('concert') || lowerQuery.includes('gig')) {
        const { data: shows, error } = await supabase
          .from('shows')
          .select('*')
          .order('date', { ascending: true });

        if (error) {
          console.error('Shows query error:', error);
        }

        if (shows && shows.length > 0) {
          context += `\n\nShows in database (${shows.length} total):\n`;
          shows.slice(0, 10).forEach(show => {
            context += `- ${show.title || show.venue} on ${show.date} at ${show.venue}, ${show.city}\n`;
          });
        } else {
          context += `\n\nShows: No shows found in the database.\n`;
        }
      }

      if (lowerQuery.includes('album') || lowerQuery.includes('track') || lowerQuery.includes('song') || lowerQuery.includes('catalog') || lowerQuery.includes('music')) {
        const { data: albums } = await supabase.from('albums').select('*');
        const { data: tracks } = await supabase.from('tracks').select('*');

        if (albums && albums.length > 0) {
          context += `\n\nAlbums in catalog (${albums.length} total):\n`;
          albums.slice(0, 10).forEach(album => {
            context += `- ${album.title} (${album.release_year || 'N/A'})\n`;
          });
        }

        if (tracks && tracks.length > 0) {
          context += `\nTracks in catalog: ${tracks.length} total\n`;
        }

        if ((!albums || albums.length === 0) && (!tracks || tracks.length === 0)) {
          context += `\n\nCatalog: No albums or tracks found in the database.\n`;
        }
      }

      if (lowerQuery.includes('financ') || lowerQuery.includes('budget') || lowerQuery.includes('money')) {
        const { data: finances } = await supabase.from('finances').select('*');

        if (finances && finances.length > 0) {
          const totalBudget = finances.reduce((sum, f) => sum + (f.total_budget || 0), 0);
          const totalSpent = finances.reduce((sum, f) => sum + (f.total_spent || 0), 0);

          context += `\n\nFinancial Overview:\n`;
          context += `- Total Budget: $${totalBudget.toLocaleString()}\n`;
          context += `- Total Spent: $${totalSpent.toLocaleString()}\n`;
          context += `- Remaining: $${(totalBudget - totalSpent).toLocaleString()}\n`;
          context += `- Active Budgets: ${finances.length}\n`;
        } else {
          context += `\n\nFinances: No financial data found in the database.\n`;
        }
      }

      if (lowerQuery.includes('task') || lowerQuery.includes('todo')) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (tasks && tasks.length > 0) {
          const pending = tasks.filter(t => t.status !== 'completed');
          const completed = tasks.filter(t => t.status === 'completed');

          context += `\n\nTasks Overview:\n`;
          context += `- Total: ${tasks.length}\n`;
          context += `- Pending: ${pending.length}\n`;
          context += `- Completed: ${completed.length}\n`;

          if (pending.length > 0) {
            context += `\nPending tasks:\n`;
            pending.slice(0, 5).forEach(task => {
              context += `- ${task.title} (${task.priority || 'medium'} priority)${task.due_date ? ` - Due: ${task.due_date}` : ''}\n`;
            });
          }
        } else {
          context += `\n\nTasks: No tasks found in the database.\n`;
        }
      }

      if (lowerQuery.includes('personnel') || lowerQuery.includes('team') || lowerQuery.includes('crew') || lowerQuery.includes('staff')) {
        const { data: personnel } = await supabase.from('personnel').select('*');

        if (personnel && personnel.length > 0) {
          const roles = personnel.reduce((acc: any, person) => {
            acc[person.role] = (acc[person.role] || 0) + 1;
            return acc;
          }, {});

          context += `\n\nTeam Overview (${personnel.length} members):\n`;
          Object.entries(roles).forEach(([role, count]) => {
            context += `- ${count} ${role}(s)\n`;
          });
        } else {
          context += `\n\nTeam: No personnel found in the database.\n`;
        }
      }

      if (lowerQuery.includes('note')) {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (notes && notes.length > 0) {
          context += `\n\nNotes (${notes.length} total):\n`;
          notes.slice(0, 5).forEach(note => {
            context += `- ${note.title || 'Untitled'}\n`;
          });
        } else {
          context += `\n\nNotes: No notes found in the database.\n`;
        }
      }

      if (lowerQuery.includes('artist')) {
        const { data: artists } = await supabase.from('artists').select('*');

        if (artists && artists.length > 0) {
          context += `\n\nArtists (${artists.length} total):\n`;
          artists.forEach(artist => {
            context += `- ${artist.name}${artist.genre ? ` (${artist.genre})` : ''}\n`;
          });
        } else {
          context += `\n\nArtists: No artists found in the database.\n`;
        }
      }

      return context;
    } catch (error) {
      console.error('Database fetch error:', error);
      return '';
    }
  };

  const handleNavigation = (userMessage: string, assistantResponse: string) => {
    const lower = userMessage.toLowerCase() + ' ' + assistantResponse.toLowerCase();

    if (lower.includes('navigate') || lower.includes('go to') || lower.includes('open')) {
      if (lower.includes('dashboard')) {
        navigate('/');
      } else if (lower.includes('calendar')) {
        navigate('/calendar');
      } else if (lower.includes('catalog')) {
        navigate('/catalog');
      } else if (lower.includes('legal')) {
        navigate('/legal');
      } else if (lower.includes('live')) {
        navigate('/live');
      } else if (lower.includes('marketing')) {
        navigate('/marketing');
      } else if (lower.includes('team')) {
        navigate('/team');
      } else if (lower.includes('artist')) {
        navigate('/artist');
      } else if (lower.includes('settings')) {
        navigate('/settings');
      } else if (lower.includes('tasks')) {
        navigate('/tasks');
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const databaseContext = await fetchDatabaseContext(userInput);

      const systemPrompt = `You are AI Manager, an intelligent assistant for THE MANAGER platform - a music artist management application.

Your role:
- Answer questions about the user's data in their workspace
- Help navigate the platform
- Provide insights and summaries
- Be conversational, helpful, and concise
- Use the database context provided to give accurate answers

IMPORTANT: Some pages in THE MANAGER platform are still using temporary mock data while being migrated to the database. If the database shows no data for something (like tasks, notes, etc.) but the user says they have data, it means that section is still using mock data on the frontend and hasn't been saved to the database yet. In this case:
- Let them know their data is currently in the app but not yet saved to the database
- Suggest they can create new items which will be saved to the database
- Offer to navigate them to that section to view their current data

Platform sections:
- Dashboard: Overview and quick access
- Calendar: Show schedules and events
- Catalog: Music releases, albums, and tracks
- Finance: Budgets and financial tracking
- Legal: Contracts and documents
- Live: Tour and show management
- Marketing: Campaigns and promotion
- Team: Personnel and crew management
- Artist: Artist information and profiles

When users ask to navigate somewhere, clearly state you're navigating them to that section.

Database context for this query:${databaseContext || '\n\nNo relevant database data found for this query.'}`;

      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.choices[0].message.content || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      handleNavigation(userInput, assistantMessage.content);

    } catch (error) {
      console.error('Error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error. Please make sure your OpenAI API key is configured correctly in your .env file (VITE_OPENAI_API_KEY).",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
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

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary transition-colors"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderRadius: 0 }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--surface-2)' }}>
              <Bot className="w-5 h-5" style={{ color: 'var(--brand-1)' }} />
            </div>
            <div>
              <h2 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>AI Manager</h2>
              <p className="text-xs" style={{ color: 'var(--t2)' }}>Your intelligent assistant for THE MANAGER</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-full transition-colors"
              style={{ color: 'var(--t3)' }}
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors"
              style={{ color: 'var(--t3)' }}
            >
              <img src="/TM-Close-negro.svg" className="pxi-lg icon-muted" alt="Close" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4`}
                style={{
                  backgroundColor: message.role === 'user' ? 'var(--brand-1)' : 'var(--surface-2)',
                  color: 'var(--t1)',
                  borderRadius: 0
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium opacity-70">
                    {message.role === 'user' ? 'You' : 'AI Manager'}
                  </span>
                  <span className="text-xs opacity-50">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', borderRadius: 0 }}>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your workspace..."
                className="w-full p-3 pr-12 border resize-none text-sm"
                rows={1}
                style={{ minHeight: "44px", maxHeight: "120px", backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--t1)', borderRadius: 0 }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-3 bottom-3 disabled:opacity-50 transition-colors"
                style={{ color: 'var(--brand-1)' }}
              >
                <img src="/TM-Send-negro.svg" className="pxi-lg icon-green" alt="Send" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-center" style={{ color: 'var(--t2)' }}>
            AI Manager has access to your database and can help you navigate the platform
          </p>
        </div>
      </div>
    </div>
  );
}
