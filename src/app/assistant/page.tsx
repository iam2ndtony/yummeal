'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, User as UserIcon, Send, Menu, X, Plus, Clock, MessageSquare, ChefHat, Save } from 'lucide-react';
import { sendChatMessage, getChatSessions, getChatSession, startNewChat, deductRecipeIngredients } from '@/actions/chat';
import { saveRecipeFromAI } from '@/actions/recipes';
import styles from './page.module.css';
import DashboardFooter from '@/components/DashboardFooter';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Xin chào! Tôi là đầu bếp AI của Yummeal 🍳\n\nBạn có thể hỏi tôi bất cứ điều gì về nấu ăn, công thức, hoặc cách tận dụng nguyên liệu trong tủ lạnh hôm nay.'
};

const SUGGESTIONS = [
  'Gợi ý món ăn từ tủ lạnh',
  'Cách làm phở bò tại nhà?',
  'Món ăn nhanh dưới 30 phút'
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deductingIndex, setDeductingIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const handleCookRecipe = async (content: string, index: number) => {
    setDeductingIndex(index);
    try {
      const result = await deductRecipeIngredients(content);
      if (result.success) {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: result.message! }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: `Lỗi: ${result.error}` }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'system', content: 'Lỗi: Không thể kết nối với server để trừ nguyên liệu.' }
      ]);
    } finally {
      setDeductingIndex(null);
    }
  };

  const handleSaveRecipe = async (content: string, index: number) => {
    setSavingIndex(index);
    try {
      const result = await saveRecipeFromAI(content);
      if (result.success) {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: result.message! }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'system', content: `Lỗi lưu công thức: ${result.error}` }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'system', content: 'Lỗi: Không thể kết nối với server để lưu công thức.' }
      ]);
    } finally {
      setSavingIndex(null);
    }
  };

  // Scroll smoothly to bottom on new message
  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Fetch history
  const loadSessions = async () => {
    const data = await getChatSessions();
    setSessions(data as any);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = async (sessionId: string) => {
    setIsSidebarOpen(false);
    if (sessionId === activeSessionId) return;
    
    setIsLoading(true);
    setActiveSessionId(sessionId);
    
    const sessionDetail = await getChatSession(sessionId);
    if (sessionDetail && sessionDetail.messages.length > 0) {
      setMessages(sessionDetail.messages.map((m: any) => ({
        role: m.role,
        content: m.content
      })));
    } else {
      setMessages([INITIAL_MESSAGE]);
    }
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([INITIAL_MESSAGE]);
    setIsSidebarOpen(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Filter out initial message array if it's new chat
    const historyToApi = activeSessionId ? newMessages : [userMessage];
    setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

    try {
      if (!activeSessionId) {
        // Start new session
        const result = (await startNewChat(text)) as any;
        if (result.success && result.sessionId) {
          setActiveSessionId(result.sessionId);
          setMessages([userMessage, { role: 'assistant', content: result.message! }]);
          loadSessions(); // Refresh sidebar title
        } else {
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: result.error || 'Đã có lỗi tạo phiên.' }
          ]);
        }
      } else {
        // Continue session
        const apiMessages = newMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
        const result = await sendChatMessage(apiMessages, activeSessionId);
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: result.success ? result.message! : (result.error || 'Đã có lỗi.') }
        ]);
        loadSessions(); // To update the sorting of sessions by date
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth()+1}`;
  };

  return (
    <>
      <main className={styles.assistantContainer}>
        {/* Sidebar overlay background */}
        <div className={styles.swirlBg} aria-hidden="true">
          <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="1300" cy="200" rx="500" ry="400" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
            <ellipse cx="100" cy="700" rx="400" ry="320" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
          </svg>
        </div>

        {/* Sidebar Drawer */}
        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Lịch sử Chat</span>
            {user?.kitchenGear && user.kitchenGear.length > 0 && (
              <span className={styles.gearBadge} title="Đã đồng bộ thiết bị của bạn">
                <Bot size={14} /> Synced
              </span>
            )}
            <button onClick={() => setIsSidebarOpen(false)} className={styles.closeSidebarBtn} style={{ display: 'none' /* Only show on mobile if needed */ }}>
              <X size={24} />
            </button>
          </div>
          
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <Plus size={20} /> Mới
          </button>

          <div className={styles.sessionList}>
            {sessions.map(s => (
              <div 
                key={s.id} 
                className={`${styles.sessionItem} ${activeSessionId === s.id ? styles.sessionItemActive : ''}`}
                onClick={() => handleSelectSession(s.id)}
              >
                <div className={styles.sessionItemTitle}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: '6px', opacity: 0.6 }}/> 
                  {s.title}
                </div>
                <div className={styles.sessionItemDate}>
                  <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}/>
                  {formatTime(s.updatedAt)}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '20px' }}>
                Chưa có lịch sử.
              </div>
            )}
          </div>
        </aside>

        {/* Main Interface */}
        <div className={styles.mainContent}>
          {/* Fluid Chat Flow */}
          <div className={styles.chatWrapper}>
            <div className={styles.chatBox}>
              {messages.map((msg, i) => {
                if (msg.role === 'system') {
                  return (
                    <div key={i} className={styles.systemMessageContainer}>
                      <div className={styles.systemMessageBubble}>
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                const isLast = i === messages.length - 1;
                const isAssistant = msg.role === 'assistant';
                const looksLikeRecipe = isAssistant && msg.content.length > 200 && (msg.content.includes('uyên liệu') || msg.content.includes('ông thức'));
                
                // Show buttons if it's the recipe message and no newer user/assistant message exists
                const noNewerMainMessage = messages.slice(i + 1).every(m => m.role === 'system');
                const showDeductBtn = looksLikeRecipe && noNewerMainMessage && !isLoading;

                return (
                  <div
                    key={i}
                    className={`${styles.messageBubbleWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper}`}
                  >
                    <div className={msg.role === 'user' ? styles.avatarUser : styles.avatarAssistant}>
                      {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`${styles.messageBubble} ${msg.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                      {msg.role === 'assistant'
                        ? (
                          <>
                            <div className={styles.markdownBody}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            {showDeductBtn && (
                              <div className={styles.actionButtonsRow}>
                                <button 
                                  onClick={() => handleCookRecipe(msg.content, i)}
                                  disabled={deductingIndex === i || savingIndex === i}
                                  className={styles.cookBtn}
                                >
                                  <ChefHat size={16} />
                                  {deductingIndex === i ? 'Đang xử lý...' : 'Trừ nguyên liệu Tủ lạnh'}
                                </button>
                                <button 
                                  onClick={() => handleSaveRecipe(msg.content, i)}
                                  disabled={savingIndex === i || deductingIndex === i}
                                  className={`${styles.cookBtn} ${styles.saveBtn}`}
                                >
                                  <Save size={16} />
                                  {savingIndex === i ? 'Đang lưu...' : 'Lưu Công thức'}
                                </button>
                              </div>
                            )}
                          </>
                        )
                        : msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>

            {/* Inline Input Area */}
            <div className={styles.inputAreaContainer}>
              <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                  <input
                    className={styles.chatInput}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                    placeholder="Hôm nay bạn muốn nấu gì..."
                    disabled={isLoading}
                  />
                  <button className={styles.sendBtn} onClick={() => handleSend(input)} disabled={isLoading}>
                    <Send size={18} />
                  </button>
                </div>
                
                {messages.length <= 1 && (
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} className={styles.suggestionPill} onClick={() => handleSend(s)} disabled={isLoading}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {user?.plan !== 'PLUS' && (
                  <p className={styles.limitText}>
                    Gói Miễn phí (Giới hạn 3 lượt/ngày). 
                    <Link href="/upgrade" style={{ color: 'var(--primary)', marginLeft: '4px', fontWeight: 'bold' }}>Nâng cấp hạn mức</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <DashboardFooter />
    </>
  );
}
