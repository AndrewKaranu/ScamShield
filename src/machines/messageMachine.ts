import { setup, assign } from 'xstate';

export interface Message {
  type: 'received' | 'sent';
  text: string;
}

export interface Conversation {
  id: string;
  sender: string;
  time: string;
  preview: string;
  avatarColor: string;
  avatarText: string;
  unread: boolean;
  active: boolean;
  messages: Message[];
}

type MessageContext = {
  conversations: Conversation[];
  activeConversationId: string | null;
  replyText: string;
  isDarkMode: boolean;
};

type MessageEvent =
  | { type: 'OPEN_CONVERSATION'; id: string }
  | { type: 'BACK' }
  | { type: 'TYPE_REPLY'; text: string }
  | { type: 'SEND_REPLY' }
  | { type: 'TOGGLE_THEME' };

const initialConversations: Conversation[] = [
    {
        id: 'purolator',
        sender: 'Purolator – Delivery Notice',
        time: 'Fri, Oct 10',
        preview: 'We were unable to deliver your package...',
        avatarColor: '#8e8e93',
        avatarText: 'P',
        unread: true,
        active: true,
        messages: [
            { type: 'received', text: 'Purolator – Delivery Notice\nWe were unable to deliver your package due to incomplete address information. Please update your delivery details by October 12, 2025, to avoid return or additional storage fees.\n\n1. Delivery attempt will be suspended starting October 12\n2. Pickup at local service point may be restricted\n3. Package may be returned to the sender\n\nAction Link: https://purlotor.mobile-ucj.vip/ca\n\nUpdate before October 12 to ensure successful delivery. (Reply Y and re-open this message to click the link, or copy it to your browser.)' }
        ]
    },
    {
        id: 'mom',
        sender: 'Mom',
        time: '10:42 AM',
        preview: 'How do I open the google?',
        avatarColor: '#FF9500',
        avatarText: 'M',
        unread: false,
        active: false,
        messages: [
            { type: 'sent', text: 'Mom, just click the icon.' },
            { type: 'received', text: 'Which one? The blue e?' },
            { type: 'sent', text: 'No, that\'s Internet Explorer. The colorful G.' },
            { type: 'received', text: 'I don\'t see a G. I see a fox.' },
            { type: 'sent', text: 'That\'s Firefox. Just use that.' },
            { type: 'received', text: 'How do I open the google in the fox?' }
        ]
    },
    {
        id: 'boss',
        sender: 'Boss',
        time: 'Yesterday',
        preview: 'Can you come in on Saturday?',
        avatarColor: '#5856D6',
        avatarText: 'B',
        unread: false,
        active: false,
        messages: [
            { type: 'received', text: 'Hey, we\'re a bit behind. Can you come in on Saturday?' },
            { type: 'sent', text: 'Oh no, I think I\'m coming down with something.' },
            { type: 'received', text: 'It\'s Tuesday.' },
            { type: 'sent', text: 'It\'s a slow-acting virus. Very rare.' }
        ]
    },
    {
        id: 'ex',
        sender: 'Jessica',
        time: 'Tuesday',
        preview: 'I miss you',
        avatarColor: '#FF2D55',
        avatarText: 'J',
        unread: false,
        active: false,
        messages: [
            { type: 'received', text: 'I miss you' },
            { type: 'sent', text: 'New phone who dis' },
            { type: 'received', text: 'It\'s Jessica. We dated for 3 years.' },
            { type: 'sent', text: 'Sorry, I lost all my contacts when I upgraded to the iPhone 15 Pro Max Titanium.' }
        ]
    },
    {
        id: 'landlord',
        sender: 'Landlord',
        time: 'Sunday',
        preview: 'Rent is due',
        avatarColor: '#34C759',
        avatarText: 'L',
        unread: false,
        active: false,
        messages: [
            { type: 'received', text: 'Rent is due tomorrow.' },
            { type: 'sent', text: 'The heater is still broken.' },
            { type: 'received', text: 'Rent is due tomorrow.' },
            { type: 'sent', text: 'I\'m cold.' },
            { type: 'received', text: 'Buy a sweater. Rent is due.' }
        ]
    },
    {
        id: 'scam',
        sender: 'Unknown',
        time: 'Last Week',
        preview: 'Your car warranty is about to expire',
        avatarColor: '#AF52DE',
        avatarText: 'U',
        unread: false,
        active: false,
        messages: [
            { type: 'received', text: 'Your car warranty is about to expire. Press 1 to speak to an agent.' },
            { type: 'sent', text: 'I don\'t have a car. I ride a unicycle.' },
            { type: 'received', text: 'We have a warranty for that too.' }
        ]
    }
];

export const messageMachine = setup({
  types: {
    context: {} as MessageContext,
    events: {} as MessageEvent,
  },
}).createMachine({
  id: 'message',
  initial: 'list',
  context: {
    conversations: initialConversations,
    activeConversationId: null,
    replyText: '',
    isDarkMode: true,
  },
  states: {
    list: {
      on: {
        OPEN_CONVERSATION: {
          target: 'conversation',
          actions: assign({ activeConversationId: ({ event }) => (event as { type: 'OPEN_CONVERSATION'; id: string }).id }),
        },
        TOGGLE_THEME: {
          actions: assign({ isDarkMode: ({ context }) => !context.isDarkMode }),
        },
      },
    },
    conversation: {
      on: {
        BACK: {
          target: 'list',
          actions: assign({ activeConversationId: null, replyText: '' }),
        },
        TYPE_REPLY: {
          actions: assign({ replyText: ({ event }) => (event as { type: 'TYPE_REPLY'; text: string }).text }),
        },
        SEND_REPLY: {
          actions: assign({
            conversations: ({ context }) => {
              return context.conversations.map(c => {
                if (c.id === context.activeConversationId) {
                  return {
                    ...c,
                    messages: [...c.messages, { type: 'sent' as const, text: context.replyText }]
                  };
                }
                return c;
              });
            },
            replyText: '',
          }),
        },
        TOGGLE_THEME: {
            actions: assign({ isDarkMode: ({ context }) => !context.isDarkMode }),
        },
      },
    },
  },
});
