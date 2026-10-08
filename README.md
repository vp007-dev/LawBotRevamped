# LawBot360 - AI-Powered Legal Assistant

LawBot360 is a comprehensive AI-powered legal assistance platform designed specifically for Indian law. It provides citizens with instant access to legal guidance, document generation, and professional legal consultation through advanced AI technology.

Theme - Web / App (Any idea with a Web / App interface)

** Deployed Live Link -- https://lawbot360.web.app/

## 🚀 Features

### AI-Powered Legal Assistant
- **Advanced AI Chat**: Powered by OpenRouter API with Claude 3.5 Sonnet for professional legal guidance
- **Voice Assistant**: Hands-free legal consultation using Web Speech API
- **Document Generation**: Automated creation of legal documents (RTI applications, consumer complaints, FIR, etc.)
- **Multi-language Support**: English and Hindi language support
- **Legal Knowledge Base**: Comprehensive understanding of Indian laws and regulations

### Core Legal Services
- **Consumer Protection**: Help with consumer complaints and rights
- **Right to Information (RTI)**: Automated RTI application generation
- **Property Law**: Tenant rights, property disputes, rental agreements
- **Criminal Law**: FIR filing guidance, bail procedures
- **Family Law**: Divorce, maintenance, custody guidance
- **Employment Law**: Salary disputes, wrongful termination

### Professional Features
- **Real-time Chat Interface**: Modern, responsive chat UI with typing indicators
- **Voice Recognition**: Speech-to-text for hands-free interaction
- **Text-to-Speech**: AI responses can be read aloud
- **Document Templates**: Pre-built legal document templates
- **Case Management**: Track your legal matters and documents
- **Lawyer Network**: Connect with verified legal professionals

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **AI Integration**: OpenRouter API (Claude 3.5 Sonnet)
- **Voice Features**: Web Speech API
- **Backend**: Firebase (Authentication, Database, Storage)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom animations

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenRouter API key
- Firebase project (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/lawbot360.git
cd lawbot360
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Get OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Generate an API key
4. Add it to your `.env` file

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
lawbot360/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AIChat.jsx      # Main AI chat interface
│   │   └── VoiceAgent.jsx  # Voice assistant component
│   ├── services/           # API and service integrations
│   │   └── aiService.js    # OpenRouter AI service
│   ├── pages/              # Main application pages
│   │   ├── LandingPage.jsx # Marketing landing page
│   │   ├── HomePage.jsx    # Main chat application
│   │   └── Dashboard.jsx   # User dashboard
│   ├── lib/                # Utility libraries
│   │   └── firebase.js     # Firebase configuration
│   ├── assets/             # Static assets
│   ├── App.jsx             # Main app component
│   └── main.jsx           # Application entry point
├── public/                 # Public assets
├── .env.example           # Environment variables template
└── package.json           # Dependencies and scripts
```

## 🤖 AI Integration

### OpenRouter Configuration
The AI service uses OpenRouter API with Claude 3.5 Sonnet model for:
- Legal query processing
- Document generation
- Contextual conversations
- Multi-language support

### Professional Legal Prompt
The AI is configured with a comprehensive legal system prompt that includes:
- Indian law expertise
- Professional guidelines
- Response structure
- Legal limitations and disclaimers

## 🎙️ Voice Features

### Speech Recognition
- Real-time voice input using Web Speech API
- Support for English and Hindi
- Noise cancellation and error handling

### Text-to-Speech
- Natural voice responses
- Adjustable speech rate and pitch
- Multiple voice options

## 📱 Responsive Design

- Mobile-first responsive design
- Touch-friendly interface
- Progressive Web App (PWA) ready
- Cross-browser compatibility

## 🔒 Security & Privacy

- End-to-end encryption for sensitive data
- No storage of personal information without consent
- Secure API key management
- GDPR compliant data handling

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint
```

## 📈 Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- Bundle size optimization
- Caching strategies
- CDN integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@lawbot360.com
- Documentation: [docs.lawbot360.com](https://docs.lawbot360.com)
- Issues: [GitHub Issues](https://github.com/yourusername/lawbot360/issues)

## 🙏 Acknowledgments

- OpenRouter for AI API services
- Firebase for backend infrastructure
- Tailwind CSS for styling framework
- Lucide React for beautiful icons
- React community for excellent tools and libraries

## 🔮 Roadmap

- [ ] Advanced document templates
- [ ] Lawyer booking system
- [ ] Case tracking dashboard
- [ ] Mobile app development
- [ ] Regional language support
- [ ] Legal precedent search
- [ ] Court filing integration
- [ ] Payment gateway integration

---

**LawBot360** - Empowering citizens with AI-powered legal assistance for a more accessible justice system.
