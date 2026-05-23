interface AudioBubbleProps {
  src: string;
  isMine: boolean;
}

export default function AudioBubble({ src, isMine }: AudioBubbleProps) {
  return (
    <div style={{ minWidth: 220 }}>
      <audio
        src={src}
        controls
        preload="metadata"
        style={{
          width: '100%',
          height: 36,
          borderRadius: 20,
        }}
      />
    </div>
  );
}
