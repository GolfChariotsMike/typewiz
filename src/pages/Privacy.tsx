import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 mb-10 text-gray-500 hover:text-gray-900 text-sm">
          ← Back to TypeWiz
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: May 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Overview</h2>
            <p>TypeWiz ("we", "our", "us") is a voice dictation application. This policy explains what data we collect, how we use it, and your rights. We are committed to your privacy — TypeWiz is designed so that your audio never leaves your device.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account information:</strong> Your name and email address when you register.</li>
              <li><strong>Usage data:</strong> Number of transcriptions per month (for free plan limits). No content is stored.</li>
              <li><strong>Subscription data:</strong> Billing status managed via Stripe. We do not store card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What We Do NOT Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Your audio:</strong> On the Pro plan, all audio is processed locally on your device using a local AI model. Audio is never uploaded to our servers.</li>
              <li><strong>Your transcriptions:</strong> The text output of your dictation is typed directly at your cursor and never stored or transmitted.</li>
              <li><strong>Training data:</strong> We never use your audio or text to train AI models.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Free Plan</h2>
            <p>The free plan uses an API-based transcription service. Audio is sent to a third-party API for processing and is subject to that provider's privacy policy. No transcript content is stored by TypeWiz.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase:</strong> Stores account and usage data. <a href="https://supabase.com/privacy" className="underline hover:text-gray-900">supabase.com/privacy</a></li>
              <li><strong>Stripe:</strong> Processes payments. <a href="https://stripe.com/privacy" className="underline hover:text-gray-900">stripe.com/privacy</a></li>
              <li><strong>Google OAuth:</strong> Optional sign-in. We only request your name and email.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Retention</h2>
            <p>Account data is retained while your account is active. You can request deletion at any time by emailing hello@typewiz.ai. We will delete your data within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p>Questions? Email us at <a href="mailto:hello@typewiz.ai" className="underline hover:text-gray-900">hello@typewiz.ai</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
