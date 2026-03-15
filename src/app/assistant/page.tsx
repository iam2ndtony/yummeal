'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, User as UserIcon, Send } from 'lucide-react';
import { sendChatMessage } from '@/actions/chat';
import styles from './page.module.css';
import DashboardFooter from '@/components/DashboardFooter';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Xin chào! Tôi là đầu bếp AI của Yummeal 🍳 Tôi có thể gợi ý công thức dựa trên nguyên liệu trong tủ lạnh của bạn, giải đáp thắc mắc về nấu ăn, và nhiều hơn nữa. Tôi có thể giúp gì cho bạn hôm nay?'
};

const SUGGESTIONS = [
  'Gợi ý món ăn từ tủ lạnh của tôi',
  'Cách làm phở bò tại nhà?',
  'Món ăn nhanh dưới 30 phút',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const result = await sendChatMessage(apiMessages);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: result.success ? result.message! : (result.error || 'Đã có lỗi.') }
      ]);
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className={styles.assistantContainer}>
        <div className={styles.swirlBg} aria-hidden="true">
          <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="1300" cy="200" rx="500" ry="400" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
            <ellipse cx="100" cy="700" rx="400" ry="320" stroke="rgba(211,84,0,0.12)" strokeWidth="70" fill="none"/>
          </svg>
        </div>

        <div className={`container ${styles.inner}`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Trợ lý AI</h1>
            <p className={styles.subtitle}>Đầu bếp AI thông minh luôn sẵn sàng hỗ trợ bạn</p>
          </div>

          <div className={styles.chatWrapper}>
            <div className={styles.chatBox} ref={chatBoxRef}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${styles.messageBubbleWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper}`}
                >
                  <div className={msg.role === 'user' ? styles.avatarUser : styles.avatarAssistant}>
                    {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`${styles.messageBubble} ${msg.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                    {msg.role === 'assistant'
                      ? <div className={styles.markdownBody}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                      : msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.inputArea}>
              <div className={styles.inputWrapper}>
                <input
                  className={styles.chatInput}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                  placeholder="Nhập câu hỏi về nấu ăn..."
                  disabled={isLoading}
                />
                <button className={styles.sendBtn} onClick={() => handleSend(input)} disabled={isLoading}>
                  <Send size={18} /> Gửi
                </button>
              </div>
              
              {user?.plan !== 'PLUS' && (
                <p className={styles.limitText}>
                  Bạn đang dùng gói Miễn phí (Giới hạn 3 lượt hỏi/ngày). 
                  <Link href="/upgrade" style={{ color: 'var(--primary)', marginLeft: '5px', fontWeight: 'bold' }}>Nâng cấp ngay</Link>
                </p>
              )}

              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className={styles.suggestionPill} onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <DashboardFooter />
    </>
  );
}
