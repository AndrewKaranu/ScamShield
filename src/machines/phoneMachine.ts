import { setup, assign, fromCallback, fromPromise } from 'xstate';
import { generateText, generateAudio, transcribeAudio } from '../services/aiService';

type Message = { role: 'user' | 'assistant'; content: string };

type PhoneContext = {
  duration: number;
  keypadValue: string;
  isMuted: boolean;
  isSpeakerOn: boolean;
  conversation: Message[];
  agentState: 'idle' | 'thinking' | 'speaking' | 'listening' | 'recording' | 'transcribing';
  lastAudio: string | null;
  _pendingUserText: string | null;
  _recordingUri: string | null;
};

type PhoneEvent = 
  | { type: 'ACCEPT' }
  | { type: 'DECLINE' }
  | { type: 'END_CALL' }
  | { type: 'TICK' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_SPEAKER' }
  | { type: 'SHOW_KEYPAD' }
  | { type: 'HIDE_KEYPAD' }
  | { type: 'PRESS_KEY'; key: string }
  | { type: 'RESTART' }
  | { type: 'USER_SPEAK'; text: string }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING'; uri: string }
  | { type: 'TRANSCRIPTION_COMPLETE'; text: string }
  | { type: 'AUDIO_FINISHED' };

const timerActor = fromCallback(({ sendBack }) => {
  const interval = setInterval(() => {
    sendBack({ type: 'TICK' });
  }, 1000);
  return () => clearInterval(interval);
});

const aiActor = fromPromise(async ({ input }: { input: { conversation: Message[], userText: string } }) => {
    // We only send the last few messages to save tokens if needed, but for now send all
    // Note: We need to ensure the input format matches what Anthropic expects
    const newHistory = [...input.conversation, { role: 'user', content: input.userText }];
    
    // Call services
    const text = await generateText(newHistory as any); 
    const audio = await generateAudio(text);
    
    return { text, audio };
});

const transcribeActor = fromPromise(async ({ input }: { input: { recordingUri: string } }) => {
    const text = await transcribeAudio(input.recordingUri);
    return { text };
});

export const phoneMachine = setup({
  types: {
    context: {} as PhoneContext,
    events: {} as PhoneEvent,
  },
  actors: {
    timer: timerActor,
    aiAgent: aiActor,
    transcriber: transcribeActor,
  },
}).createMachine({
  id: 'phone',
  initial: 'incoming',
  context: {
    duration: 0,
    keypadValue: '',
    isMuted: false,
    isSpeakerOn: false,
    conversation: [],
    agentState: 'idle',
    lastAudio: null,
    _pendingUserText: null,
    _recordingUri: null,
  },
  states: {
    incoming: {
      on: {
        ACCEPT: { target: 'active' },
        DECLINE: { target: 'ended' },
      },
    },
    active: {
      invoke: {
        src: 'timer',
      },
      initial: 'main',
      states: {
        main: {
          entry: assign({ agentState: 'listening' }),
          on: {
            SHOW_KEYPAD: { target: 'keypad' },
            USER_SPEAK: {
                target: 'processing',
                actions: assign({
                    agentState: 'thinking',
                    // Store userText temporarily, will add to conversation in processing
                    _pendingUserText: ({ event }) => event.text
                })
            },
            START_RECORDING: {
                target: 'recording',
                actions: assign({ agentState: 'recording' })
            }
          },
        },
        recording: {
          on: {
            STOP_RECORDING: {
                target: 'transcribing',
                actions: assign({
                    agentState: 'transcribing',
                    _recordingUri: ({ event }) => event.uri
                })
            },
            END_CALL: { target: '#phone.ended' }
          }
        },
        transcribing: {
            invoke: {
                src: 'transcriber',
                input: ({ context }) => ({
                    recordingUri: context._recordingUri || ''
                }),
                onDone: [
                    {
                        // If transcription is empty, go back to listening
                        guard: ({ event }) => !event.output.text || event.output.text.trim() === '',
                        target: 'main',
                        actions: assign({
                            agentState: 'listening',
                            _recordingUri: null,
                            _pendingUserText: null
                        })
                    },
                    {
                        // If transcription has content, proceed to processing
                        target: 'processing',
                        actions: assign({
                            agentState: 'thinking',
                            _pendingUserText: ({ event }) => event.output.text,
                            _recordingUri: null
                        })
                    }
                ],
                onError: {
                    target: 'main',
                    actions: assign({ 
                        agentState: 'listening', 
                        _recordingUri: null 
                    })
                }
            }
        },
        keypad: {
          on: {
            HIDE_KEYPAD: { target: 'main' },
            PRESS_KEY: {
              actions: assign({
                keypadValue: ({ context, event }) => context.keypadValue + event.key,
              }),
            },
          },
        },
        processing: {
            invoke: {
                src: 'aiAgent',
                input: ({ context }) => ({
                    conversation: context.conversation,
                    userText: context._pendingUserText || ''
                }),
                onDone: {
                    target: 'speaking',
                    actions: assign({
                        conversation: ({ context, event }) => [
                            ...context.conversation,
                            { role: 'user', content: context._pendingUserText || '' },
                            { role: 'assistant', content: event.output.text }
                        ],
                        agentState: 'speaking',
                        lastAudio: ({ event }) => event.output.audio,
                        _pendingUserText: null
                    })
                },
                onError: {
                    target: 'main',
                    actions: assign({ agentState: 'idle', _pendingUserText: null })
                }
            }
        },
        speaking: {
            on: {
                AUDIO_FINISHED: {
                    target: 'main',
                    actions: assign({ agentState: 'listening', lastAudio: null })
                }
            }
        }
      },
      on: {
        END_CALL: { target: 'ended' },
        TICK: {
          actions: assign({ duration: ({ context }) => context.duration + 1 }),
        },
        TOGGLE_MUTE: {
          actions: assign({ isMuted: ({ context }) => !context.isMuted }),
        },
        TOGGLE_SPEAKER: {
          actions: assign({ isSpeakerOn: ({ context }) => !context.isSpeakerOn }),
        },
      },
    },
    ended: {
      on: {
        RESTART: {
          target: 'incoming',
          actions: assign({
            duration: 0,
            keypadValue: '',
            isMuted: false,
            isSpeakerOn: false,
            conversation: [],
            agentState: 'idle',
            lastAudio: null,
            _pendingUserText: null,
            _recordingUri: null
          }),
        },
      },
    },
  },
});
