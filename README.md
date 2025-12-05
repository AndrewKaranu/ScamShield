# ScamPreventionApp

A small React Native + Expo app that simulates phishing and phone-call scam scenarios for training and testing. 

Quick start

Prerequisites
- Node.js (14+)
- npm or yarn
- Expo (you can use `npx expo` so installing globally isn't required)
- Expo Go app on your mobile device (for testing on a phone)

Install and run

1. Install dependencies

```powershell
cd ScamPreventionApp
npm install
```

2. Start the dev server

```powershell
npm start
# or
npx expo start
```

Testing on Expo Go (mobile)
- Open the Expo Dev Tools (the browser UI) or use the terminal QR code.
- Scan the QR code in Expo Dev Tools with the Expo Go app (iOS/Android) to run the app on your device.

Testing in a web browser
- In the Expo Dev Tools select "Run in web browser" or run:

```powershell
npx expo start --web
```

Environment / API keys

The app expects ElevenLabs and Anthropic API keys. Create a local config file at `src/config/apiKeys.local.js` (not committed) with the following shape:

```js
module.exports = {
  ANTHROPIC_API_KEY: 'your-anthropic-key',
  ELEVENLABS_API_KEY: 'your-elevenlabs-key',
  ELEVENLABS_VOICE_ID: 'your-elevenlabs-voice-id'
};
```

Notes and testing tips
- Grant microphone permissions when prompted (required for speech recording).
- Open the Phone simulation screen, press-and-hold the mic button to record, then release to send the recording for transcription.
- If transcription returns empty, check logs in the Metro/Expo terminal for `Transcribing audio from:` and `Buffer byteLength`—these help diagnose recording/upload issues.

License & safety
- Intended for demo/training only. Do not deploy phishing pages to production or use this project to harm others.

