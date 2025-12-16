import { setup, assign, fromCallback, fromPromise } from 'xstate';
import { generateText, generateAudio, transcribeAudio, GenerateTextResult } from '../services/aiService';
import { ScamScenario, ScamType, getScenario } from '../config/scamScenarios';

type Message = { role: 'user' | 'assistant'; content: string };

// Tool call result for tracking scam outcomes
export type ToolCallResult = {
  name: string;
  arguments: Record<string, any>;
};

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
  // Scenario support
  scenario: ScamScenario | null;
  scamOutcome: 'ongoing' | 'victim_failed' | 'victim_suspicious' | 'scammer_hung_up' | null;
  toolCalls: ToolCallResult[];
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
  | { type: 'AUDIO_FINISHED' }
  | { type: 'SET_SCENARIO'; scenarioType: ScamType }
  | { type: 'SCAM_DETECTED'; toolCalls: ToolCallResult[] };

const timerActor = fromCallback(({ sendBack }) => {
  const interval = setInterval(() => {
    sendBack({ type: 'TICK' });
  }, 1000);
  return () => clearInterval(interval);
});

const aiActor = fromPromise(async ({ input }: { input: { conversation: Message[], userText: string, scenario: ScamScenario | null } }) => {
    // Build conversation history
    const newHistory = [...input.conversation, { role: 'user', content: input.userText }];
    
    // Call generateText with scenario (for function calling support)
    const result: GenerateTextResult = await generateText(newHistory as any, input.scenario || undefined); 
    
    // Get the voice ID for conversation (use voices.conversation, voiceId, or default)
    const voiceId = input.scenario?.voices?.conversation || input.scenario?.voiceId;
    
    // Generate audio for the response text with scenario-specific voice
    const audio = result.text ? await generateAudio(result.text, voiceId) : null;
    
    return { 
      text: result.text, 
      audio,
      toolCalls: result.toolCalls || []
    };
});

// Actor for generating the scammer's opening line
const openingLineActor = fromPromise(async ({ input }: { input: { scenario: ScamScenario } }) => {
    const text = input.scenario.openingLine;
    // Use opening voice if specified, otherwise fall back to voiceId
    const voiceId = input.scenario.voices?.opening || input.scenario.voiceId;
    const audio = await generateAudio(text, voiceId);
    return { text, audio };
});

// Actor for generating the live agent greeting after automated message
const liveAgentGreetingActor = fromPromise(async ({ input }: { input: { scenario: ScamScenario; conversation: Message[] } }) => {
    // Generate the first response from the "live agent" using the conversation voice
    const voiceId = input.scenario.voices?.conversation || input.scenario.voiceId;
    // Use the AI to generate an appropriate greeting as the live agent
    const result = await generateText(input.conversation, input.scenario);
    const audio = await generateAudio(result.text, voiceId);
    return { text: result.text, audio, toolCalls: result.toolCalls || [] };
});

// Actor for a simple delay (simulates "connecting to agent")
const delayActor = fromPromise(async ({ input }: { input: { ms: number } }) => {
    await new Promise(resolve => setTimeout(resolve, input.ms));
    return {};
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
    openingLine: openingLineActor,
    liveAgentGreeting: liveAgentGreetingActor,
    delay: delayActor,
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
    scenario: null,
    scamOutcome: 'ongoing',
    toolCalls: [],
  },
  on: {
    SET_SCENARIO: {
      actions: assign({
        scenario: ({ event }) => getScenario(event.scenarioType)
      })
    }
  },
  states: {
    incoming: {
      on: {
        ACCEPT: [
          {
            // If we have a scenario, go to opening line state first
            guard: ({ context }) => context.scenario !== null,
            target: 'active.speakingOpening'
          },
          {
            target: 'active'
          }
        ],
        DECLINE: { target: 'ended' },
      },
    },
    active: {
      invoke: {
        src: 'timer',
      },
      initial: 'main',
      states: {
        speakingOpening: {
          entry: assign({ agentState: 'speaking' }),
          invoke: {
            src: 'openingLine',
            input: ({ context }) => ({
              scenario: context.scenario!
            }),
            onDone: {
              target: 'speakingOpeningAudio',
              actions: assign({
                conversation: ({ context, event }) => [
                  ...context.conversation,
                  { role: 'assistant', content: event.output.text }
                ],
                lastAudio: ({ event }) => event.output.audio,
              })
            },
            onError: {
              target: 'main',
              actions: assign({ agentState: 'listening' })
            }
          }
        },
        speakingOpeningAudio: {
          entry: () => console.log('=== ENTERED speakingOpeningAudio STATE ==='),
          on: {
            AUDIO_FINISHED: [
              // If scenario has separate voices (automated + live agent), go to connecting state
              {
                guard: ({ context }) => {
                  console.log('=== AUDIO_FINISHED guard check: voices.opening =', context.scenario?.voices?.opening);
                  return !!context.scenario?.voices?.opening;
                },
                target: 'connectingToAgent',
                actions: [
                  () => console.log('=== Going to connectingToAgent ==='),
                  assign({ agentState: 'thinking', lastAudio: null })
                ]
              },
              // Otherwise go directly to main (single voice scenario)
              {
                target: 'main',
                actions: assign({ agentState: 'listening', lastAudio: null })
              }
            ]
          }
        },
        // State for "connecting" to live agent after automated message
        connectingToAgent: {
          entry: () => console.log('=== ENTERED connectingToAgent STATE ==='),
          invoke: {
            src: 'delay',
            input: { ms: 2000 }, // 2 second pause to simulate transfer
            onDone: {
              target: 'generatingAgentGreeting',
              actions: () => console.log('=== Delay done, going to generatingAgentGreeting ===')
            }
          }
        },
        // Generate the live agent's greeting
        generatingAgentGreeting: {
          entry: () => console.log('=== ENTERED generatingAgentGreeting STATE ==='),
          invoke: {
            src: 'liveAgentGreeting',
            input: ({ context }) => ({
              scenario: context.scenario!,
              conversation: context.conversation
            }),
            onDone: {
              target: 'speakingAgentGreeting',
              actions: [
                () => console.log('=== liveAgentGreeting done, going to speakingAgentGreeting ==='),
                assign({
                  conversation: ({ context, event }) => [
                    ...context.conversation,
                    { role: 'assistant', content: event.output.text }
                  ],
                  lastAudio: ({ event }) => {
                    console.log('=== Setting lastAudio for agent greeting, audio length:', event.output.audio?.length);
                    return event.output.audio;
                  },
                  agentState: 'speaking'
                })
              ]
            },
            onError: {
              target: 'main',
              actions: assign({ agentState: 'listening' })
            }
          }
        },
        // Play the live agent's greeting audio
        speakingAgentGreeting: {
          entry: () => console.log('=== ENTERED speakingAgentGreeting STATE ==='),
          on: {
            AUDIO_FINISHED: {
              target: 'main',
              actions: [
                () => console.log('=== AUDIO_FINISHED in speakingAgentGreeting, going to main ==='),
                assign({ agentState: 'listening', lastAudio: null })
              ]
            }
          }
        },
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
                    userText: context._pendingUserText || '',
                    scenario: context.scenario
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
                        _pendingUserText: null,
                        // Track tool calls and update scam outcome
                        toolCalls: ({ context, event }) => [
                            ...context.toolCalls,
                            ...(event.output.toolCalls || [])
                        ],
                        scamOutcome: ({ context, event }) => {
                            const newToolCalls = event.output.toolCalls || [];
                            if (newToolCalls.some((tc: any) => tc.name === 'victim_provided_sensitive_info')) {
                                return 'victim_failed';
                            }
                            if (newToolCalls.some((tc: any) => tc.name === 'victim_showed_suspicion')) {
                                return 'victim_suspicious';
                            }
                            return context.scamOutcome;
                        }
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
            _recordingUri: null,
            scamOutcome: 'ongoing',
            toolCalls: [],
            // Keep scenario for restart
          }),
        },
      },
    },
  },
});
