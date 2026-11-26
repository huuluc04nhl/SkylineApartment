'use client';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, ShieldAlert, CheckCircle2, X, RefreshCw, Edit3, ShieldCheck } from 'lucide-react';
import { Bill } from '@/lib/dataStore';

interface DebtReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  unpaidBills: Bill[];
  selectedBillId?: string | null;
  onSentSuccess?: (billId: string) => void;
}

export default function DebtReminderModal({
  isOpen,
  onClose,
  unpaidBills,
  selectedBillId,
  onSentSuccess
}: DebtReminderModalProps) {
  useEscapeKey(isOpen, onClose);
  const [activeBillId, setActiveBillId] = useState<string>('');
  const [toneOverride, setToneOverride] = useState<'LEVEL_1_GENTLE' | 'LEVEL_2_STANDARD' | 'LEVEL_3_STRICT' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [detectedLevel, setDetectedLevel] = useState<string>('LEVEL_1_GENTLE');
  const [levelName, setLevelName] = useState<string>('');
  const [overdueDays, setOverdueDays] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (selectedBillId) {
      setActiveBillId(selectedBillId);
    } else if (unpaidBills.length > 0 && !activeBillId) {
      setActiveBillId(unpaidBills[0].id);
    }
  }, [selectedBillId, unpaidBills]);

  useEffect(() => {
    if (activeBillId && isOpen) {
      loadDraft(activeBillId, toneOverride || undefined);
    }
  }, [activeBillId, toneOverride, isOpen]);

  if (!isOpen) return null;

  const loadDraft = async (billId: string, tone?: 'LEVEL_1_GENTLE' | 'LEVEL_2_STANDARD' | 'LEVEL_3_STRICT') => {
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/billing/debt-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill_id: billId,
          tone_override: tone
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'KhÃ´ng thá»ƒ táº¡o báº£n nhÃ¡p');
      }

      setSubject(data.data.draft_subject);
      setBodyText(data.data.draft_body);
      setDetectedLevel(data.data.detected_level);
      setLevelName(data.data.level_name);
      setOverdueDays(data.data.overdue_days);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Lá»—i káº¿t ná»‘i' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!bodyText.trim() || !activeBillId) return;

    setIsSending(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/billing/debt-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          bill_id: activeBillId,
          final_content: `${subject}\n\n${bodyText}`,
          tone_level: detectedLevel
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'KhÃ´ng thá»ƒ gá»­i thÃ´ng bÃ¡o');
      }

      setStatusMsg({ type: 'success', text: data.message || 'ÄÃ£ gá»­i thÃ´ng bÃ¡o thÃ nh cÃ´ng!' });
      if (onSentSuccess) onSentSuccess(activeBillId);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Lá»—i khi gá»­i thÃ´ng bÃ¡o' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0E131B] border border-[#C5A880]/60 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-gray-200 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#C5A880]/10 border border-[#C5A880]/40 text-[#C5A880]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif uppercase tracking-wide">
                Soáº¡n Nháº¯c Ná»£ CÃ¡ NhÃ¢n HÃ³a (3 Má»©c Giá»ng Äiá»‡u)
              </h2>
              <p className="text-xs text-gray-400">
                AI cÃ¡ nhÃ¢n hÃ³a theo sá»‘ ngÃ y quÃ¡ háº¡n â€¢ BQL báº¯t buá»™c duyá»‡t & sá»­a trÆ°á»›c khi gá»­i (KHÃ”NG tá»± Ä‘á»™ng gá»­i)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1E2530] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form selection: CÄƒn há»™ ná»£ & Cáº¥p Ä‘á»™ giá»ng Ä‘iá»‡u */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
              Chá»n CÄƒn Há»™ CÃ²n Ná»£
            </label>
            <select
              value={activeBillId}
              onChange={(e) => {
                setActiveBillId(e.target.value);
                setToneOverride('');
              }}
              className="w-full bg-[#161D26] border border-[#2A3441] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C5A880]"
            >
              {unpaidBills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.apt_code} - {b.owner_name} ({b.total_amount.toLocaleString('vi-VN')} Ä‘)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
              Cáº¥p Äá»™ Giá»ng Äiá»‡u (Tone)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setToneOverride('LEVEL_1_GENTLE')}
                className={`py-1.5 px-2 text-[10px] font-bold border text-center transition-all ${
                  detectedLevel === 'LEVEL_1_GENTLE'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                    : 'bg-[#161D26] border-[#2A3441] text-gray-400 hover:text-white'
                }`}
              >
                Má»©c 1 (1-5 ngÃ y)
              </button>
              <button
                type="button"
                onClick={() => setToneOverride('LEVEL_2_STANDARD')}
                className={`py-1.5 px-2 text-[10px] font-bold border text-center transition-all ${
                  detectedLevel === 'LEVEL_2_STANDARD'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-[#161D26] border-[#2A3441] text-gray-400 hover:text-white'
                }`}
              >
                Má»©c 2 (6-15 ngÃ y)
              </button>
              <button
                type="button"
                onClick={() => setToneOverride('LEVEL_3_STRICT')}
                className={`py-1.5 px-2 text-[10px] font-bold border text-center transition-all ${
                  detectedLevel === 'LEVEL_3_STRICT'
                    ? 'bg-red-950 text-red-300 border-red-500'
                    : 'bg-[#161D26] border-[#2A3441] text-gray-400 hover:text-white'
                }`}
              >
                Má»©c 3 (&gt;15 ngÃ y)
              </button>
            </div>
          </div>
        </div>

        {/* Current Tone Badge Info */}
        <div className="flex items-center justify-between p-2.5 bg-[#141B24] border border-[#253042] text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-400">Tráº¡ng ThÃ¡i:</span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
              detectedLevel === 'LEVEL_3_STRICT'
                ? 'bg-red-950 text-red-400 border border-red-500'
                : detectedLevel === 'LEVEL_2_STANDARD'
                ? 'bg-amber-950 text-amber-400 border border-amber-500'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-500'
            }`}>
              {levelName || detectedLevel}
            </span>
          </div>
          <div className="text-gray-400 font-mono text-[11px]">
            QuÃ¡ háº¡n thá»±c táº¿: <strong className="text-white">{overdueDays} ngÃ y</strong>
          </div>
        </div>

        {/* Editor Area */}
        {isLoading ? (
          <div className="p-10 text-center bg-[#131922] border border-[#222B35]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#C5A880] mx-auto mb-2" />
            <p className="text-xs text-gray-400">AI Ä‘ang phÃ¢n tÃ­ch há»£p Ä‘á»“ng & soáº¡n tháº£o ná»™i dung vÄƒn báº£n...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                TiÃªu Äá» ThÃ´ng BÃ¡o:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#141B24] border border-[#2A3441] px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-400 mb-1">
                Ná»™i Dung Soáº¡n Tháº£o (Ban Quáº£n LÃ½ cÃ³ thá»ƒ sá»­a trá»±c tiáº¿p):
              </label>
              <textarea
                rows={9}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full bg-[#141B24] border border-[#2A3441] p-3 text-xs text-gray-200 leading-relaxed font-sans focus:outline-none focus:border-[#C5A880] resize-y"
              />
            </div>
          </div>
        )}

        {/* Compliance Guard Alert */}
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-amber-300/90">
            <strong>NguyÃªn táº¯c báº£o vá»‡ cÆ° dÃ¢n:</strong> Há»‡ thá»‘ng AI khÃ´ng bao giá» tá»± Ä‘á»™ng gá»­i thÃ´ng bÃ¡o nháº¯c ná»£. Ban Quáº£n LÃ½ cÃ³ toÃ n quyá»n duyá»‡t, tinh chá»‰nh tá»« ngá»¯ vÃ  chá»‹u trÃ¡ch nhiá»‡m trÆ°á»›c khi nháº¥n nÃºt phÃ¡t hÃ nh vÄƒn báº£n.
          </div>
        </div>

        {/* Status Msg */}
        {statusMsg && (
          <div className={`p-3 text-xs flex items-center gap-2 ${
            statusMsg.type === 'error'
              ? 'bg-red-950/60 border border-red-500 text-red-300'
              : 'bg-emerald-950/60 border border-emerald-500 text-emerald-300'
          }`}>
            {statusMsg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Actions Footer */}
        <div className="pt-3 border-t border-[#222B35] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#2D3A4D] hover:border-gray-500 text-gray-300 text-xs font-semibold"
          >
            Há»§y Bá»
          </button>

          <button
            type="button"
            onClick={handleSendReminder}
            disabled={isSending || isLoading || !bodyText.trim()}
            className="px-6 py-2 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Äang Gá»­i...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Duyá»‡t & Gá»­i Nháº¯c Ná»£</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

