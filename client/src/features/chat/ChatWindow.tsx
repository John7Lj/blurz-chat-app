/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useCallback, useState } from 'react';
import { useMessages, MESSAGES_KEY } from '../../hooks/useMessages';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useChats } from '../../hooks/useChats';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { useQueryClient } from '@tanstack/react-query';
import { messageService } from '../../services/message.service';
import { mediaService } from '../../services/media.service';
import { CHATS_KEY } from '../../hooks/useChats';
import toast from 'react-hot-toast';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import { TypingIndicator } from './TypingIndicator';
import { UserDetailsModal } from './components/UserDetailsModal';

export default function ChatWindow() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);
  const activeChatId = useUIStore((s) => s.activeChatId);
  const setActiveChat = useUIStore((s) => s.setActiveChat);
  const typingUsers = useUIStore((s) => s.typingUsers);
  const { data: chats = [] } = useChats();
  const activeChat = chats.find((c) => c.id === activeChatId);
  const { data: messages = [], isLoading } = useMessages(activeChatId);
  const { sendMessage, sendTyping, sendRead } = useWebSocket();

  const [showUserDetails, setShowUserDetails] = useState(false);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!activeChatId) return;
    try {
      await messageService.deleteMessages([messageId]);
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY(activeChatId) });
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  }, [activeChatId, queryClient]);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!activeChatId) return;
    try {
      await messageService.editMessage(messageId, newContent);
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY(activeChatId) });
      toast.success('Message edited');
    } catch (error) {
      toast.error('Failed to edit message');
    }
  }, [activeChatId, queryClient]);

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

  const handleFileUpload = useCallback(async (file: File) => {
    if (!activeChatId) return;
    try {
      await mediaService.uploadChatMedia(activeChatId, file);
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY(activeChatId) });
      queryClient.invalidateQueries({ queryKey: CHATS_KEY });
      toast.success('File sent');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Failed to upload file';
      toast.error(detail);
    }
  }, [activeChatId, queryClient]);

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
        onClickInfo={() => setShowUserDetails(true)}
      />

      <MessageList
        messages={messages}
        currentUserId={userId}
        participantName={participantName}
        participantAvatar={p?.profile_url}
        isLoading={isLoading}
        chatId={activeChatId}
        onMessageRead={sendRead}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
      />

      {isPartnerTyping && <TypingIndicator name={p?.first_name || participantName} />}

      <MessageInput onSend={handleSend} onTyping={handleTyping} onFileUpload={handleFileUpload} />

      {p && (
        <UserDetailsModal
          participant={p}
          isOpen={showUserDetails}
          onClose={() => setShowUserDetails(false)}
        />
      )}
    </div>
  );
}