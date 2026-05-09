import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, color: 'var(--color-text-primary)' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', marginBottom: 24 }}>
        <ArrowLeft size={20} /> Back
      </button>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>Last Updated: May 2026</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, lineHeight: 1.6 }}>
        <p>Blurz Chat App ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>
        
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Information We Collect</h2>
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong>Account Information:</strong> When you register, we collect information such as your email address, username, and password.</li>
            <li><strong>Profile Information:</strong> You may choose to provide additional information, such as a profile picture.</li>
            <li><strong>Messages:</strong> We store the messages you send and receive through the service to deliver them to the intended recipients and provide chat history.</li>
            <li><strong>Usage Data:</strong> We may collect information on how the service is accessed and used.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: 8 }}>We use the collected information for various purposes, including to:</p>
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Provide and maintain our service.</li>
            <li>Notify you about changes to our service.</li>
            <li>Allow you to participate in interactive features of our service.</li>
            <li>Provide customer support.</li>
            <li>Monitor the usage of our service.</li>
            <li>Detect, prevent, and address technical issues.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. Data Storage and Security</h2>
          <p>Your data is stored in our databases. We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet, or method of electronic storage, is 100% secure.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Sharing Your Information</h2>
          <p>We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Your Choices</h2>
          <p>You can update your account information and preferences at any time by logging into your account settings. You may also request the deletion of your account and associated data.</p>
        </section>
      </div>
    </div>
  );
}
