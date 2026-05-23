import { FileText, Download } from 'lucide-react';

interface FileBubbleProps {
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  fileMime?: string | null;
  isMine: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileBubble({ fileName, fileUrl, fileSize, isMine }: FileBubbleProps) {
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        background: isMine ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-input)',
        textDecoration: 'none',
        color: 'inherit',
        minWidth: 200,
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isMine ? 'rgba(255,255,255,0.15)' : 'var(--color-accent)',
        flexShrink: 0,
      }}>
        <FileText size={20} style={{ color: '#fff' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          margin: 0,
          color: isMine ? '#fff' : 'var(--chat-recv-text)',
        }}>
          {fileName}
        </p>
        {fileSize && (
          <p style={{ fontSize: 11, margin: '2px 0 0', opacity: 0.7, color: isMine ? '#fff' : 'var(--chat-recv-text)' }}>
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <Download size={18} style={{ flexShrink: 0, opacity: 0.6, color: isMine ? '#fff' : 'var(--chat-recv-text)' }} />
    </a>
  );
}
