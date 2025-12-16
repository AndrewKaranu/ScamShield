# ScamPreventionApp

A React Native + Expo app that trains users to recognize scams through realistic simulations of phone calls, text messages, and emails.

## Features

### 🎮 Two Modes

**Test Mode** - Take a scored test with 6 random scenarios (mix of scams and legitimate messages). Get graded A-F based on your responses.

**Practice Mode** - Explore individual scenarios at your own pace with optional guided walkthroughs.

### 📞 Phone Call Scams
- **Grandchild Emergency** - Fake family member in trouble asking for money
- **Bank Fraud Department** - Caller pretending to be from your bank's security team
- **Hydro-Québec** - Fake utility company threatening service disconnection

### 💬 Text Message Scams
- **Canada Post Fee** - Fake delivery notification asking for payment
- **Hydro-Québec Refund** - Phishing link disguised as a refund offer
- **TD Bank Security** - Fake security alert with malicious download

### 📧 Email Scams
- **Loto-Québec Prize** - Fake lottery winning notification

### ✅ Legitimate Scenarios (for Test Mode)
The app also includes real legitimate messages to train users not to be overly paranoid:
- Canada Post delivery updates
- Medical clinic reminders
- SAAQ notices
- Google security codes
- CRA account updates
- Desjardins activity alerts

### 🌐 Fake Websites
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

### Prerequisites
- Node.js (14+)
- Expo Go app on your mobile device

### Install and Run

```bash
cd ScamPreventionApp
npm install
npx expo start
```

Scan the QR code with Expo Go to run on your phone.

### API Keys

Create `src/config/apiKeys.local.js`:

```js
module.exports = {
  XAI_API_KEY: 'your-xai-grok-key',
  ELEVENLABS_API_KEY: 'your-elevenlabs-key',
  ELEVENLABS_VOICE_ID: 'your-elevenlabs-voice-id'
};
```

## License & Safety

**For training purposes only.** Do not use this project to harm others.

