import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 mb-10 text-gray-500 hover:text-gray-900 text-sm">
          ← Back to TypeWiz
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: May 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance</h2>
            <p>By using TypeWiz ("the Service"), you agree to these Terms. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Use of the Service</h2>
            <p>TypeWiz is a voice dictation application for personal and professional use. You may not use the Service for any unlawful purpose, to harass others, or to violate any applicable laws or regulations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Accounts</h2>
            <p>You are responsible for maintaining the security of your account. You must provide accurate information when registering. We reserve the right to terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Free Plan</h2>
            <p>The free plan includes 30 transcriptions per month. We reserve the right to modify free plan limits with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Pro Plan & Billing</h2>
            <p>Pro subscriptions are billed monthly or annually. You may cancel at any time — cancellation takes effect at the end of your billing period. We do not offer refunds for partial periods.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p>TypeWiz and its software are owned by us. You retain full ownership of any content you create using the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Disclaimer</h2>
            <p>The Service is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service, including transcription errors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes</h2>
            <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact</h2>
            <p>Questions? Email <a href="mailto:hello@typewiz.ai" className="underline hover:text-gray-900">hello@typewiz.ai</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
