import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, CheckCircle, Keyboard, Mic, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const HOTKEYS = [
  { label: 'Right Alt', value: 'right_alt', description: 'Recommended — rarely used for anything else' },
  { label: 'Ctrl+Space', value: 'ctrl_space', description: 'Great for developers' },
  { label: 'Custom', value: 'custom', description: 'Set your own in the app settings' },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? 'bg-purple-500 w-8' : i === current ? 'bg-purple-600 w-8' : 'bg-slate-700 w-4'
          }`}
        />
      ))}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [selectedHotkey, setSelectedHotkey] = useState('right_alt')

  const saveHotkeyAndFinish = async () => {
    if (user) {
      await supabase.from('tw_profiles').upsert({
        id: user.id,
        email: user.email,
        hotkey: selectedHotkey,
        plan: 'free',
        transcriptions_this_month: 0,
      })
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">🎙️</span>
          <span className="text-xl font-bold text-white">TypeWiz</span>
        </div>

        <StepIndicator current={step} total={4} />

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="w-24 h-24 bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-400" style={{ strokeDasharray: 100, animation: 'checkmark 0.8s ease forwards' }} />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">You're in!</h1>
            <p className="text-slate-400 text-lg mb-8">Let's get TypeWiz set up. Takes about 2 minutes.</p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Let's go <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Download */}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 bg-purple-900/40 border border-purple-800/50 rounded-xl flex items-center justify-center text-purple-400 mb-6">
              <Download className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Download TypeWiz</h1>
            <p className="text-slate-400 text-lg mb-8">
              Download the Windows app to get started. It's small and installs in seconds.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-white">TypeWiz for Windows</div>
                  <div className="text-slate-500 text-sm">v1.0.0 · Windows 10/11 · 64-bit · ~85 MB</div>
                </div>
                <span className="bg-green-900/40 text-green-400 text-xs px-3 py-1 rounded-full border border-green-800/50">Latest</span>
              </div>
              <a
                href="/downloads/TypeWiz-Setup-1.0.0.exe"
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 w-full"
              >
                <Download className="w-4 h-4" />
                Download TypeWiz-Setup-1.0.0.exe
              </a>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              I've installed it <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Hotkey */}
        {step === 2 && (
          <div>
            <div className="w-12 h-12 bg-purple-900/40 border border-purple-800/50 rounded-xl flex items-center justify-center text-purple-400 mb-6">
              <Keyboard className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Set your hotkey</h1>
            <p className="text-slate-400 text-lg mb-8">
              Choose which key activates TypeWiz. Hold it to speak, release to insert.
            </p>

            {/* Keyboard visual */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex gap-1">
                  {['Q','W','E','R','T'].map(k => (
                    <div key={k} className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center text-xs text-slate-400 font-mono">{k}</div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-16 h-8 bg-slate-700 rounded-md flex items-center justify-center text-xs text-slate-400 font-mono">Ctrl</div>
                <div className="w-12 h-8 bg-slate-700 rounded-md flex items-center justify-center text-xs text-slate-400 font-mono">Alt</div>
                <div className="w-32 h-8 bg-slate-700 rounded-md flex items-center justify-center text-xs text-slate-400">Space</div>
                <div className={`w-16 h-8 rounded-md flex items-center justify-center text-xs font-mono transition-all ${
                  selectedHotkey === 'right_alt'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  Alt Gr
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {HOTKEYS.map(hk => (
                <button
                  key={hk.value}
                  onClick={() => setSelectedHotkey(hk.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedHotkey === hk.value
                      ? 'border-purple-600 bg-purple-900/20'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-sm">{hk.label}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{hk.description}</div>
                    </div>
                    {selectedHotkey === hk.value && (
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-slate-500 text-xs mb-6 text-center">
              You can always change this in TypeWiz Settings → Hotkey after installing.
            </p>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="w-24 h-24 bg-purple-900/30 rounded-full flex items-center justify-center">
                <Mic className="w-12 h-12 text-purple-400" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">You're ready!</h1>
            <p className="text-slate-400 text-lg mb-2">Start typing with your voice.</p>
            <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-full mb-8">
              <span className="text-slate-400 text-sm">Hold</span>
              <kbd className="bg-slate-700 text-white text-sm px-2.5 py-1 rounded font-mono font-semibold">
                {HOTKEYS.find(h => h.value === selectedHotkey)?.label}
              </kbd>
              <span className="text-slate-400 text-sm">→ speak → release</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left mb-8">
              <h3 className="font-semibold text-white mb-3 text-sm">Quick tips</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="text-purple-400">→</span> Works in any app — Gmail, Slack, Notion, Word</li>
                <li className="flex items-start gap-2"><span className="text-purple-400">→</span> Speak naturally — punctuation is automatic on Pro</li>
                <li className="flex items-start gap-2"><span className="text-purple-400">→</span> First run downloads the local AI model (~1GB)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="typewiz://"
                onClick={saveHotkeyAndFinish}
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 text-lg"
              >
                🎙️ Open TypeWiz
              </a>
              <button
                onClick={saveHotkeyAndFinish}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Go to dashboard instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
