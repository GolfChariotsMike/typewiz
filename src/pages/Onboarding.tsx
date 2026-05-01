import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, CheckCircle, Keyboard, Mic, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const HOTKEYS = [
  { label: 'Right Alt', value: 'right_alt', description: 'Recommended — rarely conflicts with other apps' },
  { label: 'Ctrl+Space', value: 'ctrl_space', description: 'Great for developers' },
  { label: 'Custom', value: 'custom', description: 'Set your own in the app settings after install' },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? 'bg-gray-900 w-8' : i === current ? 'bg-gray-900 w-8' : 'bg-gray-200 w-4'
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
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">🎙️</span>
          <span className="text-xl font-bold text-gray-900">TypeWiz</span>
        </div>

        <StepIndicator current={step} total={4} />

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="w-24 h-24 bg-green-50 border border-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">You're in!</h1>
            <p className="text-gray-500 text-lg mb-8">Let's get TypeWiz set up. Takes about 2 minutes.</p>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Let's go <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 1: Download */}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 mb-6">
              <Download className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Download TypeWiz</h1>
            <p className="text-gray-500 text-lg mb-8">
              Download and run the Windows installer. It handles everything automatically.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-gray-900">TypeWiz for Windows</div>
                  <div className="text-gray-400 text-sm">v1.0.0 · Windows 10/11 · 64-bit</div>
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full border border-green-200 font-medium">Latest</span>
              </div>
              <a
                href="/downloads/TypeWiz-Setup-1.0.0.exe"
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 w-full"
              >
                <Download className="w-4 h-4" />
                Download TypeWiz-Setup-1.0.0.exe
              </a>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
              <strong>First install note:</strong> The app will download the local AI model (~150MB) on first launch. This is a one-time download — after that, everything works offline.
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-700 bg-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              I've installed it <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Hotkey */}
        {step === 2 && (
          <div>
            <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 mb-6">
              <Keyboard className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose your hotkey</h1>
            <p className="text-gray-500 text-lg mb-8">
              Hold this key to start recording, release to transcribe. Pick whatever feels natural.
            </p>

            <div className="space-y-3 mb-6">
              {HOTKEYS.map(hk => (
                <button
                  key={hk.value}
                  onClick={() => setSelectedHotkey(hk.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedHotkey === hk.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{hk.label}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{hk.description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedHotkey === hk.value ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                    }`}>
                      {selectedHotkey === hk.value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-gray-400 text-xs mb-6 text-center">
              You can always change this in the TypeWiz app under Settings → Hotkey.
            </p>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="w-24 h-24 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
                <Mic className="w-12 h-12 text-gray-700" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">You're all set!</h1>
            <p className="text-gray-500 text-lg mb-6">Here's how to use TypeWiz:</p>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left mb-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Open any app</div>
                  <div className="text-gray-500 text-sm">Gmail, Slack, Notion, Word — anywhere you type</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Hold <kbd className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded font-mono mx-1">
                      {HOTKEYS.find(h => h.value === selectedHotkey)?.label}
                    </kbd>
                  </div>
                  <div className="text-gray-500 text-sm">The TypeWiz mic indicator appears in the corner</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Speak naturally</div>
                  <div className="text-gray-500 text-sm">Say what you want to type — as fast or slow as you like</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Release to transcribe</div>
                  <div className="text-gray-500 text-sm">Text appears at your cursor in under a second</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="typewiz://"
                onClick={saveHotkeyAndFinish}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 text-lg"
              >
                🎙️ Open TypeWiz
              </a>
              <button
                onClick={saveHotkeyAndFinish}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
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
