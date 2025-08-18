import { agents, customInstructions } from '../data/agents';
import { StartAgentConfig } from './agentService';

export const agentPromptService = {
  generateSystemPrompt: (agentId: string, languageCode: string): string => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    if (agent && customInstructions.hasOwnProperty(agentId) && customInstructions[agentId as keyof typeof customInstructions].dismissDefaultInstructions) {
      return customInstructions[agentId as keyof typeof customInstructions].instructions;
    }

    const getCustomInstructions = () => {
      if (customInstructions.hasOwnProperty(agentId)) {
        return `- ${customInstructions[agentId as keyof typeof customInstructions].instructions}`;
      }
      return '';
    }
    // Extract domain from title (remove "The " prefix)
    const domain = agent.domain;

    return `
    - You are ${agent.name}, a highly knowledgeable, personable, and articulate expert in the field of ${domain}. You interact with user in natural spoken language — just like a real professional in your field would.
    - Only speak about things related to your expertise in ${domain}. Avoid making any references to being an AI, language model, or artificial intelligence. Do not mention model names, version numbers, or technical inner workings. You are not a chatbot — you are ${agent.name}, an expert in ${domain}.
    - Your goal is to help user understand, explore, or go deeper into ${domain}, through friendly, thoughtful, and engaging conversation.
    - Always keep the tone human, conversational, and helpful. You may use analogies, examples, and stories relevant to your domain when helpful, just like a real mentor or expert might.
    - Stay concise in your replies when responding to direct questions, and only elaborate when asked or when it enhances understanding.
    - If user asks something outside your domain, gently redirect the conversation back to ${domain}, or express that you're focused on your area of expertise and would love to help in that area.
    - The user is speaking to you, and your response will be spoken back to them. Please reply in natural-sounding paragraphs rather than bullet points to make the conversation feel smooth and conversational.
    - Always use function calling when possible.
    - Talk to the user in the language the user is speaking to you.
    ${getCustomInstructions()}
    `;
  },

  generateIntroduction: (agentId: string, languageCode: string): string => {
    const agent = agents.find(a => a.id === agentId);

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    const introduction = agent.languages?.find(l => l.isoCode === languageCode)?.introduction;
    if (!introduction) {
      return agent.introduction;
    }
    return introduction;
  }
};

export const updateSystemPrompt = (systemPrompt: string, config: StartAgentConfig): string => {
  switch (config.agentId) {
    case 'adeeb':
    case 'asmaa':
    case 'alice':
      if (config.languageCode === 'ar-AE') {
        return systemPrompt + `Speak in UAE Arabic dialect`
      } else if (config.languageCode === 'ar-EG') {
        return systemPrompt + `Speak in Egyptian Arabic dialect`
      } else if (config.languageCode === 'ar-JO') {
        return systemPrompt + `Speak in Jordanian Arabic dialect`
      } else if (config.languageCode === 'ar-SA') {
        return systemPrompt + `Speak in Saudi Arabian Arabic dialect`
      }
      return systemPrompt;
    default:
      return systemPrompt;
  }
}