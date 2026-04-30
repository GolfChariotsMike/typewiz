export type Plan = 'free' | 'pro'

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  plan: Plan
  hotkey: string
  transcriptions_this_month: number
  created_at: string
  updated_at: string
}
