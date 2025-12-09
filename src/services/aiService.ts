// Try to import local keys first, fall back to placeholder keys
let apiKeys: { ANTHROPIC_API_KEY: string; ELEVENLABS_API_KEY: string; ELEVENLABS_VOICE_ID: string };
try {
  apiKeys = require('../config/apiKeys.local');
} catch {
  apiKeys = require('../config/apiKeys');
}
const { ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } = apiKeys;

import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Buffer } from 'buffer';

// Track if audio mode has been initialized
let audioModeInitialized = false;

const initAudioMode = async () => {
  if (!audioModeInitialized) {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });
    audioModeInitialized = true;
  }
};

// Enable recording mode specifically
export const enableRecordingMode = async () => {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
  });
};

const SYSTEM_PROMPT = "You are a friendly person having a casual phone conversation. Be warm, personable, and conversational. Keep your responses short, under 2 sentences.";

export const generateText = async (conversationHistory: { role: string, content: string }[]) => {
  try {
    // Filter out empty messages to avoid API errors
    const filteredHistory = conversationHistory.filter(msg => msg.content && msg.content.trim() !== '');
    
    if (filteredHistory.length === 0) {
      console.log('No valid messages to send to Anthropic, returning default response');
      return "I didn't catch that. Could you say that again?";
    }
    
    console.log('Calling Anthropic API with history:', JSON.stringify(filteredHistory));
    
    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: filteredHistory,
    };
    
    console.log('Request body:', JSON.stringify(requestBody));
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data));
    
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
          model_id: 'eleven_flash_v2_5',
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

export const playAudio = async (base64String: string): Promise<{ stop: () => void; _player: any }> => {
  try {
    // Initialize audio mode if needed
    await initAudioMode();
    
    // Create a File instance in the cache directory
    const audioFile = new File(Paths.cache, `speech_${Date.now()}.mp3`);
    
    // Convert base64 to Uint8Array and write to file
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    await audioFile.write(bytes);

    // Get the URI as a plain string
    const uri = String(audioFile.uri);
    console.log('Audio file URI:', uri);

    // Use expo-audio createAudioPlayer function
    const player = createAudioPlayer({ uri }, { updateInterval: 100 });
    console.log('Player created, starting playback...');
    player.play();
    console.log('Play called, player.playing:', player.playing);

    return {
      stop: () => player.remove(),
      _player: player,
    };
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};

// Play a ringtone from assets
export const playRingtone = async (ringtoneAsset: any): Promise<{ stop: () => void; _player: any }> => {
  try {
    await initAudioMode();
    
    const player = createAudioPlayer(ringtoneAsset, { updateInterval: 100 });
    player.loop = true; // Loop the ringtone
    player.play();
    console.log('Ringtone started playing');
    
    return {
      stop: () => {
        console.log('Stopping ringtone...');
        player.loop = false;
        player.pause();
        player.remove();
        console.log('Ringtone stopped');
      },
      _player: player,
    };
  } catch (error) {
    console.error('Error playing ringtone:', error);
    throw error;
  }
};

// Speech to Text using ElevenLabs Scribe API
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    console.log('Transcribing audio from:', audioUri);
    
    // Ensure URI is correct
    const uri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;
    
    // Get filename from URI
    const filename = uri.split('/').pop() || 'recording.m4a';
    
    // In React Native, FormData works with file objects specified as { uri, type, name }
    // This is the native RN pattern for file uploads - it handles reading the file internally
    const formData = new FormData();
    formData.append('model_id', 'scribe_v1');
    
    // React Native's FormData accepts this special object format for files
    // The RN networking layer will read the file from the URI automatically
    formData.append('file', {
      uri: uri,
      type: 'audio/m4a',
      name: filename,
    } as any);
    
    console.log('Sending request to ElevenLabs STT with file:', filename);
    
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Accept': 'application/json',
        // Do NOT set Content-Type here, let fetch set it with proper multipart boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT API Error:', response.status, errorText);
      throw new Error(`Failed to transcribe audio: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Transcription result:', JSON.stringify(data));
    
    return data.text || '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};
