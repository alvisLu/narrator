export interface AudioSpeech {
  model?: string;
  input: string;
  voice: string;
}
export const generateAudioSpeech = async (
  data: AudioSpeech,
): Promise<Response> => {
  return fetch(`${process.env.REACT_APP_OPEN_AI_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REACT_APP_OPEN_AI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      ...data,
    }),
  });
};

export interface Message {
  role: "system" | "assistant" | "user";
  content: string;
}
export interface ChatCompletion {
  model?: string;
  messages: Message[];
  stream: boolean;
}
export const generateChatCompletions = async (
  data: Message[],
): Promise<Response> => {
  return fetch(`${process.env.REACT_APP_OPEN_AI_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REACT_APP_OPEN_AI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: data,
      stream: false,
    }),
  });
};
