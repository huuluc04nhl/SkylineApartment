'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  HelpCircle, 
  AlertCircle,
  ChevronDown,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface BillingAiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aptCode: string;
  residentName?: string;
}

const QUICK_PROMPTS = [
  'Tháng này sao tiền nước tăng?',
  'Tôi còn nợ khoản nào chưa thanh toán?',
  'Phí quản lý vận hành được tính thế nào?',
  'Hướng dẫn thanh toán qua VNPAY / VietQR',
];

export default function BillingAiAssistantDrawer({
  isOpen,
  onClose,
  aptCode,
  residentName = 'Cư Dân',
}: BillingAiAssistantDrawerProps) {
  const { t, isEn } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Dạ em chào quý cư dân ${residentName} (Căn ${aptCode})! Em là **Trợ Lý Hóa Đơn AI** của Skyline Residence. Quý cư dân cần giải đáp thắc mắc về tiền điện, tiền nước, phí quản lý hay tình trạng thanh toán của căn hộ mình không ạ?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = (userPrompt || inputValue).trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    setInputValue('');

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `ast-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/billing/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Lỗi máy chủ (${response.status})`);
      }

      if (!response.body) {
        throw new Error('Không nhận được luồng dữ liệu phản hồi.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
          )
        );
      }
    } catch (err: any) {
      console.error('Billing AI Stream Error:', err);
      setErrorMsg(err?.message || 'Có lỗi khi kết nối đến Trợ lý AI.');
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  'Xin lỗi quý cư dân, hiện đường truyền AI đang gián đoạn tạm thời. Quý cư dân có thể đối chiếu trực tiếp tại bảng kê hóa đơn hoặc bấm thử lại bên dưới nhé ạ.',
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] z-50 bg-[#0A0E17]/98 backdrop-blur-xl border-l border-[#C5A880]/40 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-[#222B35] bg-[#121820] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center text-[#C5A880]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-white flex items-center gap-1.5">
              <span>{t('Trợ Lý Hóa Đơn AI', 'AI Billing Assistant')}</span>
              <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-500/50 text-[9px] font-mono">
                LIVE
              </span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">
              {t('Phân tích số liệu căn')} {aptCode} • {residentName}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1A222C] transition-colors rounded-none"
          title={t('Đóng', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="px-4 py-2 bg-[#141B24] border-b border-[#222B35] text-[10px] text-gray-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
        <span>{t('Chỉ hiển thị dữ liệu của căn hộ đăng nhập. Không chia sẻ ra ngoài.', 'Only shows authenticated apartment data. Private & secure.')}</span>
      </div>

      {/* Message Flow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-none bg-[#C5A880]/20 border border-[#C5A880]/60 flex items-center justify-center text-[#C5A880] shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] p-3 rounded-none whitespace-pre-wrap leading-relaxed shadow-md ${
                msg.role === 'user'
                  ? 'bg-[#C5A880] text-[#0D1117] font-medium'
                  : 'bg-[#121820] text-gray-200 border border-[#222B35]'
              }`}
            >
              <div>{msg.content}</div>
              <div
                className={`text-[9px] mt-1 font-mono text-right ${
                  msg.role === 'user' ? 'text-[#0D1117]/70' : 'text-gray-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-none bg-blue-950 border border-blue-500/60 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#C5A880] animate-pulse pl-8">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{t('AI đang tra cứu dữ liệu hóa đơn...', 'AI analyzing invoice data...')}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-red-950/60 border border-red-500/60 text-red-300 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="p-2 border-t border-[#222B35] bg-[#0E131B] space-y-1.5">
        <div className="text-[10px] text-gray-400 uppercase font-mono px-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-[#C5A880]" />
          <span>{t('Câu hỏi thường gặp:', 'Suggested questions:')}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 bg-[#161B22] border border-[#2D3748] hover:border-[#C5A880] text-gray-300 hover:text-white text-[10px] whitespace-nowrap transition-colors rounded-none shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-[#222B35] bg-[#121820]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={t('Nhập câu hỏi về hóa đơn...', 'Ask about bills, electricity, water...')}
            disabled={isLoading}
            className="flex-1 bg-[#0A0E17] border border-[#2D3748] focus:border-[#C5A880] text-xs text-white px-3 py-2.5 outline-none rounded-none placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-3.5 py-2.5 bg-[#C5A880] text-[#0D1117] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold shrink-0 flex items-center justify-center rounded-none"
            title={t('Gửi câu hỏi', 'Send')}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-center text-[9px] text-gray-500 font-mono">
          {t('Nội dung do AI tạo, vui lòng đối chiếu hóa đơn gốc.', 'Generated by AI, please cross-check with original invoice.')}
        </div>
      </div>
    </div>
  );
}

