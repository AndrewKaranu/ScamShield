// Try to import local keys first, fall back to placeholder keys
let apiKeys: { ANTHROPIC_API_KEY: string; ELEVENLABS_API_KEY: string; ELEVENLABS_VOICE_ID: string };
try {
  apiKeys = require('../config/apiKeys.local');
} catch {
  apiKeys = require('../config/apiKeys');
}
const { ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } = apiKeys;

import { File, Paths } from 'expo-file-system';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';

const SYSTEM_PROMPT = "You are a scammer trying to trick the user into giving you money. You are persistent but try to sound professional. Keep your responses short, under 2 sentences.";

export const generateText = async (conversationHistory: { role: string, content: string }[]) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        system: SYSTEM_PROMPT,
        messages: conversationHistory,
      }),
    });

    const data = await response.json();
    if (data.error) {
        console.error('Anthropic API Error:', data.error);
        throw new Error(data.error.message);
    }
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
};

export const generateAudio = async (text: string) => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error('ElevenLabs API Error:', errorData);
        throw new Error('Failed to generate audio');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
};

export const playAudio = async (base64String: string) => {
  try {
    // Create a File instance in the cache directory
    const audioFile = new File(Paths.cache, `speech_${Date.now()}.mp3`);
    
    // Convert base64 to Uint8Array and write to file
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    await audioFile.write(bytes);

    const { sound } = await Audio.Sound.createAsync({ uri: audioFile.uri });
    
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
    });

    await sound.playAsync();

    return sound;
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};
