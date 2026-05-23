interface VideoBubbleProps {
  src: string;
  isMine: boolean;
}

export default function VideoBubble({ src, isMine }: VideoBubbleProps) {
  return (
    <div style={{ maxWidth: 300, borderRadius: 8, overflow: 'hidden' }}>
      <video
        src={src}
        controls
        preload="metadata"
        style={{
          width: '100%',
          maxHeight: 300,
          display: 'block',
          borderRadius: 8,
          background: '#000',
        }}
      />
    </div>
  );
}
