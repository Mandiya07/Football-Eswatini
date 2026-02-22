import React from 'react';
import ShieldIcon from './icons/ShieldIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-primary py-12 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
            <ShieldIcon className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-blue-100/80 text-lg max-w-2xl mx-auto">
            How we protect your data in compliance with the Eswatini Data Protection Act (2022).
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
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to Football Eswatini ("we," "our," or "us"). We are committed to protecting your personal data and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile-first web application.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">2. Data Collection</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              In accordance with the Eswatini Data Protection Act (2022), we only collect data that is necessary for the functionality of the platform. This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and profile preferences when you register.</li>
              <li><strong>Usage Data:</strong> Information on how you interact with the app (e.g., favorite teams, news read).</li>
              <li><strong>Device Information:</strong> IP address, browser type, and device identifiers for security and analytics.</li>
              <li><strong>Location Data:</strong> If permitted, we use geolocation to show nearby matches or regional news.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">3. How We Use Your Data</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use your data to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide personalized football news and live updates.</li>
              <li>Manage your user profile and preferences.</li>
              <li>Improve our services through anonymized analytics.</li>
              <li>Communicate important updates or marketing (with your consent).</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">4. Data Sharing & Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We do not sell your personal data to third parties. We may share anonymized, aggregated data with partners (like the EFA) for sports development purposes. We implement industry-standard security measures to protect your data from unauthorized access.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Under Eswatini law, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data ("Right to be Forgotten").</li>
              <li>Object to the processing of your data for marketing purposes.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">6. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at: <br/>
              <span className="font-bold text-primary">privacy@footballeswatini.sz</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
