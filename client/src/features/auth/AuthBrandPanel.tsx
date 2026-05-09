/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function AuthBrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
      style={{
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        isolation: 'isolate',
      }}
    >
      {/* Background Effects — z-0, isolated so they don't bleed */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute animate-float"
          style={{
            top: '-20%',
            left: '-20%',
            width: '140%',
            height: '140%',
            background:
              'radial-gradient(ellipse at center, rgba(109,40,217,0.15) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '-10%',
            right: '-10%',
            width: '80%',
            height: '80%',
            background:
              'radial-gradient(circle at center, rgba(139,92,246,0.12) 0%, transparent 70%)',
            animation: 'pulse-ring 6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content — vertically centered, full height */}
      <div className="flex flex-col justify-center flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 4px 24px rgba(109,40,217,0.4)',
            }}
          >
            <img
              src="/blurz-logo.png"
              alt="Blurz"
              className="w-9 h-9 object-contain"
            />
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Blurz
          </span>
        </div>

        {/* Headline */}
        <h2
          className="text-4xl font-extrabold leading-tight tracking-tight mb-4"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 60%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Connect with<br />everyone, anywhere.
        </h2>

        <p
          className="text-[15px] leading-relaxed mb-10"
          style={{ color: 'var(--color-text-secondary)', maxWidth: '320px' }}
        >
          Real-time messaging with a modern interface, secure connections, and
          blazing fast performance.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-col gap-3">
          {[
            { icon: '⚡', text: 'Lightning fast messaging' },
            { icon: '🎨', text: 'Beautiful dynamic design' },
            { icon: '🔒', text: 'Secure & private' },
          ].map((feat, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-fit animate-fade-in stagger-${i + 1}`}
              style={{
                background: 'var(--color-bg-glass)',
                border: '1px solid var(--color-border)',
              }}
            >
              <span className="text-base leading-none">{feat.icon}</span>
              <span
                className="text-[13px] font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {feat.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}