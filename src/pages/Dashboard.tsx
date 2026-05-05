import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Download, Settings, Zap, LogOut,
  Mic, Menu, X, CheckCircle, BookOpen
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { UserProfile } from '../types'

const HOTKEYS = [
  { label: 'Right Alt', value: 'right_alt' },
  { label: 'Ctrl+Space', value: 'ctrl_space' },
  { label: 'Custom (set in app)', value: 'custom' },
]

function Sidebar({ active, onSignOut, mobile, onClose }: {
  active: string
  onSignOut: () => void
  mobile?: boolean
  onClose?: () => void
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, href: '/dashboard' },
    { id: 'howto', label: 'How to use', icon: <BookOpen className="w-4 h-4" />, href: '/dashboard?tab=howto' },
    { id: 'download', label: 'Download', icon: <Download className="w-4 h-4" />, href: '/dashboard?tab=download' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, href: '/dashboard?tab=settings' },
    { id: 'upgrade', label: 'Upgrade to Pro', icon: <Zap className="w-4 h-4" />, href: '/dashboard?tab=upgrade' },
  ]

  return (
    <div className={`${mobile ? 'flex' : 'hidden md:flex'} flex-col bg-white border-r border-gray-200 w-56 min-h-screen p-4`}>
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <span className="font-bold text-gray-900">TypeWiz</span>
        </Link>
        {mobile && onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.id}
            to={item.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active === item.id
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={onSignOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const tab = params.get('tab') || 'dashboard'

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [hotkey, setHotkey] = useState('right_alt')

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('tw_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data as UserProfile)
        setDisplayName(data.display_name || user.email || '')
        setHotkey(data.hotkey || 'right_alt')
      } else {
        const newProfile = {
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name || '',
          plan: 'free' as const,
          hotkey: 'right_alt',
          transcriptions_this_month: 0,
        }
        await supabase.from('tw_profiles').upsert(newProfile)
        setProfile({ ...newProfile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        setDisplayName(newProfile.display_name || newProfile.email)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await supabase.from('tw_profiles').update({
      display_name: displayName,
      hotkey,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const usedTranscriptions = profile?.transcriptions_this_month ?? 0
  const maxTranscriptions = profile?.plan === 'pro' ? null : 30
  const usagePct = maxTranscriptions ? Math.min((usedTranscriptions / maxTranscriptions) * 100, 100) : 100

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <Sidebar active={tab} onSignOut={handleSignOut} />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <Sidebar active={tab} onSignOut={handleSignOut} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar (mobile) */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900">TypeWiz</span>
        </div>

        <div className="p-6 lg:p-8 max-w-4xl">

          {/* Dashboard tab */}
          {tab === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
              <p className="text-gray-500 mb-8">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}.</p>

              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {/* Usage */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                      <Mic className="w-4 h-4" />
                    </div>
                    <h2 className="font-semibold text-gray-900">Usage this month</h2>
                  </div>
                  {profile?.plan === 'pro' ? (
                    <div>
                      <div className="text-3xl font-black text-gray-900 mb-1">{usedTranscriptions}</div>
                      <div className="text-gray-400 text-sm">Unlimited · Pro plan</div>
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900 rounded-full w-full" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-black text-gray-900 mb-1">
                        {usedTranscriptions} <span className="text-lg text-gray-400 font-normal">/ 30</span>
                      </div>
                      <div className="text-gray-400 text-sm">Free plan · resets monthly</div>
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-yellow-500' : 'bg-gray-900'}`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                      {usedTranscriptions >= 25 && (
                        <p className="text-yellow-600 text-xs mt-2">⚠️ Running low — upgrade to Pro for unlimited</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Plan */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h2 className="font-semibold text-gray-900">Your plan</h2>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-black text-gray-900">
                      {profile?.plan === 'pro' ? 'Pro' : 'Free'}
                    </span>
                    {profile?.plan === 'pro' && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200 font-medium">Active</span>
                    )}
                  </div>
                  {profile?.plan !== 'pro' ? (
                    <>
                      <p className="text-gray-500 text-sm mb-4">Upgrade for unlimited transcriptions, offline AI, and the fastest speed available.</p>
                      <Link
                        to="/dashboard?tab=upgrade"
                        className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      >
                        Upgrade to Pro — $19/mo
                      </Link>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">You're on Pro. Unlimited, offline, fastest speed available.</p>
                  )}
                </div>
              </div>

              {/* Quick start card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Quick start</h2>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <div className="font-medium text-gray-900">Open any app</div>
                      <div className="text-gray-400 text-xs mt-0.5">Gmail, Slack, Word, anywhere</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <div className="font-medium text-gray-900">Hold Right Alt</div>
                      <div className="text-gray-400 text-xs mt-0.5">Mic indicator appears — speak</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <div className="font-medium text-gray-900">Release to transcribe</div>
                      <div className="text-gray-400 text-xs mt-0.5">Text appears in under a second</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link to="/dashboard?tab=howto" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    Full guide & tips →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* How to use tab */}
          {tab === 'howto' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">How to use TypeWiz</h1>
              <p className="text-gray-500 mb-8">Everything you need to get the most out of it.</p>

              <div className="space-y-6">

                {/* Basic usage */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4">Basic usage</h2>
                  <div className="space-y-4">
                    {[
                      { step: '1', title: 'Click into any text field', desc: 'In any app — browser, email client, Word doc, Slack, anything. TypeWiz injects text wherever your cursor is.' },
                      { step: '2', title: 'Hold your hotkey (Right Alt by default)', desc: 'Hold it down. The TypeWiz indicator will appear in the corner of your screen showing it\'s recording.' },
                      { step: '3', title: 'Speak naturally', desc: 'Talk at a normal pace. No need to pause between words or speak slowly. TypeWiz handles it.' },
                      { step: '4', title: 'Release to transcribe', desc: 'Let go of the key. The AI processes your audio locally and types the text at your cursor in under a second.' },
                    ].map(item => (
                      <div key={item.step} className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">{item.step}</div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                          <div className="text-gray-500 text-sm mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4">Tips for best results</h2>
                  <ul className="space-y-3">
                    {[
                      { tip: 'Speak in full sentences', detail: 'Whisper transcribes context — it\'s more accurate when you say complete thoughts rather than individual words.' },
                      { tip: 'Dictate punctuation', detail: 'Say "comma", "full stop", "question mark", "new line" and they\'ll be inserted automatically.' },
                      { tip: 'Keep the mic close', detail: 'A headset or desk mic gives noticeably better accuracy than a built-in laptop mic, especially in noisy environments.' },
                      { tip: 'First run is slower', detail: 'TypeWiz downloads the AI model (~150MB) on first launch. After that it\'s cached locally and loads in 2-3 seconds.' },
                      { tip: 'Change the hotkey if needed', detail: 'Open TypeWiz from the system tray → Settings → Hotkey. Right Alt is the default but any key combination works.' },
                    ].map(item => (
                      <li key={item.tip} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">{item.tip} — </span>
                          <span className="text-gray-500 text-sm">{item.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Troubleshooting */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4">Troubleshooting</h2>
                  <div className="space-y-4">
                    {[
                      { q: 'Text isn\'t appearing', a: 'Make sure the target window has focus before releasing the hotkey. Some apps (admin dialogs, games) block text injection.' },
                      { q: 'Hotkey isn\'t working', a: 'Another app may be capturing the same key. Open TypeWiz Settings and change to a different hotkey.' },
                      { q: 'Transcription is inaccurate', a: 'Try a better microphone, reduce background noise, or switch to the "small" model in Settings for higher accuracy (slower but better).' },
                      { q: 'App won\'t start', a: 'Make sure Python 3.10+ is installed and added to PATH. Re-run install.bat to repair the setup.' },
                      { q: 'Model download fails', a: 'Check your internet connection and ensure you have ~500MB free disk space. Models are saved to %USERPROFILE%\\.typewiz\\models\\.' },
                    ].map(item => (
                      <div key={item.q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="font-semibold text-gray-900 text-sm mb-1">{item.q}</div>
                        <div className="text-gray-500 text-sm">{item.a}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Free vs Pro */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <h2 className="font-bold text-gray-900 text-lg mb-4">Free vs Pro</h2>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-gray-700 mb-2">Free</div>
                      <ul className="space-y-1.5 text-gray-500">
                        <li>30 transcriptions/month</li>
                        <li>Uses OpenAI Whisper API (internet required)</li>
                        <li>Slightly slower (network round-trip)</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">Pro — $12/mo</div>
                      <ul className="space-y-1.5 text-gray-700">
                        <li>Unlimited transcriptions</li>
                        <li>Local AI model — fully offline</li>
                        <li className="font-medium">Fastest dictation available — no upload, no wait</li>
                        <li>Audio never leaves your machine</li>
                        <li>Never used to train AI models</li>
                      </ul>
                    </div>
                  </div>
                  {profile?.plan !== 'pro' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link
                        to="/dashboard?tab=upgrade"
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      >
                        Upgrade to Pro
                      </Link>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Download tab */}
          {tab === 'download' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Download</h1>
              <p className="text-gray-500 mb-8">Get the TypeWiz app for Windows.</p>

              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-bold text-gray-900 text-xl mb-1">TypeWiz for Windows</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm">Version 1.0.0</span>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200 font-medium">Latest</span>
                    </div>
                  </div>
                  <div className="text-4xl">🖥️</div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-6 text-sm">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="text-gray-400 text-xs mb-1">Platform</div>
                    <div className="text-gray-900 font-medium">Windows 10/11</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="text-gray-400 text-xs mb-1">Architecture</div>
                    <div className="text-gray-900 font-medium">64-bit</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <div className="text-gray-400 text-xs mb-1">Installer size</div>
                    <div className="text-gray-900 font-medium">~85 MB</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
                  <strong>Before installing:</strong> Make sure Python 3.10+ is installed on your PC with "Add to PATH" ticked. <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer" className="underline">Download Python here →</a>
                </div>

                <a
                  href="/downloads/TypeWiz-Setup-1.0.0.exe"
                  className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 text-lg w-full"
                >
                  <Download className="w-5 h-5" />
                  Download TypeWiz-Setup-1.0.0.exe
                </a>
                <p className="text-center text-gray-400 text-xs mt-3">
                  Android version coming soon.
                </p>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">After downloading</h3>
                  <ol className="space-y-2 text-sm text-gray-500 list-decimal list-inside">
                    <li>Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-700">TypeWiz-Setup-1.0.0.exe</code> and follow the installer</li>
                    <li>On first launch, TypeWiz downloads the AI model (~150MB) — one-time only</li>
                    <li>TypeWiz appears in your system tray (bottom-right taskbar)</li>
                    <li>Hold Right Alt anywhere to start dictating</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Settings tab */}
          {tab === 'settings' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
              <p className="text-gray-500 mb-8">Manage your account and preferences.</p>

              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <form onSubmit={saveSettings} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-gray-400 transition-colors max-w-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-400 text-sm max-w-sm cursor-not-allowed"
                    />
                    <p className="text-gray-400 text-xs mt-1">Email cannot be changed here</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred hotkey</label>
                    <div className="space-y-2 max-w-sm">
                      {HOTKEYS.map(hk => (
                        <button
                          key={hk.value}
                          type="button"
                          onClick={() => setHotkey(hk.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                            hotkey === hk.value
                              ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {hk.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-2">This is a reminder — set the actual hotkey in the TypeWiz app (system tray → Settings).</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    {saved && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Saved
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Upgrade tab */}
          {tab === 'upgrade' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Upgrade to Pro</h1>
              <p className="text-gray-500 mb-8">Unlock the full TypeWiz experience.</p>

              {profile?.plan === 'pro' ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">You're already on Pro</h2>
                  <p className="text-gray-500">Unlimited transcriptions, offline AI, fastest speed. You're all set.</p>
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 relative">
                    <div className="mb-6">
                      <div className="text-2xl font-black text-white mb-1">Pro Plan</div>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-white">$12</span>
                        <span className="text-gray-400 mb-1">/month</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">Cancel anytime</p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {[
                        'Unlimited transcriptions',
                        'Local AI model — runs on your machine',
                        'Fastest dictation available — no upload delay',
                        'Works completely offline',
                        'Audio never leaves your device',
                        'Never used to train AI models',
                        '50+ languages',
                        'Priority support',
                      ].map(item => (
                        <li key={item} className="flex items-center gap-3 text-sm text-white">
                          <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <button
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3.5 rounded-xl font-semibold transition-all hover:scale-105"
                      onClick={() => alert('Stripe checkout coming soon!')}
                    >
                      Upgrade to Pro — $19/mo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
