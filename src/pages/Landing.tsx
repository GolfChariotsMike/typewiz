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
      scrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎙️</span>
          <span className="text-xl font-bold text-gray-900">TypeWiz</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Features</a>
          <a href="#pricing" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Pricing</a>
          <a href="#download" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Download</a>
        </div>
        <Link
          to="/register"
          className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
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
      {/* Subtle shadow glow */}
      <div className="absolute inset-0 bg-gray-200/60 blur-3xl rounded-3xl" />

      {/* Mock app window */}
      <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-gray-400">Gmail — Compose</span>
        </div>

        {/* Email compose area */}
        <div className="p-6">
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">To</div>
            <div className="text-sm text-gray-700">team@company.com</div>
            <div className="border-b border-gray-100 mt-2" />
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">Subject</div>
            <div className="text-sm text-gray-700">Team Sync</div>
            <div className="border-b border-gray-100 mt-2" />
          </div>
          <div className="min-h-[80px]">
            <p className="text-sm text-gray-800 leading-relaxed">
              {text}
              {active && <span className="inline-block w-0.5 h-4 bg-gray-800 ml-0.5 animate-pulse align-middle" />}
            </p>
          </div>
        </div>

        {/* TypeWiz overlay indicator */}
        {active && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="relative">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-red-400 rounded-full animate-ping" />
            </div>
            <span className="text-xs font-medium text-white">TypeWiz listening...</span>
          </div>
        )}
      </div>

      {/* Hotkey badge */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-xl">
        <span className="text-xs text-gray-500">Hold</span>
        <kbd className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-mono border border-gray-200">Ctrl</kbd>
        <span className="text-xs text-gray-500">+</span>
        <kbd className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-mono border border-gray-200">⊞ Win</kbd>
        <span className="text-xs text-gray-500">to dictate</span>
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
    title: 'The fastest dictation on the market',
    desc: 'Because the AI runs locally on your machine, there\'s zero upload delay and no server round-trip. Text appears in under a second — nothing else comes close.'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Your voice never leaves your device',
    desc: 'Audio is processed entirely on your machine. It\'s never uploaded, never stored, and never used to train AI models. Not ours. Not anyone\'s.'
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Any language',
    desc: '50+ languages supported out of the box. Switch mid-sentence — TypeWiz keeps up.'
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'Works offline',
    desc: 'No internet? No problem. The local model runs without a connection — on a plane, in a basement, anywhere.'
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
  { num: '01', icon: <Keyboard className="w-7 h-7" />, title: 'Hold your hotkey', desc: 'Hold Ctrl + Win (or your custom combo). TypeWiz starts listening immediately.' },
  { num: '02', icon: <Mic className="w-7 h-7" />, title: 'Say anything', desc: 'Speak naturally. TypeWiz transcribes using local AI — no cloud, no delay, nothing leaves your machine.' },
  { num: '03', icon: <CheckCircle className="w-7 h-7" />, title: 'Text appears instantly', desc: 'Release the key. Your words appear at your cursor, exactly where you need them.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-white">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white pointer-events-none" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Local AI — the fastest dictation available</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-gray-900">
              Stop typing.{' '}
              <span className="relative">
                <span className="relative z-10">Just speak.</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-yellow-200 -z-10 -skew-x-1" />
              </span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
              Hold Ctrl + Win, say what you want, watch it appear. TypeWiz turns your voice into text instantly — anywhere on your screen, with no internet required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#download"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-7 py-3.5 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-gray-200"
              >
                <Download className="w-4 h-4" />
                Download for Windows
              </a>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-700 px-7 py-3.5 rounded-xl font-medium transition-colors bg-white"
              >
                Join waitlist
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-xs text-gray-400 mt-4">Free forever plan available · No credit card required</p>
          </div>

          <div className="float-animation">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* Speed callout banner */}
      <section className="py-8 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-white text-sm font-medium">
            <span className="text-yellow-400">Lightning fast.</span>{' '}
            Because the AI runs on your machine — not a server — TypeWiz is the fastest dictation tool in existence. No upload. No wait. Just instant text.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">How it works</h2>
            <p className="text-gray-500 text-lg">Three steps. That's it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative group">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-400 hover:shadow-md transition-all">
                  <div className="text-6xl font-black text-gray-100 mb-4 leading-none">{step.num}</div>
                  <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Built for professionals who move fast</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              TypeWiz isn't just voice-to-text. It's a rethink of how you interact with your computer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-md transition-all hover:-translate-y-1 group"
              >
                <div className="w-11 h-11 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 mb-4 group-hover:bg-gray-200 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy callout */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Your data is yours. Full stop.</h3>
          <p className="text-gray-500 leading-relaxed">
            On Pro, all transcription happens on your device using a local AI model. Your audio is never uploaded, never stored on our servers, and <strong className="text-gray-900">never used to train any AI model</strong> — not ours, not anyone else's. What you say stays on your machine.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">Simple pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Go Pro when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 text-gray-900">Free</h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-black text-gray-900">$0</span>
                  <span className="text-gray-400 mb-1">/month</span>
                </div>
                <p className="text-gray-500 text-sm">Perfect for trying it out</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '30 transcriptions per month',
                  'API-based (requires internet)',
                  'Works in any app',
                  'Standard transcription speed',
                  'Community support',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block text-center border border-gray-200 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors bg-white"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gray-900 border border-gray-700 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 text-white">Pro</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">$19</span>
                  <span className="text-gray-400 mb-1">/month</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">Or <a href="https://buy.stripe.com/aFaaEW9aafVr1HH9DTgQE0a" className="text-gray-300 underline underline-offset-2 hover:text-white">$190/year</a> — 2 months free</p>
                <p className="text-gray-400 text-sm">For power users and professionals</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited transcriptions',
                  'Local AI model — runs on your machine',
                  'Fastest speed on the market — no latency',
                  'Works completely offline',
                  'Audio never leaves your device',
                  'Never used to train AI models',
                  'Priority support',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="https://buy.stripe.com/5kQ3cu8667oVeut3fvgQE09"
                className="block text-center bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
              >
                Start Pro — $19/mo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section id="download" className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white border border-gray-200 rounded-3xl p-12 shadow-sm">
            <div className="text-5xl mb-6">🎙️</div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
              Ready to stop typing?
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Join thousands of professionals who've switched to voice-first workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/downloads/TypeWiz-Setup-1.0.0.exe"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-gray-200"
              >
                <Download className="w-5 h-5" />
                Download for Windows
              </a>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-medium transition-colors bg-white"
              >
                Create free account
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-gray-400 text-xs mt-4">Windows 10/11 · 64-bit · v1.0.0</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎙️</span>
                <span className="text-xl font-bold text-gray-900">TypeWiz</span>
              </div>
              <p className="text-gray-500 text-sm mb-1">Type less. Do more.</p>
              <p className="text-gray-400 text-xs">Voice dictation for professionals. Works everywhere, offline, instantly.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-700">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#download" className="hover:text-gray-900 transition-colors">Download</a></li>
                <li><Link to="/register" className="hover:text-gray-900 transition-colors">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-700">Account</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/login" className="hover:text-gray-900 transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-gray-900 transition-colors">Register</Link></li>
                <li><Link to="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2026 TypeWiz. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
