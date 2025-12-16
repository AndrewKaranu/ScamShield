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
  | { type: 'TOGGLE_THEME' }
  | { type: 'LOAD_SCENARIO'; scenario: string };

const defaultConversations: Conversation[] = [
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
    }
];

const canadaPostConversations: Conversation[] = [
    {
        id: 'canada-post',
        sender: 'Canada Post',
        time: 'Now',
        preview: 'Package on hold: Unpaid fees',
        avatarColor: '#E31837',
        avatarText: 'CP',
        unread: true,
        active: true,
        messages: [
            { type: 'received', text: 'Canada Post: Your package CA892341 is on hold due to unpaid fees ($24.45). To avoid return to sender, please resolve this immediately: https://canadapost-pay.com/track/CA892341' }
        ]
    },
    // Add some filler conversations to make it look realistic, but safe ones
    defaultConversations[0], // Mom
    defaultConversations[1], // Boss
];

const purolatorConversations: Conversation[] = [
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
    defaultConversations[0], // Mom
    defaultConversations[3], // Landlord
];

const hydroQuebecConversations: Conversation[] = [
    {
        id: 'hydro-quebec',
        sender: 'Hydro-Québec',
        time: 'Now',
        preview: 'Refund Notification',
        avatarColor: '#1224B8',
        avatarText: 'HQ',
        unread: true,
        active: true,
        messages: [
            { type: 'received', text: 'Hydro-Québec: You have an unclaimed refund of $84.23 from your last billing cycle. Claim it now before it expires: https://hydro-quebec-refund.com/claim' }
        ]
    },
    defaultConversations[2], // Ex
    defaultConversations[3], // Landlord
];

const tdBankConversations: Conversation[] = [
    {
        id: 'td-bank',
        sender: 'TD Bank',
        time: 'Now',
        preview: 'Security Alert',
        avatarColor: '#008a00',
        avatarText: 'TD',
        unread: true,
        active: true,
        messages: [
            { type: 'received', text: 'TD Bank Security Alert: We have detected an unauthorized login attempt on your account. To secure your funds, please download the mandatory security update immediately: https://td-security-update.com/v4' }
        ]
    },
    defaultConversations[0], // Mom
    defaultConversations[1], // Boss
];

// ============================================
// LEGITIMATE (NON-SCAM) TEXT SCENARIOS
// ============================================

const legitCanadaPostConversations: Conversation[] = [
    {
        id: 'legit-canada-post',
        sender: 'Canada Post',
        time: 'Today',
        preview: 'Delivery attempt today for package #CA-938271',
        avatarColor: '#E31837',
        avatarText: 'CP',
        unread: true,
        active: false, // No reply needed
        messages: [
            { type: 'received', text: 'A delivery attempt will be made today for package #CA-938271.\nTo track your item, click here:\nhttps://www.canadapost-postescanada.ca/track\nSignature may be required upon delivery.\nThank you,\nCanada Post' }
        ]
    },
    defaultConversations[0], // Mom
    defaultConversations[1], // Boss
];

const legitClinicConversations: Conversation[] = [
    {
        id: 'legit-clinic',
        sender: 'Medical Clinic',
        time: 'Today',
        preview: 'Appointment reminder for tomorrow',
        avatarColor: '#3B82F6',
        avatarText: 'MC',
        unread: true,
        active: true,
        messages: [
            { type: 'received', text: 'Reminder: Your appointment is\nscheduled for tomorrow at 10:30 AM\nwith Dr. Martin.\n\nReply 1 to confirm.\nReply 2 to cancel.\n\nDo not reply with personal\nmedical information.' }
        ]
    },
    defaultConversations[0], // Mom
    defaultConversations[2], // Jessica
];

const legitSaaqConversations: Conversation[] = [
    {
        id: 'legit-saaq',
        sender: 'SAAQ',
        time: 'Today',
        preview: 'Driver\'s licence renewal notice available',
        avatarColor: '#1D4ED8',
        avatarText: 'SQ',
        unread: true,
        active: false, // No reply needed
        messages: [
            { type: 'received', text: 'SAAQ\nYour driver\'s licence renewal\nnotice is available in your\nonline account.\n\nTo review your notice, visit:\nhttps://saaq.gouv.qc.ca\n\nDo not reply to this message.' }
        ]
    },
    defaultConversations[1], // Boss
    defaultConversations[3], // Landlord
];

const getConversationsForScenario = (scenario: string) => {
    switch (scenario) {
        case 'canada-post':
            return canadaPostConversations;
        case 'purolator':
            return purolatorConversations;
        case 'hydro-quebec':
            return hydroQuebecConversations;
        case 'td-bank':
            return tdBankConversations;
        // Legitimate scenarios
        case 'legit-canada-post':
            return legitCanadaPostConversations;
        case 'legit-clinic':
            return legitClinicConversations;
        case 'legit-saaq':
            return legitSaaqConversations;
        default:
            return [...defaultConversations, ...purolatorConversations]; // Default view shows everything or a mix
    }
};

export const messageMachine = setup({
  types: {
    context: {} as MessageContext,
    events: {} as MessageEvent,
  },
}).createMachine({
  id: 'message',
  initial: 'list',
  context: {
    conversations: defaultConversations,
    activeConversationId: null,
    replyText: '',
    isDarkMode: true,
  },
  states: {
    list: {
      on: {
        LOAD_SCENARIO: {
            actions: assign({
                conversations: ({ event }) => getConversationsForScenario((event as { type: 'LOAD_SCENARIO'; scenario: string }).scenario)
            })
        },
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
                  const newMessages = [...c.messages, { type: 'sent' as const, text: context.replyText }];
                  
                  // Handle clinic auto-replies
                  if (c.id === 'legit-clinic') {
                    const trimmedReply = context.replyText.trim();
                    if (trimmedReply === '1') {
                      newMessages.push({ 
                        type: 'received' as const, 
                        text: 'Thank you! Your appointment with Dr. Martin tomorrow at 10:30 AM has been confirmed. Please arrive 15 minutes early.' 
                      });
                    } else if (trimmedReply === '2') {
                      newMessages.push({ 
                        type: 'received' as const, 
                        text: 'Your appointment has been cancelled. Please call 514-555-0100 to reschedule.' 
                      });
                    }
                  }
                  
                  return {
                    ...c,
                    messages: newMessages
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
