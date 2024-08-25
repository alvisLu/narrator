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
