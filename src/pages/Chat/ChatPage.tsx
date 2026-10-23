import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Send,
  ChevronLeft,
  Phone,
  ShieldCheck,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getConversations,
  getMessages,
  sendMessage,
} from '../../lib/api/chat';
import { Conversation, ChatMessage } from '../../types';
import { ChatBubble } from '../../components/common/ChatBubble';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, role } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    async function fetchConvs() {
      try {
        setLoading(true);
        const list = await getConversations();
        setConversations(list);

        if (conversationId) {
          const found = list.find((c) => c.id === conversationId);
          if (found) {
            setActiveConv(found);
            const msgs = await getMessages(found.id);
            setMessages(msgs);
          }
        } else if (list.length > 0 && window.innerWidth >= 768) {
          // On wider screens auto-select first conversation
          setActiveConv(list[0]);
          const msgs = await getMessages(list[0].id);
          setMessages(msgs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchConvs();
  }, [conversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    navigate(`/chat/${conv.id}`);
    const msgs = await getMessages(conv.id);
    setMessages(msgs);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activeConv) return;

    try {
      const newMsg = await sendMessage({
        conversationId: activeConv.id,
        senderId: user?.id || 'usr_priya_01',
        senderRole: role,
        text: text.trim(),
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputText('');

      // Auto update conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessage: newMsg.text, lastMessageTime: newMsg.timestamp }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header if Inside Active Conversation */}
      {activeConv ? (
        <div className="flex flex-col h-full bg-white rounded-2xl border border-sage-border overflow-hidden shadow-soft">
          {/* Top Bar */}
          <div className="p-3 border-b border-sage-border flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-2.5 truncate">
              <button
                type="button"
                onClick={() => {
                  setActiveConv(null);
                  navigate('/chat');
                }}
                className="p-1 -ml-1 rounded-lg text-navy hover:bg-sage-light"
                aria-label="Back to conversations"
              >
                <ChevronLeft size={22} />
              </button>

              <div className="relative">
                <img
                  src={activeConv.participantAvatar}
                  alt={activeConv.participantName}
                  className="w-10 h-10 rounded-full object-cover border border-sage-border"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
              </div>

              <div className="truncate">
                <h2 className="text-xs sm:text-sm font-bold text-navy truncate flex items-center gap-1">
                  <span>{activeConv.participantName}</span>
                  {activeConv.participantRole === 'provider' && (
                    <ShieldCheck size={14} className="text-teal" />
                  )}
                </h2>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {t('chat.online')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {activeConv.participantPhone && (
                <a
                  href={`tel:${activeConv.participantPhone}`}
                  className="p-2 rounded-xl text-navy hover:bg-sage-light border border-sage-border"
                  title="Call"
                >
                  <Phone size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-sage-light/30">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Start your neighborhood conversation safely on LocalLink.
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isCurrentUser={msg.senderRole === role}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Strip */}
          <div className="px-3 py-1.5 bg-white border-t border-sage-border/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-gray-400 flex items-center gap-1 flex-shrink-0">
              <Sparkles size={12} className="text-salmon" />
            </span>
            {[t('chat.quick_1'), t('chat.quick_2'), t('chat.quick_3')].map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickReply(qr)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-sage-light text-navy border border-sage-border hover:bg-teal-light hover:border-teal transition-colors font-medium"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-sage-border bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chat.type_placeholder')}
              className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-sage-border bg-sage-light/20 text-xs sm:text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-xl bg-teal text-white hover:bg-teal-hover transition-colors disabled:opacity-40"
              aria-label={t('chat.send')}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        /* Conversation List */
        <div className="flex-1 flex flex-col space-y-3">
          <div>
            <h1 className="text-xl font-extrabold text-navy leading-tight">
              {t('chat.title')}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Direct neighborhood messaging between customer and verified professional
            </p>
          </div>

          {loading ? (
            <div className="space-y-2 pt-2">
              {[1, 2].map((i) => (
                <div key={i} className="ll-card p-3 animate-pulse flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-sage-light" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-sage-light rounded w-1/3" />
                    <div className="h-3 bg-sage-light rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="ll-card p-8 text-center space-y-2 bg-salmon-light/30 border-salmon my-auto">
              <MessageSquare size={32} className="text-navy mx-auto opacity-50" />
              <h3 className="font-bold text-navy text-sm">{t('chat.empty')}</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Quotes, inquiries, and booking coordination messages will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className="ll-card p-3.5 hover:border-teal transition-all cursor-pointer flex items-center justify-between gap-3 shadow-soft"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.participantAvatar}
                        alt={conv.participantName}
                        className="w-12 h-12 rounded-full object-cover border border-sage-border"
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-coral border-2 border-white" />
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-navy truncate">
                          {conv.participantName}
                        </span>
                        {conv.participantRole === 'provider' && (
                          <ShieldCheck size={14} className="text-teal flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <span className="text-[10px] text-gray-400 block">
                      {conv.lastMessageTime}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block px-1.5 py-0.2 rounded-full bg-teal text-white text-[10px] font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
