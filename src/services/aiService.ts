// Try to import local keys first, fall back to placeholder keys
let apiKeys: { XAI_API_KEY: string; ELEVENLABS_API_KEY: string; ELEVENLABS_VOICE_ID: string };
try {
  apiKeys = require('../config/apiKeys.local');
} catch {
  apiKeys = require('../config/apiKeys');
}
const { XAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } = apiKeys;

import * as FileSystem from 'expo-file-system';
import { File, Paths } from 'expo-file-system';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Buffer } from 'buffer';
import { ToolDefinition, ScamScenario } from '../config/scamScenarios';

// Track if audio mode has been initialized
// Enable playback mode - audio plays through loudspeaker on iOS
// This MUST be called before playing audio to ensure speaker output
export const enablePlaybackMode = async () => {
  console.log('Enabling playback mode (loudspeaker)...');
  await setAudioModeAsync({
    playsInSilentMode: true,
    // allowsRecording: false tells iOS to use playback-only audio session
    // which routes audio through the main speaker, not the earpiece
    allowsRecording: false,
    interruptionMode: 'doNotMix',
  });
  console.log('Playback mode enabled');
};

// Enable recording mode specifically - call this before recording
// This reconfigures the audio session to allow microphone input
export const enableRecordingMode = async () => {
  console.log('Enabling recording mode...');
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    interruptionMode: 'doNotMix',
    shouldRouteThroughEarpiece: false,
  });
  // Longer delay to let iOS fully reconfigure the audio session
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('Recording mode enabled');
};

// Deprecated: Speaker toggle not needed since we always use loudspeaker
export const setAudioOutput = async (_useSpeaker: boolean) => {
  await enablePlaybackMode();
};

const DEFAULT_SYSTEM_PROMPT = "You are a friendly person having a casual phone conversation. Be warm, personable, and conversational. Keep your responses short, under 2 sentences.";

// Response type for generateText with function calling support
export interface GenerateTextResult {
  text: string;
  toolCalls?: {
    id: string;
    name: string;
    arguments: Record<string, any>;
  }[];
}

export const generateText = async (
  conversationHistory: { role: string, content: string }[],
  scenario?: ScamScenario
): Promise<GenerateTextResult> => {
  try {
    // Filter out empty messages to avoid API errors
    const filteredHistory = conversationHistory.filter(msg => msg.content && msg.content.trim() !== '');
    
    if (filteredHistory.length === 0) {
      console.log('No valid messages to send to Grok, returning default response');
      return { text: "I didn't catch that. Could you say that again?" };
    }
    
    // Use scenario-specific system prompt if available
    const systemPrompt = scenario?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    
    // Build messages array with system prompt first, then conversation
    const messages = [
      { role: 'system', content: systemPrompt },
      ...filteredHistory
    ];
    
    console.log('Calling xAI Grok API with scenario:', scenario?.id || 'default');
    
    // Build request body with optional tools
    const requestBody: any = {
      model: 'grok-3-fast',
      max_tokens: 250,
      messages: messages,
    };
    
    // Add tools if scenario defines them
    if (scenario?.tools && scenario.tools.length > 0) {
      requestBody.tools = scenario.tools;
      requestBody.tool_choice = 'auto'; // Let the model decide when to call tools
    }
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.error) {
        console.error('Grok API Error:', data.error);
        throw new Error(data.error.message || JSON.stringify(data.error));
    }
    
    const message = data.choices[0].message;
    
    // Check for tool calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log('Tool calls detected:', message.tool_calls);
      
      const toolCalls = message.tool_calls.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}')
      }));
      
      // Return both the text (if any) and the tool calls
      return {
        text: message.content || '',
        toolCalls
      };
    }
    
    // xAI uses OpenAI-compatible response format: choices[0].message.content
    return { text: message.content || '' };
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
};

/**
 * Removes voice effect annotations like *sniffling*, *crying*, *laughs*, etc.
 * These are often included by LLMs but read literally by TTS engines.
 */
const sanitizeTextForTTS = (text: string): string => {
  // Remove text between asterisks (e.g., *sniffling*, *crying*, *laughs nervously*)
  let sanitized = text.replace(/\*[^*]+\*/g, '');
  
  // Remove text between parentheses that look like stage directions (e.g., (sobs), (whispers))
  sanitized = sanitized.replace(/\([^)]*(?:sobs?|cries?|crying|sniff|laugh|giggles?|whispers?|sighs?|gasps?|pauses?|clears throat)[^)]*\)/gi, '');
  
  // Clean up extra whitespace left behind
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

export const generateAudio = async (text: string, voiceId?: string) => {
  try {
    // Sanitize text to remove voice effects before sending to TTS
    const cleanText = sanitizeTextForTTS(text);
    console.log('Original text:', text);
    console.log('Sanitized for TTS:', cleanText);
    
    // Use provided voiceId or fall back to default
    const selectedVoiceId = voiceId || ELEVENLABS_VOICE_ID;
    console.log('Using voice ID:', selectedVoiceId);
    
    if (!cleanText) {
      // If sanitizing removed all text, return empty
      console.log('No text left after sanitization, skipping TTS');
      return '';
    }
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
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
    // Always ensure playback mode is set for loudspeaker output
    await enablePlaybackMode();
    
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
    // Don't await - audio mode should already be set by the screen on mount
    // This avoids delay in starting the ringtone
    enablePlaybackMode();
    
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
