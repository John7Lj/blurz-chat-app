import { useCallback } from 'react';
import { useMessages } from '../../hooks/use-messages';
import { useWebSocket } from '../../hooks/use-websocket';
import { useChats } from '../../hooks/use-chats';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import { TypingIndicator } from './TypingIndicator';

export default function ChatWindow() {
  const userId = useAuthStore((s) => s.userId);
  const activeChatId = useUIStore((s) => s.activeChatId);
  const setActiveChat = useUIStore((s) => s.setActiveChat);
  const typingUsers = useUIStore((s) => s.typingUsers);
  const { data: chats = [] } = useChats();
  const activeChat = chats.find((c) => c.id === activeChatId);
  const { data: messages = [], isLoading } = useMessages(activeChatId);
  const { sendMessage, sendTyping, sendRead } = useWebSocket();

  const handleSend = useCallback(
    (text: string) => {
      if (!activeChatId) return;
      sendMessage(activeChatId, text);
    },
    [activeChatId, sendMessage],
  );

  const handleTyping = useCallback(() => {
    if (!activeChatId) return;
    sendTyping(activeChatId);
  }, [activeChatId, sendTyping]);

  const handleBack = useCallback(() => {
    setActiveChat(null);
  }, [setActiveChat]);

  if (!activeChatId) {
    return (
      <div
        data-testid="empty-chat-state"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--chat-msg-bg)',
        }}
      >
        <EmptyState />
      </div>
    );
  }

  const p = activeChat?.participants;
  const participantName = p ? `${p.first_name} ${p.last_name}` : '';
  const typingUserId = typingUsers[activeChatId];
  const isPartnerTyping = !!typingUserId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <ChatHeader
        name={participantName}
        avatarSrc={p?.profile_url}
        isOnline={true}
        onBack={handleBack}
      />

      <MessageList
        messages={messages}
        currentUserId={userId}
        participantName={participantName}
        participantAvatar={p?.profile_url}
        isLoading={isLoading}
        chatId={activeChatId}
        onMessageRead={sendRead}
      />

      {isPartnerTyping && <TypingIndicator name={p?.first_name || participantName} />}

      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}