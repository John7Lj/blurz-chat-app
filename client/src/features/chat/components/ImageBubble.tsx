import { useState } from 'react';
import { X } from 'lucide-react';

interface ImageBubbleProps {
  src: string;
  alt?: string;
  isMine: boolean;
}

export default function ImageBubble({ src, alt, isMine }: ImageBubbleProps) {
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowLightbox(true)}
        style={{
          cursor: 'pointer',
          borderRadius: 8,
          overflow: 'hidden',
          maxWidth: 280,
        }}
      >
        <img
          src={src}
          alt={alt || 'Image'}
          style={{
            width: '100%',
            maxHeight: 300,
            objectFit: 'cover',
            display: 'block',
            borderRadius: 8,
          }}
          loading="lazy"
        />
      </div>

      {/* Lightbox overlay */}
      {showLightbox && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowLightbox(false); }}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <X size={22} />
          </button>
          <img
            src={src}
            alt={alt || 'Image'}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />
        </div>
      )}
    </>
  );
}
