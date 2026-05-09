import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function LicensePage() {
  const navigate = useNavigate();
  return (
    <div style={{ height: '100dvh', overflowY: 'auto', background: 'var(--color-bg-primary)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px 60px', color: 'var(--color-text-primary)' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', marginBottom: 24 }}>
        <ArrowLeft size={20} /> Back
      </button>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>MIT License</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32 }}>Copyright (c) 2026 Blurz</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
        <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
        <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
      </div>
      </div>
    </div>
  );
}
