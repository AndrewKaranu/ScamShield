import { setup, assign, fromCallback, fromPromise } from 'xstate';
import { generateText, generateAudio } from '../services/aiService';

type Message = { role: 'user' | 'assistant'; content: string };

type PhoneContext = {
  duration: number;
  keypadValue: string;
  isMuted: boolean;
  isSpeakerOn: boolean;
  conversation: Message[];
  agentState: 'idle' | 'thinking' | 'speaking' | 'listening';
  lastAudio: string | null;
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

export const phoneMachine = setup({
  types: {
    context: {} as PhoneContext,
    events: {} as PhoneEvent,
  },
  actors: {
    timer: timerActor,
    aiAgent: aiActor,
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
          on: {
            SHOW_KEYPAD: { target: 'keypad' },
            USER_SPEAK: {
                target: 'processing',
                actions: assign({
                    conversation: ({ context, event }) => [
                        ...context.conversation,
                        { role: 'user', content: event.text }
                    ],
                    agentState: 'thinking'
                })
            }
          },
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
                    userText: context.conversation[context.conversation.length - 1].content
                }),
                onDone: {
                    target: 'speaking',
                    actions: assign({
                        conversation: ({ context, event }) => [
                            ...context.conversation,
                            { role: 'assistant', content: event.output.text }
                        ],
                        agentState: 'speaking',
                        lastAudio: ({ event }) => event.output.audio
                    })
                },
                onError: {
                    target: 'main',
                    actions: assign({ agentState: 'idle' }) // TODO: Handle error better
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
            lastAudio: null
          }),
        },
      },
    },
  },
});
