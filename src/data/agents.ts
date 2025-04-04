export interface AgentTile {
  id: string;
  name: string;
  title: string;
  introduction: string;
  description: string;
  features: string[];
}

export const agents: AgentTile[] = [
  {
    id: 'astra',
    name: 'Astra',
    title: 'The Astrologer',
    introduction: 'Hello, I\'m Astra, the celestial guide. I offer personalized astrological insights based on your birth chart. Explore your cosmic blueprint and discover what the stars have in store.',
    description: 'Astra, the celestial guide, offers personalized astrological insights based on your birth chart. Explore your cosmic blueprint and discover what the stars have in store.',
    features: ['Birth chart analysis', 'Daily horoscopes', 'Compatibility readings', 'Astrological queries']
  },
  {
    id: 'ember',
    name: 'Ember',
    title: 'The Therapist',
    introduction: 'Hello, I\'m Ember, the therapist. I provide a safe and supportive space for you to explore your thoughts and feelings. Engage in confidential conversations and receive empathetic guidance.',
    description: 'Ember provides a safe and supportive space for you to explore your thoughts and feelings. Engage in confidential conversations and receive empathetic guidance.',
    features: ['Active listening', 'Mood tracking', 'Coping strategy suggestions', 'Mental well-being resources']
  },
  {
    id: 'gustavo',
    name: 'Gustavo',
    title: 'The Personal Chef',
    introduction: 'Hello, I\'m Gustavo, the personal chef. I create personalized meal plans and recipes based on your dietary preferences and restrictions. From quick weeknight dinners to gourmet feasts, Gustavo will help you cook with confidence.',
    description: 'Gustavo, your culinary confidant, creates personalized meal plans and recipes based on your dietary preferences and restrictions. From quick weeknight dinners to gourmet feasts, Gustavo will help you cook with confidence.',
    features: ['Recipe generation', 'Dietary filter', 'Shopping list creation', 'Cooking tips']
  },
  {
    id: 'lingua',
    name: 'Lingua',
    title: 'The Language Tutor',
    introduction: 'Hello, I\'m Lingua, the language tutor. I offer interactive language lessons and practice sessions. Learn new vocabulary, grammar, and pronunciation in a fun and engaging way.',
    description: 'Lingua, the polyglot AI, offers interactive language lessons and practice sessions. Learn new vocabulary, grammar, and pronunciation in a fun and engaging way.',
    features: ['Vocabulary flashcards', 'Grammar exercises', 'Pronunciation practice', 'Conversation simulations']
  },
  {
    id: 'chronos',
    name: 'Chronos',
    title: 'The Historical Scholar',
    introduction: 'Hello, I\'m Chronos, the historical scholar. I bring the past to life with engaging stories and detailed explanations. Explore historical events, figures, and cultures with this knowledgeable AI.',
    description: 'Chronos, the keeper of history, brings the past to life with engaging stories and detailed explanations. Explore historical events, figures, and cultures with this knowledgeable AI.',
    features: ['Timeline exploration', 'Historical biographies', 'Event analysis', 'Historical Q&A']
  },
  {
    id: 'muse',
    name: 'Muse',
    title: 'The Creative Writing Partner',
    introduction: 'Hello, I\'m Muse, the creative writing partner. I help you overcome writer\'s block and unleash your creativity. Brainstorm story ideas, develop characters, and refine your writing style with this inspiring AI.',
    description: 'Muse, your literary collaborator, helps you overcome writer\'s block and unleash your creativity. Brainstorm story ideas, develop characters, and refine your writing style with this inspiring AI.',
    features: ['Story prompts', 'Character development', 'Plot suggestions', 'Writing feedback']
  },
  {
    id: 'aegis',
    name: 'Aegis',
    title: 'The Financial Advisor',
    introduction: 'Hello, I\'m Aegis, the financial advisor. I help you manage your personal finances. From budgeting and saving to investing and retirement planning, I provide personalized financial guidance.',
    description: 'Aegis will help you manage your personal finances. From budgeting and saving to investing and retirement planning, Aegis provides personalized financial guidance.',
    features: ['Budgeting tools', 'Investment analysis', 'Financial planning', 'Market updates']
  },
  {
    id: 'voyager',
    name: 'Voyager',
    title: 'The Travel Planner',
    introduction: 'Hello, I\'m Voyager, the travel planner. I help you plan unforgettable trips. From finding the best deals on flights and hotels to creating personalized itineraries, I take the stress out of travel planning.',
    description: 'Voyager, your travel concierge, will help you plan unforgettable trips. From finding the best deals on flights and hotels to creating personalized itineraries, Voyager takes the stress out of travel planning.',
    features: ['Flight and hotel search', 'Itinerary planning', 'Local recommendations', 'Travel tips']
  }
] as const; 