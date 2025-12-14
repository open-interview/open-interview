// Auto-generated index file for unified question storage
import allQuestionsData from "./all-questions.json";
import channelMappingsData from "./channel-mappings.json";

export const questionsById: Record<string, any> = allQuestionsData.questions || {};
export const channelMappings: Record<string, any> = channelMappingsData.channels || {};

// Get all questions as array
export const allQuestions = Object.values(questionsById);

// Get questions for a channel
export function getQuestionsForChannel(channel: string): any[] {
  const mapping = channelMappings[channel];
  if (!mapping) return [];
  
  const ids = new Set<string>();
  Object.values(mapping.subChannels || {}).forEach((subIds: any) => {
    (subIds as string[]).forEach(id => ids.add(id));
  });
  
  return Array.from(ids).map(id => questionsById[id]).filter(q => q != null);
}

// Get questions for a subchannel
export function getQuestionsForSubChannel(channel: string, subChannel: string): any[] {
  const ids = channelMappings[channel]?.subChannels?.[subChannel] || [];
  return ids.map((id: string) => questionsById[id]).filter((q: any) => q != null);
}

// Legacy compatibility - questions by channel
export const questionsByChannel: Record<string, any[]> = {};
Object.keys(channelMappings).forEach(channel => {
  questionsByChannel[channel] = getQuestionsForChannel(channel);
});
