import { setup, assign } from 'xstate';

export interface Email {
  id: string;
  sender: string;
  senderEmail?: string;
  subject: string;
  preview: string;
  body?: string;
  time: string;
  avatarColor: string;
  avatarText: string;
  unread: boolean;
  isNew?: boolean;
  isScam?: boolean;
  scamType?: string;
}

type MailContext = {
  emails: Email[];
  selectedEmails: string[];
  currentEmailId: string | null;
  isSideMenuOpen: boolean;
  isAccountModalOpen: boolean;
  snackbarMessage: string | null;
};

type MailEvent =
  | { type: 'OPEN_EMAIL'; id: string }
  | { type: 'BACK_TO_INBOX' }
  | { type: 'BACK_FROM_COMPOSE' }
  | { type: 'REPLY' }
  | { type: 'SEND_REPLY' }
  | { type: 'DELETE_EMAIL' }
  | { type: 'LONG_PRESS_EMAIL'; id: string }
  | { type: 'TOGGLE_SELECTION'; id: string }
  | { type: 'CANCEL_SELECTION' }
  | { type: 'DELETE_SELECTED' }
  | { type: 'OPEN_MENU' }
  | { type: 'CLOSE_MENU' }
  | { type: 'OPEN_ACCOUNT' }
  | { type: 'CLOSE_ACCOUNT' }
  | { type: 'DISMISS_SNACKBAR' }
  | { type: 'LOAD_SCENARIO'; scenario: string }
  | { type: 'RESET' };

const defaultEmails: Email[] = [
  { id: '1', sender: 'Google Community Team', subject: 'Finish setting up your new Google Account', preview: 'Hi Andre, Welcome to Google. Your new account comes with...', time: '10:42 AM', avatarColor: '#4285f4', avatarText: 'G', unread: true, isNew: true },
  { id: '2', sender: 'YouTube', subject: 'New subscribers on your channel', preview: 'Congrats! You have 10 new subscribers this week.', time: 'Yesterday', avatarColor: '#ff0000', avatarText: 'Y', unread: false },
  { id: '3', sender: 'LinkedIn', subject: 'You appeared in 5 searches this week', preview: 'See who is looking for you on LinkedIn.', time: 'Oct 24', avatarColor: '#0077b5', avatarText: 'in', unread: false },
  { id: '4', sender: 'Amazon', subject: 'Your order has shipped', preview: 'Your package is on the way. Track your shipment...', time: 'Oct 20', avatarColor: '#ff9900', avatarText: 'A', unread: false },
  { id: '5', sender: 'Netflix', subject: 'New login to your account', preview: 'We noticed a new login to your account from...', time: 'Oct 15', avatarColor: '#e50914', avatarText: 'N', unread: false },
];

const lotoQuebecEmails: Email[] = [
  { 
    id: 'loto-quebec', 
    sender: 'Loto-Québec Rewards', 
    senderEmail: 'noreply@loto-quebec-winners.com',
    subject: '🎰 LAST CHANCE: Claim Your $2,500 Prize!', 
    preview: 'CONGRATULATIONS! You have been selected as a winner in our monthly draw...', 
    body: `🎰 CONGRATULATIONS! 🎰

Dear Valued Customer,

You have been SELECTED as a winner in our exclusive Loto-Québec Monthly Customer Appreciation Draw!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 YOUR PRIZE: $2,500.00 💰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is your LAST CHANCE to claim your prize! Your winning entry was randomly choosen from millions of participants in our anniversary promotion.

⚠️ URGENT: This offer expires in 24 HOURS!

To claim your prize, simply click the link below and login to verify your identity:

🔗 https://loto-quebec-winners.com/claim-prize

🔴 WARNING: If you do not claim within 24 hours, your prize will be forfeited and given to another participant.

Don't miss this once-in-a-lifetime opportunity!

Best regards,
Loto-Québec Rewards Team

---
This email was sent to you because you are a valued customer. To unsubscribe, click here.`,
    time: '9:15 AM', 
    avatarColor: '#003366', 
    avatarText: 'LQ', 
    unread: true, 
    isNew: true,
    isScam: true,
    scamType: 'loto-quebec'
  },
  { id: '1', sender: 'Google Community Team', subject: 'Finish setting up your new Google Account', preview: 'Hi Andre, Welcome to Google. Your new account comes with...', time: '10:42 AM', avatarColor: '#4285f4', avatarText: 'G', unread: false },
  { id: '4', sender: 'Amazon', subject: 'Your order has shipped', preview: 'Your package is on the way. Track your shipment...', time: 'Oct 20', avatarColor: '#ff9900', avatarText: 'A', unread: false },
];

const getEmailsForScenario = (scenario: string): Email[] => {
  switch (scenario) {
    case 'loto-quebec':
      return lotoQuebecEmails;
    default:
      return defaultEmails;
  }
};

export const mailMachine = setup({
  types: {
    context: {} as MailContext,
    events: {} as MailEvent,
  },
}).createMachine({
  id: 'mail',
  initial: 'inbox',
  context: {
    emails: defaultEmails,
    selectedEmails: [],
    currentEmailId: null,
    isSideMenuOpen: false,
    isAccountModalOpen: false,
    snackbarMessage: null,
  },
  states: {
    inbox: {
      initial: 'normal',
      states: {
        normal: {
          on: {
            LOAD_SCENARIO: {
              actions: assign({
                emails: ({ event }) => getEmailsForScenario((event as { type: 'LOAD_SCENARIO'; scenario: string }).scenario)
              })
            },
            OPEN_EMAIL: {
              target: '#mail.detail',
              actions: assign({ currentEmailId: ({ event }) => (event as { type: 'OPEN_EMAIL'; id: string }).id }),
            },
            LONG_PRESS_EMAIL: {
              target: 'selection',
              actions: assign({ selectedEmails: ({ event }) => [(event as { type: 'LONG_PRESS_EMAIL'; id: string }).id] }),
            },
            OPEN_MENU: { actions: assign({ isSideMenuOpen: true }) },
            OPEN_ACCOUNT: { actions: assign({ isAccountModalOpen: true }) },
          },
        },
        selection: {
          on: {
            TOGGLE_SELECTION: {
              actions: assign({
                selectedEmails: ({ context, event }) => {
                  const id = (event as { type: 'TOGGLE_SELECTION'; id: string }).id;
                  const set = new Set(context.selectedEmails);
                  if (set.has(id)) set.delete(id);
                  else set.add(id);
                  return Array.from(set);
                },
              }),
            },
            CANCEL_SELECTION: {
              target: 'normal',
              actions: assign({ selectedEmails: [] }),
            },
            DELETE_SELECTED: {
              target: 'normal',
              actions: assign({
                emails: ({ context }) => context.emails.filter(e => !context.selectedEmails.includes(e.id)),
                selectedEmails: [],
                snackbarMessage: ({ context }) => `${context.selectedEmails.length} deleted`,
              }),
            },
          },
        },
      },
      on: {
        CLOSE_MENU: { actions: assign({ isSideMenuOpen: false }) },
        CLOSE_ACCOUNT: { actions: assign({ isAccountModalOpen: false }) },
      },
    },
    detail: {
      on: {
        BACK_TO_INBOX: { target: 'inbox', actions: assign({ currentEmailId: null }) },
        REPLY: { target: 'compose' },
        DELETE_EMAIL: {
          target: 'inbox',
          actions: assign({
            emails: ({ context }) => context.emails.filter(e => e.id !== context.currentEmailId),
            currentEmailId: null,
            snackbarMessage: '1 deleted',
          }),
        },
      },
    },
    compose: {
      on: {
        BACK_FROM_COMPOSE: { target: 'detail' },
        SEND_REPLY: {
          target: 'inbox',
          actions: assign({
            snackbarMessage: 'Message sent!',
            currentEmailId: null,
          }),
        },
      },
    },
  },
  on: {
    DISMISS_SNACKBAR: { actions: assign({ snackbarMessage: null }) },
    RESET: {
        target: '.inbox',
        actions: assign({
            emails: defaultEmails,
            selectedEmails: [],
            currentEmailId: null,
            isSideMenuOpen: false,
            isAccountModalOpen: false,
            snackbarMessage: null
        })
    }
  },
});
