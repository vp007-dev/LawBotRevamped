# LawBot360 Setup Guide

This guide will help you set up LawBot360 with AI integration using OpenRouter API.

## 🔧 Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **OpenRouter API Key**
4. **Firebase Project** (optional, for authentication and database)

## 📝 Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/lawbot360.git
cd lawbot360

# Install dependencies
npm install
```

### 2. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Go to "Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# OpenRouter API Configuration
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here

# Firebase Configuration (Optional)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🤖 AI Configuration

### OpenRouter Models Available

The system is configured to use `anthropic/claude-3.5-sonnet` by default, but you can change it in `src/services/aiService.js`:

```javascript
// Available models:
- anthropic/claude-3.5-sonnet (Recommended)
- openai/gpt-4o
- openai/gpt-4o-mini
- google/gemini-pro-1.5
- meta-llama/llama-3.1-8b-instruct
```

### Customizing the Legal Prompt

Edit the `getSystemPrompt()` method in `src/services/aiService.js` to customize the AI's legal expertise:

```javascript
getSystemPrompt() {
  return `You are LawBot360, a professional AI legal assistant specializing in Indian law...`;
}
```

## 🎙️ Voice Features Setup

### Browser Compatibility

Voice features require:
- **Chrome/Edge**: Full support
- **Firefox**: Limited support
- **Safari**: Basic support
- **Mobile browsers**: Varies

### Permissions Required

The app will request:
- Microphone access for voice input
- Audio playback for text-to-speech

## 🔥 Firebase Setup (Optional)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication and Firestore

### 2. Get Configuration

1. Go to Project Settings
2. Scroll to "Your apps"
3. Add a web app
4. Copy the configuration object

### 3. Update Environment Variables

Add Firebase config to your `.env` file:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Deploy to Netlify

```bash
# Build the project
npm run build

# Upload dist/ folder to Netlify
# Add environment variables in Netlify dashboard
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
firebase deploy
```

## 🔧 Troubleshooting

### Common Issues

#### 1. API Key Not Working
- Ensure the key starts with `sk-or-v1-`
- Check if you have credits in your OpenRouter account
- Verify the key is correctly set in `.env`

#### 2. Voice Features Not Working
- Check browser compatibility
- Ensure microphone permissions are granted
- Test in HTTPS environment (required for production)

#### 3. Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

#### 4. Environment Variables Not Loading
- Ensure `.env` file is in root directory
- Restart development server after changes
- Check variable names start with `VITE_`

### Performance Optimization

#### 1. Reduce Bundle Size
```bash
# Analyze bundle
npm run build
npx vite-bundle-analyzer dist
```

#### 2. Enable Compression
Add to `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import { compression } from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    compression()
  ]
})
```

## 📊 Monitoring and Analytics

### Add Error Tracking

Install Sentry:
```bash
npm install @sentry/react
```

Configure in `main.jsx`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
});
```

### Add Analytics

Install Google Analytics:
```bash
npm install gtag
```

## 🔒 Security Best Practices

1. **Never commit `.env` files**
2. **Use environment variables for all secrets**
3. **Enable CORS properly in production**
4. **Implement rate limiting**
5. **Validate all user inputs**
6. **Use HTTPS in production**

## 📱 Mobile Optimization

### PWA Setup

Add to `vite.config.js`:
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
```

## 🆘 Getting Help

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/yourusername/lawbot360/issues)
2. Review the [Documentation](https://docs.lawbot360.com)
3. Contact support: support@lawbot360.com

## 🎯 Next Steps

After setup:

1. Test all AI features
2. Customize the legal prompts
3. Add your branding
4. Configure analytics
5. Set up monitoring
6. Deploy to production

---

**Happy coding!** 🚀