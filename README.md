# ScamPreventionApp

A React Native + Expo app that trains users to recognize scams through realistic simulations of phone calls, text messages, and emails.

## Features

###  Two Modes

**Test Mode** - Take a scored test with 6 random scenarios (mix of scams and legitimate messages). Get graded A-F based on your responses.

**Practice Mode** - Explore individual scenarios at your own pace with optional guided walkthroughs.

###  Phone Call Scams
- **Grandchild Emergency** - Fake family member in trouble asking for money
- **Bank Fraud Department** - Caller pretending to be from your bank's security team
- **Hydro-Québec** - Fake utility company threatening service disconnection

###  Text Message Scams
- **Canada Post Fee** - Fake delivery notification asking for payment
- **Hydro-Québec Refund** - Phishing link disguised as a refund offer
- **TD Bank Security** - Fake security alert with malicious download

###  Email Scams
- **Loto-Québec Prize** - Fake lottery winning notification

###  Legitimate Scenarios (for Test Mode)
The app also includes real legitimate messages to train users not to be overly paranoid:
- Canada Post delivery updates
- Medical clinic reminders
- SAAQ notices
- Google security codes
- CRA account updates
- Desjardins activity alerts

###  Fake Websites
Realistic phishing page simulations:
- Hydro-Québec login page
- Canada Post payment portal
- TD Bank security update page
- Loto-Québec prize claim site

## Scoring (Test Mode)

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | Excellent protection |
| B | 80-89 | Good awareness |
| C | 70-79 | Needs improvement |
| D | 60-69 | At risk |
| F | 0-59 | High risk |

**Metrics tracked:**
- Call duration (shorter = better)
- Clicked scam links
- Entered credentials/payment info
- Correctly identified legitimate messages

## Quick Start

### Option 1: Try It Without Setup

Don't want to run the code yourself? Email **andrewkaranu03@gmail.com** and I'll start the server and send you a link to open directly in Expo Go.

**What you need:**
1. Download "Expo Go" from the [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)
2. Email me and I'll send you a link
3. Open the link on your phone - it will launch the app in Expo Go

### Option 2: Run It Yourself

#### Prerequisites
- Node.js (14+)
- Expo Go app on your mobile device (see links above)

#### Install and Run

```bash
cd ScamPreventionApp
npm install
npx expo start
```

#### Connect Your Phone

1. Make sure your phone and computer are on the **same WiFi network**
2. Open Expo Go on your phone
3. **iOS**: Scan the QR code with your Camera app, then tap the notification to open in Expo Go
4. **Android**: Tap "Scan QR code" in Expo Go and scan the QR code from your terminal

> **Tip:** If you have connection issues, try running `npx expo start --tunnel` instead - this works even on different networks but you have to have Ngrok installed.

#### API Keys

Create `src/config/apiKeys.local.js`:

```js
module.exports = {
  XAI_API_KEY: 'your-xai-grok-key',
  ELEVENLABS_API_KEY: 'your-elevenlabs-key',
  ELEVENLABS_VOICE_ID: 'your-elevenlabs-voice-id'
};
```

**Where to get API keys:**

- **xAI Grok** - Sign up at [console.x.ai](https://console.x.ai/) to get your API key. Used for AI-powered phone call conversations.

- **ElevenLabs** - Create an account at [elevenlabs.io](https://elevenlabs.io/). Go to your Profile → API Keys to get your key. For Voice ID, go to Voices → click any voice → copy the Voice ID from the URL or settings. Used for realistic text-to-speech and speech-to-text.

## License & Safety

**For training purposes only.** Do not use this project to harm others.

