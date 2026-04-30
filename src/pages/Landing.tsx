import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic, Zap, Shield, Globe, Brain, Keyboard,
  ChevronRight, Star, Download, CheckCircle, ArrowRight
} from 'lucide-react'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#080810]/95 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎙️</span>
          <span className="text-xl font-bold text-white">TypeWiz</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm">Features</a>
          <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm">Pricing</a>
          <a href="#download" className="text-slate-400 hover:text-white transition-colors text-sm">Download</a>
        </div>
        <Link
          to="/register"
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}

function HeroMockup() {
  const [active, setActive] = useState(false)
  const [text, setText] = useState('')
  const fullText = 'Schedule a meeting with the team for Thursday afternoon...'

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(true)
      setText('')
      let i = 0
      const typeInterval = setInterval(() => {
        if (i < fullText.length) {
          setText(fullText.slice(0, i + 1))
          i++
        } else {
          clearInterval(typeInterval)
          setTimeout(() => {
            setActive(false)
            setText('')
          }, 2000)
        }
      }, 50)
    }, 5000)

    // Kick off immediately
    setTimeout(() => {
      setActive(true)
      let i = 0
      const typeInterval = setInterval(() => {
        if (i < fullText.length) {
          setText(fullText.slice(0, i + 1))
          i++
        } else {
          clearInterval(typeInterval)
          setTimeout(() => setActive(false), 2000)
        }
      }, 50)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative mx-auto max-w-lg">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-3xl" />

      {/* Mock app window */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-slate-500">Gmail — Compose</span>
        </div>

        {/* Email compose area */}
        <div className="p-6">
          <div className="mb-4">
            <div className="text-xs text-slate-500 mb-1">To</div>
            <div className="text-sm text-slate-300">team@company.com</div>
            <div className="border-b border-slate-700 mt-2" />
          </div>
          <div className="mb-4">
            <div className="text-xs text-slate-500 mb-1">Subject</div>
            <div className="text-sm text-slate-300">Team Sync</div>
            <div className="border-b border-slate-700 mt-2" />
          </div>
          <div className="min-h-[80px]">
            <p className="text-sm text-white leading-relaxed">
              {text}
              {active && <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle" />}
            </p>
          </div>
        </div>

        {/* TypeWiz overlay indicator */}
        {active && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-purple-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="relative">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-red-400 rounded-full animate-ping" />
            </div>
            <span className="text-xs font-medium text-white">TypeWiz listening...</span>
          </div>
        )}
      </div>

      {/* Hotkey badge */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full shadow-xl">
        <span className="text-xs text-slate-400">Hold</span>
        <kbd className="bg-slate-700 text-white text-xs px-2 py-0.5 rounded font-mono">Right Alt</kbd>
        <span className="text-xs text-slate-400">to dictate</span>
      </div>
    </div>
  )
}

const features = [
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Works everywhere',
    desc: 'Any app, any window. Gmail, Notion, Slack, VS Code — TypeWiz works wherever you type.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning fast',
    desc: 'Local AI model runs on your machine. No upload delay, no server round-trip. Just instant text.'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Privacy first',
    desc: 'Your audio never leaves your device on Pro. No recordings stored, no data sold. Ever.'
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Any language',
    desc: '50+ languages supported out of the box. Switch mid-sentence — TypeWiz keeps up.'
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'Always learning',
    desc: 'Adapts to your voice, vocabulary, and speech patterns over time. Gets smarter the more you use it.'
  },
  {
    icon: <Keyboard className="w-6 h-6" />,
    title: 'Keyboard-free',
    desc: "Draft emails, take notes, write code comments — all without touching your keyboard."
  }
]

const testimonials = [
  {
    quote: "I type around 60 WPM but speak at 130. TypeWiz basically doubled my writing speed overnight.",
    name: "James K.",
    role: "Product Manager, Sydney"
  },
  {
    quote: "Tried three other dictation tools. This is the only one that works in every app without weird quirks.",
    name: "Sarah M.",
    role: "Freelance Copywriter"
  },
  {
    quote: "The offline model is what sold me. My notes stay on my machine. No exceptions.",
    name: "David T.",
    role: "Software Engineer"
  }
]

const steps = [
  { num: '01', icon: <Keyboard className="w-7 h-7" />, title: 'Hold your hotkey', desc: 'Press and hold Right Alt (or your custom key). TypeWiz starts listening immediately.' },
  { num: '02', icon: <Mic className="w-7 h-7" />, title: 'Say anything', desc: 'Speak naturally. TypeWiz transcribes in real-time with local AI — no cloud, no delay.' },
  { num: '03', icon: <CheckCircle className="w-7 h-7" />, title: 'Text appears instantly', desc: 'Release the key. Your words appear at your cursor, exactly where you need them.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-violet-900/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-800/50 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-purple-300 font-medium">Local AI — no internet required</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Stop typing.{' '}
              <span className="gradient-text">Just speak.</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
              Hold a key, say what you want, watch it appear. TypeWiz turns your voice into text instantly — anywhere on your screen.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#download"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-7 py-3.5 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-900/40"
              >
                <Download className="w-4 h-4" />
                Download for Windows
              </a>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-white px-7 py-3.5 rounded-xl font-medium transition-colors"
              >
                Join waitlist
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-xs text-slate-500 mt-4">Free forever plan available · No credit card required</p>
          </div>

          <div className="float-animation">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400 text-lg">Three steps. That's it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative group">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-purple-800/60 transition-colors">
                  <div className="text-6xl font-black text-slate-800 mb-4 leading-none">{step.num}</div>
                  <div className="w-12 h-12 bg-purple-900/40 border border-purple-800/50 rounded-xl flex items-center justify-center text-purple-400 mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Built for professionals who move fast</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              TypeWiz isn't just voice-to-text. It's a rethink of how you interact with your computer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-800/50 transition-all hover:-translate-y-1 group"
              >
                <div className="w-11 h-11 bg-purple-900/40 border border-purple-800/40 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-900/60 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Simple pricing</h2>
            <p className="text-slate-400 text-lg">Start free. Go Pro when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-slate-400 mb-1">/month</span>
                </div>
                <p className="text-slate-400 text-sm">Perfect for trying it out</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '30 transcriptions per month',
                  'API-based (requires internet)',
                  'Works in any app',
                  'Standard transcription speed',
                  'Community support',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block text-center border border-slate-700 hover:border-slate-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-slate-900 border border-purple-700 rounded-2xl p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-black gradient-text">$12</span>
                  <span className="text-slate-400 mb-1">/month</span>
                </div>
                <p className="text-slate-400 text-sm">For power users and professionals</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited transcriptions',
                  'Local AI model (offline)',
                  'Fastest speed — no latency',
                  'Works without internet',
                  'Priority support',
                  'Early access to new features',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block text-center bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-900/50"
              >
                Start Pro — $12/mo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-slate-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-purple-900/40 to-violet-900/20 border border-purple-800/40 rounded-3xl p-12">
            <div className="text-5xl mb-6">🎙️</div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to stop typing?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Join thousands of professionals who've switched to voice-first workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/downloads/TypeWiz-Setup-1.0.0.exe"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-xl shadow-purple-900/50"
              >
                <Download className="w-5 h-5" />
                Download for Windows
              </a>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-white px-8 py-4 rounded-xl font-medium transition-colors"
              >
                Create free account
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-slate-500 text-xs mt-4">Windows 10/11 · 64-bit · v1.0.0</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎙️</span>
                <span className="text-xl font-bold">TypeWiz</span>
              </div>
              <p className="text-slate-400 text-sm mb-1">Type less. Do more.</p>
              <p className="text-slate-500 text-xs">Voice dictation for professionals. Works everywhere, offline, instantly.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-slate-300">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">Download</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-slate-300">Account</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2026 TypeWiz. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
