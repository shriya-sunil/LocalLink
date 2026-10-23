import { Conversation, ChatMessage, UserRole } from '../../types';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../mockData';
import { isDevDemoMode, supabase } from './supabaseClient';

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

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderRole: row.sender_role || 'customer',
    text: row.body,
    timestamp: row.created_at,
    isRead: false,
  };
}

function mapConversation(row: any, userId: string, lastMessage?: any): Conversation {
  const isCustomer = row.customer_id === userId;
  const participant = isCustomer ? row.provider : row.customer;
  const profile = Array.isArray(participant) ? participant[0] : participant;

  return {
    id: row.id,
    participantId: isCustomer ? row.provider_id : row.customer_id,
    participantName: profile?.full_name || 'Neighbor',
    participantAvatar: profile?.avatar_url || '',
    participantRole: isCustomer ? 'provider' : 'customer',
    participantPhone: profile?.phone || undefined,
    lastMessage: lastMessage?.body || 'Conversation started',
    lastMessageTime: lastMessage?.created_at || row.created_at,
    unreadCount: 0,
  };
}

export async function getConversations(): Promise<Conversation[]> {
  if (isDevDemoMode()) {
    await new Promise((r) => setTimeout(r, 120));
    return getStoredConversations();
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select('*, customer:profiles!conversations_customer_id_fkey(full_name, phone, avatar_url), provider:profiles!conversations_provider_id_fkey(full_name, phone, avatar_url)')
    .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return Promise.all((data || []).map(async (conversation) => {
    const { data: lastMessage, error: messageError } = await supabase
      .from('messages')
      .select('body, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (messageError) throw messageError;
    return mapConversation(conversation, user.id, lastMessage);
  }));
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  if (!isDevDemoMode()) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapMessage);
  }

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
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user || user.id !== data.senderId) throw new Error('Sign in before sending a message.');

    const { data: row, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: data.conversationId,
        sender_id: user.id,
        sender_role: data.senderRole,
        body: data.text,
      })
      .select('id, conversation_id, sender_id, sender_role, body, created_at')
      .single();
    if (error) throw error;
    return mapMessage(row);
  }

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
  if (!isDevDemoMode()) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Sign in before starting a conversation.');

    const role = localStorage.getItem('locallink_active_role') as UserRole || 'customer';
    if (role === participant.role) throw new Error('Conversations require a customer and a provider.');

    const customerId = role === 'customer' ? user.id : participant.id;
    const providerId = role === 'provider' ? user.id : participant.id;
    const { data: existing, error: lookupError } = await supabase
      .from('conversations')
      .select('*, customer:profiles!conversations_customer_id_fkey(full_name, phone, avatar_url), provider:profiles!conversations_provider_id_fkey(full_name, phone, avatar_url)')
      .eq('customer_id', customerId)
      .eq('provider_id', providerId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const conversation = existing || (await supabase
      .from('conversations')
      .insert({ customer_id: customerId, provider_id: providerId })
      .select('*, customer:profiles!conversations_customer_id_fkey(full_name, phone, avatar_url), provider:profiles!conversations_provider_id_fkey(full_name, phone, avatar_url)')
      .single()).data;
    if (!conversation) throw new Error('Could not create the conversation.');
    return mapConversation(conversation, user.id);
  }

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
