import { useState, useEffect, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Download, Settings, Zap, LogOut,
  Mic, Menu, X, CheckCircle
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
    { id: 'download', label: 'Download', icon: <Download className="w-4 h-4" />, href: '/dashboard?tab=download' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, href: '/dashboard?tab=settings' },
    { id: 'upgrade', label: 'Upgrade', icon: <Zap className="w-4 h-4" />, href: '/dashboard?tab=upgrade' },
  ]

  return (
    <div className={`${mobile ? 'flex' : 'hidden md:flex'} flex-col bg-slate-900 border-r border-slate-800 w-56 min-h-screen p-4`}>
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <span className="font-bold text-white">TypeWiz</span>
        </Link>
        {mobile && onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
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
                ? 'bg-purple-600/20 text-purple-300 border border-purple-800/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={onSignOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
        // Bootstrap profile
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
    <div className="min-h-screen bg-[#080810] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080810] flex">
      {/* Desktop sidebar */}
      <Sidebar active={tab} onSignOut={handleSignOut} />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <Sidebar active={tab} onSignOut={handleSignOut} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-white">TypeWiz</span>
        </div>

        <div className="p-6 lg:p-8 max-w-4xl">

          {/* Dashboard tab */}
          {tab === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-slate-400 mb-8">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}.</p>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Usage */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-purple-900/40 border border-purple-800/40 rounded-lg flex items-center justify-center text-purple-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <h2 className="font-semibold text-white">Usage this month</h2>
                  </div>
                  {profile?.plan === 'pro' ? (
                    <div>
                      <div className="text-3xl font-black text-white mb-1">{usedTranscriptions}</div>
                      <div className="text-slate-400 text-sm">Unlimited transcriptions</div>
                      <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full w-full" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-black text-white mb-1">
                        {usedTranscriptions} <span className="text-lg text-slate-400 font-normal">/ 30</span>
                      </div>
                      <div className="text-slate-400 text-sm">Free plan · resets monthly</div>
                      <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                      {usedTranscriptions >= 25 && (
                        <p className="text-yellow-400 text-xs mt-2">⚠️ Running low — upgrade to Pro for unlimited</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Plan */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-purple-900/40 border border-purple-800/40 rounded-lg flex items-center justify-center text-purple-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h2 className="font-semibold text-white">Your plan</h2>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xl font-black ${profile?.plan === 'pro' ? 'gradient-text' : 'text-white'}`}>
                      {profile?.plan === 'pro' ? 'Pro' : 'Free'}
                    </span>
                    {profile?.plan === 'pro' && (
                      <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-800">Active</span>
                    )}
                  </div>
                  {profile?.plan !== 'pro' ? (
                    <>
                      <p className="text-slate-400 text-sm mb-4">Upgrade to unlock unlimited transcriptions, offline AI, and more.</p>
                      <Link
                        to="/dashboard?tab=upgrade"
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      >
                        Upgrade to Pro — $12/mo
                      </Link>
                    </>
                  ) : (
                    <p className="text-slate-400 text-sm">You're on Pro. Enjoy unlimited, offline, high-speed dictation.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Download tab */}
          {tab === 'download' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Download</h1>
              <p className="text-slate-400 mb-8">Get the latest TypeWiz app for Windows.</p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-bold text-white text-xl mb-1">TypeWiz for Windows</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">Version 1.0.0</span>
                      <span className="bg-green-900/40 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-800/50">Latest</span>
                    </div>
                  </div>
                  <div className="text-4xl">🖥️</div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-8 text-sm">
                  <div className="bg-slate-800 rounded-xl p-3">
                    <div className="text-slate-400 text-xs mb-1">Platform</div>
                    <div className="text-white font-medium">Windows 10/11</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3">
                    <div className="text-slate-400 text-xs mb-1">Architecture</div>
                    <div className="text-white font-medium">64-bit</div>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3">
                    <div className="text-slate-400 text-xs mb-1">Size</div>
                    <div className="text-white font-medium">~85 MB</div>
                  </div>
                </div>

                <a
                  href="/downloads/TypeWiz-Setup-1.0.0.exe"
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-105 text-lg w-full"
                >
                  <Download className="w-5 h-5" />
                  Download TypeWiz-Setup-1.0.0.exe
                </a>
                <p className="text-center text-slate-500 text-xs mt-3">
                  Android version coming soon. Join the waitlist to be notified.
                </p>
              </div>
            </div>
          )}

          {/* Settings tab */}
          {tab === 'settings' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
              <p className="text-slate-400 mb-8">Manage your account and preferences.</p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <form onSubmit={saveSettings} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Display name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-600 transition-colors max-w-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-500 text-sm max-w-sm cursor-not-allowed"
                    />
                    <p className="text-slate-600 text-xs mt-1">Email cannot be changed here</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Hotkey preference</label>
                    <div className="space-y-2 max-w-sm">
                      {HOTKEYS.map(hk => (
                        <button
                          key={hk.value}
                          type="button"
                          onClick={() => setHotkey(hk.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                            hotkey === hk.value
                              ? 'border-purple-600 bg-purple-900/20 text-white'
                              : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {hk.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-slate-500 text-xs mt-2">The actual hotkey is set in the TypeWiz app — this is just a reminder.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    {saved && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
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
              <h1 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h1>
              <p className="text-slate-400 mb-8">Unlock the full TypeWiz experience.</p>

              {profile?.plan === 'pro' ? (
                <div className="bg-slate-900 border border-purple-800/50 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h2 className="text-xl font-bold text-white mb-2">You're already on Pro</h2>
                  <p className="text-slate-400">Enjoy unlimited transcriptions, offline AI, and priority support.</p>
                </div>
              ) : (
                <div className="max-w-md">
                  <div className="bg-slate-900 border border-purple-700 rounded-2xl p-8 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
                    </div>

                    <div className="mb-6">
                      <div className="text-2xl font-black gradient-text mb-1">Pro Plan</div>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-white">$12</span>
                        <span className="text-slate-400 mb-1">/month</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {[
                        'Unlimited transcriptions',
                        'Local AI model (offline)',
                        'Fastest speed — no upload delay',
                        'Works without internet',
                        '50+ languages',
                        'Priority support',
                        'Early access to new features',
                      ].map(item => (
                        <li key={item} className="flex items-center gap-3 text-sm text-white">
                          <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <button
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-900/50"
                      onClick={() => alert('Stripe checkout coming soon!')}
                    >
                      Upgrade to Pro — $12/mo
                    </button>
                    <p className="text-center text-slate-500 text-xs mt-3">Cancel anytime · Billed monthly</p>
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
