import React from 'react';
import { CheckCheck } from 'lucide-react';
import { ChatMessage, UserRole } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isCurrentUser }) => {
  return (
    <div className={`flex flex-col mb-3 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isCurrentUser
            ? 'bg-teal text-white rounded-br-xs'
            : 'bg-white text-navy border border-sage-border rounded-bl-xs'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <div
          className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
            isCurrentUser ? 'text-teal-light/80' : 'text-gray-400'
          }`}
        >
          <span>{message.timestamp}</span>
          {isCurrentUser && (
            <CheckCheck size={13} className={message.isRead ? 'text-teal-light' : 'text-teal-light/60'} />
          )}
        </div>
      </div>
    </div>
  );
};
