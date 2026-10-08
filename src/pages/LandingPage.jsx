import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Scale,
  MessageSquare,
  FileText,
  Users,
  Mic,
  Shield,
  ChevronRight,
  Check,
  Sparkles,
  Zap,
  Globe,
  ArrowRight,
  Menu,
  X,
  Star,
  Award,
  TrendingUp,
  Clock,
  Download,
  UserCheck,
  ChevronDown,
  Play,
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Twitter,
  Instagram,
} from "lucide-react";

// Ideally, import your logo here
import logo from "../assets/lawbot360-logo-updated.svg";

/* --- UTILITY HOOKS --- */
const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  useEffect(() => {
    const updatePosition = () => setScrollPosition(window.pageYOffset);
    window.addEventListener("scroll", updatePosition);
    return () => window.removeEventListener("scroll", updatePosition);
  }, []);
  return scrollPosition;
};

const useInView = (options = {}) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.1, ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);
  return [ref, isInView];
};

/* --- UI COMPONENTS --- */

// Smooth Reveal Wrapper
const Reveal = ({ children, delay = 0, className = "" }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const SectionHeading = ({ title, subtitle, center = true }) => (
  <div className={`mb-16 ${center ? "text-center" : "text-left"}`}>
    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
      {title}
    </h2>
    {subtitle && (
      <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-6 opacity-80" />
    )}
    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
      {subtitle}
    </p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, highlight, delay }) => {
  return (
    <Reveal delay={delay}>
      <div className="group relative h-full bg-white/60 backdrop-blur-md border border-white/40 p-8 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />
        <div className="relative z-10">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
              highlight
                ? "bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 text-white"
                : "bg-white shadow-md text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
            }`}
          >
            <Icon className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
            {title}
          </h3>
          <p className="text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </Reveal>
  );
};

const AnimatedStat = ({ number, label, delay }) => (
  <Reveal delay={delay}>
    <div className="text-center group cursor-default">
      <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-500 ease-out">
        {number}
      </div>
      <div className="text-slate-600 font-medium tracking-wide uppercase text-sm">
        {label}
      </div>
    </div>
  </Reveal>
);

const HowItWorksStep = ({ number, title, description, icon: Icon, delay }) => (
  <Reveal delay={delay} className="flex-1">
    <div className="relative flex flex-col items-center text-center group">
      {/* Connector Line (Desktop) */}
      {number !== 3 && (
        <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent -z-10" />
      )}
      
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-white border border-blue-100 shadow-xl flex items-center justify-center z-10 relative group-hover:rotate-6 transition-transform duration-500">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
          {number}
        </div>
        <div className="absolute inset-0 bg-blue-100 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed max-w-xs">{description}</p>
    </div>
  </Reveal>
);

const FAQItem = ({ question, answer, delay }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ref, isInView] = useInView();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className={`text-lg font-bold pr-8 transition-colors ${isOpen ? "text-blue-600" : "text-slate-900"}`}>
          {question}
        </span>
        <div className={`p-2 rounded-full transition-colors ${isOpen ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400 group-hover:text-blue-600"}`}>
            <ChevronDown
            className={`w-5 h-5 transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
            }`}
            />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-50 mt-2">
            {answer}
        </div>
      </div>
    </div>
  );
};

/* --- MAIN PAGE COMPONENT --- */

export default function LandingPage() {
  const scrollY = useScrollPosition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: MessageSquare,
      title: "AI Legal Chat",
      description: "Context-aware AI that asks intelligent follow-up questions to understand your situation.",
      highlight: true,
      delay: 0,
    },
    {
      icon: FileText,
      title: "Instant Drafting",
      description: "Generate RTIs, FIRs, complaints, and affidavits in seconds with one click.",
      highlight: false,
      delay: 100,
    },
    {
      icon: Scale,
      title: "Legal Intelligence",
      description: "Real-time identification of applicable IPC/BNS sections relevant to your case.",
      highlight: false,
      delay: 200,
    },
    {
      icon: Users,
      title: "Expert Network",
      description: "Seamlessly connect with verified lawyers when you need human representation.",
      highlight: false,
      delay: 300,
    },
    {
      icon: Mic,
      title: "Voice Interface",
      description: "Speak naturally in Hindi or English. Our AI breaks language barriers.",
      highlight: false,
      delay: 400,
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your data is encrypted end-to-end. Your privacy is our absolute priority.",
      highlight: false,
      delay: 500,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-pink-400/20 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 20
            ? "bg-white/90 backdrop-blur-lg shadow-lg py-3 border-b border-slate-100"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <img
                    src={logo}
                    alt="LawBot 360"
                    className="w-10 h-10 relative z-10 transition-transform duration-500 group-hover:rotate-12"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                LawBot<span className="text-blue-600">360</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "How It Works", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  {item}
                </a>
              ))}
              <Link to="/dashboard">
                <button className="group relative px-6 py-2.5 bg-slate-900 text-white rounded-full font-semibold overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    Open Dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-4 py-4 bg-white border-b border-slate-100 shadow-xl">
                <div className="flex flex-col space-y-4">
                    <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium">Features</a>
                    <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium">How It Works</a>
                    <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 font-medium">FAQ</a>
                    <Link to="/dashboard">
                        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Open Dashboard</button>
                    </Link>
                </div>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            
            {/* Badges */}
            <Reveal delay={0}>
              <div className="flex justify-center gap-3 mb-8 flex-wrap">
                {[
                    { icon: Sparkles, text: "AI-Powered", color: "text-blue-600 bg-blue-50 border-blue-100" },
                    { icon: Zap, text: "Instant Results", color: "text-purple-600 bg-purple-50 border-purple-100" },
                    { icon: Globe, text: "Pan-India", color: "text-pink-600 bg-pink-50 border-pink-100" }
                ].map((badge, idx) => (
                    <div key={idx} className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${badge.color} text-sm font-semibold shadow-sm`}>
                        <badge.icon className="w-3.5 h-3.5" />
                        {badge.text}
                    </div>
                ))}
              </div>
            </Reveal>

            {/* Main Headline */}
            <Reveal delay={100}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                Your Personal <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Legal Assistant
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
                Democratizing justice for every Indian. Get instant advice, draft documents, and understand your rights in your language.
              </p>
            </Reveal>

            {/* CTA Buttons */}
            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/dashboard">
                  <button className="group relative px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40 w-full sm:w-auto">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                    <span className="flex items-center justify-center gap-2">
                      Launch Legal Dashboard
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>

                <Link to="/dashboard">
                  <button className="group px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold text-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-xl w-full sm:w-auto flex items-center justify-center gap-2">
                    <Play className="w-5 h-5 fill-current text-blue-600" />
                    Live Interactive Demo
                  </button>
                </Link>
              </div>
            </Reveal>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 pt-12 border-t border-slate-200/60">
                {[
                  { number: "24/7", label: "Availability", delay: 400 },
                  { number: "10+", label: "Regional Languages", delay: 500 },
                  { number: "50k+", label: "Documents Generated", delay: 600 },
                  { number: "Free", label: "Basic Access", delay: 700 },
                ].map((stat, idx) => (
                    <AnimatedStat key={idx} {...stat} />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement (Card Style) */}
      <section className="relative py-20 z-10 px-4">
        <Reveal>
            <div className="max-w-6xl mx-auto bg-slate-900 rounded-[2.5rem] p-8 md:p-16 text-white overflow-hidden relative shadow-2xl">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-6 font-medium">
                            <Scale className="w-4 h-4" />
                            The Justice Gap
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            Why is legal help so <span className="text-blue-400">complicated?</span>
                        </h2>
                        <div className="space-y-6 text-slate-300 text-lg">
                            <p>Millions of Indians lack affordable access to legal advice. Court systems are opaque, and paperwork is confusing.</p>
                            <p>Language barriers and high consultant fees prevent citizens from exercising their fundamental rights.</p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                        <ul className="space-y-4">
                            {[
                                "High Consultation Fees",
                                "Language Barriers",
                                "Complex Documentation",
                                "Lack of Transparency"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                                        <X className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </Reveal>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
                <SectionHeading 
                    title="Powerful Features" 
                    subtitle="Empowering every citizen with lawyer-like intelligence, simplified for everyone."
                />
            </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24 z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
                <SectionHeading 
                    title="How It Works" 
                    subtitle="From problem to solution in three simple steps."
                />
            </Reveal>

          <div className="grid md:grid-cols-3 gap-12 mt-16">
            <HowItWorksStep
              number={1}
              icon={MessageSquare}
              title="Describe Your Issue"
              description="Tell us about your legal problem in plain language. Our AI understands you."
              delay={0}
            />
            <HowItWorksStep
              number={2}
              icon={Scale}
              title="Get Expert Guidance"
              description="AI analyzes your case, identifies relevant laws, and advises the next best step."
              delay={200}
            />
            <HowItWorksStep
              number={3}
              icon={FileText}
              title="Generate Documents"
              description="Instantly create legally sound documents like RTIs or affidavits to submit."
              delay={400}
            />
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section id="faq" className="relative py-24 z-10 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
                <SectionHeading title="Frequently Asked Questions" subtitle="Everything you need to know about the platform." />
            </Reveal>

          <div className="space-y-4">
            {[
                 {
                    question: "Is LawBot 360 really free?",
                    answer: "Yes! Basic AI legal advice, document generation, and case guidance are completely free. We act as a social innovation tool to help the public.",
                    delay: 0,
                  },
                  {
                    question: "Can LawBot replace a real lawyer?",
                    answer: "LawBot provides guidance and drafting. For complex court representation, we recommend connecting with a verified lawyer through our 'Expert Network'.",
                    delay: 100,
                  },
                  {
                    question: "Is my data secure?",
                    answer: "Absolutely. We use Firebase authentication and end-to-end encryption. Your legal conversations are private and never shared with third parties.",
                    delay: 200,
                  },
            ].map((faq, idx) => (
              <FAQItem key={idx} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
                <div className="relative bg-gradient-to-br from-blue-700 via-purple-700 to-slate-900 rounded-[2.5rem] p-12 md:p-24 shadow-2xl overflow-hidden text-center">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-white/5 mix-blend-overlay"></div>
                    <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-blue-500/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-50%] right-[-20%] w-[800px] h-[800px] bg-purple-500/30 rounded-full blur-[120px]" />

                    <div className="relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                        Ready to Access Justice?
                    </h2>
                    <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto font-light">
                        Join thousands of Indians using LawBot 360. Your personal legal assistant is just a click away.
                    </p>
                    <Link to="/home">
                        <button className="group px-10 py-5 bg-white text-blue-900 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:-translate-y-1">
                            <span className="flex items-center gap-3">
                            Launch LawBot 360
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </Link>
                    </div>
                </div>
            </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 text-white pt-24 pb-12 z-10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="LawBot 360" className="w-8 h-8 opacity-90" />
                <span className="text-2xl font-bold tracking-tight">LawBot 360</span>
              </div>
              <p className="text-slate-400 mb-8 leading-relaxed max-w-sm">
                Empowering every citizen with accessible legal assistance through AI. Making justice affordable and available for all Indians.
              </p>
              <div className="flex gap-4">
                {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-900 hover:bg-blue-600 flex items-center justify-center transition-all duration-300 hover:-translate-y-1">
                        <Icon className="w-5 h-5" />
                    </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-slate-200">Product</h3>
              <ul className="space-y-4">
                {["Features", "How It Works", "Pricing", "FAQ"].map((item) => (
                    <li key={item}><a href="#" className="text-slate-400 hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-slate-200">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span>support@lawbot360.in</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <span>+91 1800-LAW-HELP</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span>Mumbai, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2025 LawBot 360 - Built for Social Innovation.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes shine {
            100% { transform: translateX(100%); }
        }
        .animate-shine {
            animation: shine 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
