import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIAssistantState {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearMessages: () => void;
}

export const useAIAssistantStore = create<AIAssistantState>((set) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: "Hi, I'm AI Manager, your AI assistant for The Manager. I can help you with tasks, answer questions about your music business, or assist with using the platform. What can I help you with today?",
      timestamp: new Date()
    }
  ],
  isOpen: false,
  isLoading: false,
  addMessage: (message) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: Date.now().toString(),
        ...message,
        timestamp: new Date()
      }
    ]
  })),
  setIsOpen: (isOpen) => set({ isOpen }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hi, I'm AI Manager, your AI assistant for The Manager. I can help you with tasks, answer questions about your music business, or assist with using the platform. What can I help you with today?",
        timestamp: new Date()
      }
    ]
  })
}));