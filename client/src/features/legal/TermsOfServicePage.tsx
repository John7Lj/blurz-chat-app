import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function TermsOfServicePage() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, color: 'var(--color-text-primary)' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', marginBottom: 24 }}>
        <ArrowLeft size={20} /> Back
      </button>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Terms of Service</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>Last Updated: May 2026</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, lineHeight: 1.6 }}>
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Description of Service</h2>
          <p>Blurz is a real-time chat application that allows users to send and receive messages. We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part thereof) with or without notice.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. User Accounts</h2>
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for safeguarding the password that you use to access the service.</li>
            <li>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. Acceptable Use</h2>
          <p style={{ marginBottom: 8 }}>You agree not to use the service to:</p>
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.</li>
            <li>Impersonate any person or entity.</li>
            <li>Transmit any material that contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Intellectual Property</h2>
          <p>The service and its original content, features, and functionality are and will remain the exclusive property of Blurz and its licensors. The service is protected by copyright, trademark, and other laws.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Termination</h2>
          <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Limitation of Liability</h2>
          <p>In no event shall Blurz, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
        </section>
      </div>
    </div>
  );
}
