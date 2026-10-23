import { Conversation, ChatMessage, UserRole } from '../../types';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../mockData';

const CONV_STORAGE_KEY = 'locallink_conv_cache';
const MSGS_STORAGE_KEY = 'locallink_msgs_cache';

function getStoredConversations(): Conversation[] {
  const cached = localStorage.getItem(CONV_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return [...MOCK_CONVERSATIONS];
}

function saveStoredConversations(list: Conversation[]) {
  localStorage.setItem(CONV_STORAGE_KEY, JSON.stringify(list));
}

function getStoredMessages(): Record<string, ChatMessage[]> {
  const cached = localStorage.getItem(MSGS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return { ...MOCK_MESSAGES };
}

function saveStoredMessages(dict: Record<string, ChatMessage[]>) {
  localStorage.setItem(MSGS_STORAGE_KEY, JSON.stringify(dict));
}

export async function getConversations(): Promise<Conversation[]> {
  // TODO: Connect supabase.from('conversations').select('*').order('updated_at', { ascending: false })
  await new Promise((r) => setTimeout(r, 120));
  return getStoredConversations();
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  // TODO: Connect supabase.from('messages').select('*').eq('conversation_id', conversationId)
  await new Promise((r) => setTimeout(r, 100));
  const msgs = getStoredMessages();
  return msgs[conversationId] || [];
}

export async function sendMessage(data: {
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
}): Promise<ChatMessage> {
  // TODO: Connect supabase.from('messages').insert(...) and broadcast via Supabase Realtime
  await new Promise((r) => setTimeout(r, 150));
  const msgs = getStoredMessages();
  const convs = getStoredConversations();

  const newMsg: ChatMessage = {
    id: 'msg_' + Date.now(),
    conversationId: data.conversationId,
    senderId: data.senderId,
    senderRole: data.senderRole,
    text: data.text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: false,
  };

  const list = msgs[data.conversationId] || [];
  list.push(newMsg);
  msgs[data.conversationId] = list;
  saveStoredMessages(msgs);

  // Update conversation last message
  const cIdx = convs.findIndex((c) => c.id === data.conversationId);
  if (cIdx >= 0) {
    convs[cIdx].lastMessage = data.text;
    convs[cIdx].lastMessageTime = newMsg.timestamp;
    saveStoredConversations(convs);
  }

  return newMsg;
}

export async function getOrCreateConversation(participant: {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  phone?: string;
}): Promise<Conversation> {
  const convs = getStoredConversations();
  const existing = convs.find((c) => c.participantId === participant.id);
  if (existing) return existing;

  const newConv: Conversation = {
    id: 'conv_' + Date.now(),
    participantId: participant.id,
    participantName: participant.name,
    participantAvatar: participant.avatar,
    participantRole: participant.role,
    participantPhone: participant.phone,
    lastMessage: 'Conversation started',
    lastMessageTime: 'Just now',
    unreadCount: 0,
  };

  convs.unshift(newConv);
  saveStoredConversations(convs);
  return newConv;
}
