import React from 'react';
import FileTextIcon from './icons/FileTextIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const TermsOfService: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-slate-900 py-12 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
            <FileTextIcon className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            The rules and guidelines for using the Football Eswatini platform.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-3xl py-16 px-6">
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-12 font-bold uppercase text-xs tracking-widest"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to App
        </button>

        <div className="prose prose-slate max-w-none">
          <p className="text-gray-500 text-sm mb-8 italic">Last Updated: February 22, 2026</p>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using Football Eswatini, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">2. Use of Content</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              All content on this platform, including news articles, match data, logos, and images, is protected by intellectual property laws.
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Personal Use:</strong> You are granted a limited license to access content for personal, non-commercial use.</li>
              <li><strong>Prohibitions:</strong> You may not scrape data, redistribute content for profit, or use team logos for commercial purposes without explicit permission.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-600 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility. We reserve the right to suspend accounts that violate our community guidelines or engage in fraudulent activity.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">4. Community Guidelines</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              When participating in polls, comments, or community features:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Be respectful to other fans, players, and officials.</li>
              <li>No hate speech, harassment, or bullying.</li>
              <li>No spam or unauthorized advertising.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              While we strive for 100% accuracy in match data and news, Football Eswatini is provided "as is." We are not liable for any decisions made based on the information provided on the platform (e.g., match times, scores).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">6. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These terms are governed by the laws of the Kingdom of Eswatini. Any disputes shall be resolved in the courts of Eswatini.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
