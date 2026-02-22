// src/features/public/components/simple-assistant-types.ts
// Types and constants for the SimpleAssistant chat widget

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'loading';
  timestamp: Date;
}

export const INITIAL_MESSAGE: Message = {
  id: '1',
  content:
    "Hi, I'm Doughy! I can help streamline your real estate business with AI-powered lead management. Ask me how our platform can boost your productivity or inquire about our pricing plans.",
  role: 'assistant',
  timestamp: new Date(),
};
