'use client';

import React, { useState } from 'react';
import { Sparkles, Send, X, Table, ShieldCheck, RefreshCw, HelpCircle, FileText } from 'lucide-react';

interface BillingAiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BillingAiReportModal({ isOpen, onClose }: BillingAiReportModalProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [reportResult, setReportResult] = useState<{
    tool_called: string;
    answer: string;
    table?: {
      headers: string[];
      rows: (string | number)[][];
    };
    ai_disclaimer?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunQuery = async (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q) return;

    if (customQuery) setQuery(customQuery);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/billing/admin-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo báo cáo cho câu hỏi này');
      }

      setReportResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Công nợ BS-08 tháng này?',
    'Top 5 căn nợ lâu nhất?',
    'Tỷ lệ thu hồi toàn dự án BS-07 đến BS-10?',
    'Công nợ tòa BS-07?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0E131B] border border-[#C5A880]/60 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-gray-200 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222B35] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#C5A880]/10 border border-[#C5A880]/40 text-[#C5A880]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-serif uppercase tracking-wide">
                Trợ Lý Báo Cáo Tài Chính BQL (AI SQL & Function Calling)
              </h2>
              <p className="text-xs text-gray-400">
                Hỏi đáp tự nhiên về công nợ, doanh thu từng tòa BS-07...BS-10, căn nợ lâu nhất bằng tiếng Việt
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

        {/* Suggestion Pills */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-[#C5A880]" />
            <span>Gợi Ý Câu Hỏi Mẫu Cho Ban Quản Lý:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleRunQuery(q)}
                className="px-2.5 py-1 text-xs bg-[#151D28] hover:bg-[#1E2938] border border-[#2D3A4D] hover:border-[#C5A880] text-gray-300 hover:text-[#C5A880] transition-all text-left"
              >
                💡 {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
            placeholder="Nhập câu hỏi, ví dụ: 'Công nợ BS-08 tháng này?' hoặc 'Top 10 căn nợ lâu nhất?'..."
            className="flex-1 bg-[#141B24] border border-[#2A3441] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A880]"
          />
          <button
            type="button"
            onClick={() => handleRunQuery()}
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 bg-[#C5A880] hover:bg-white text-[#0D1117] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Truy Vấn</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center bg-[#131922] border border-[#222B35] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#C5A880] mx-auto" />
            <p className="text-xs text-gray-300">
              AI đang gọi hàm truy vấn cơ sở dữ liệu sổ cái và tính toán số liệu thống kê...
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-500 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Result View */}
        {reportResult && !isLoading && (
          <div className="p-4 bg-[#141B24] border border-[#253042] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222B35] pb-2 text-[10px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5 text-[#C5A880] font-bold uppercase">
                <FileText className="w-3.5 h-3.5" /> Báo Cáo Số Liệu Tự Động
              </span>
              <span className="px-2 py-0.5 bg-[#1C2533] border border-[#2D3A4D] text-gray-300">
                Hàm Gọi: {reportResult.tool_called}
              </span>
            </div>

            {/* Markdown Text */}
            <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">
              {reportResult.answer}
            </div>

            {/* Table View */}
            {reportResult.table && (
              <div className="mt-3 overflow-x-auto border border-[#222B35]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0D1117] text-[#C5A880] uppercase font-mono text-[10px] border-b border-[#222B35]">
                    <tr>
                      {reportResult.table.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2.5 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937] font-mono">
                    {reportResult.table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#1A2330] transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-gray-300">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-2 border-t border-[#222B35] flex items-center justify-between text-[10px] text-gray-400">
              <span className="italic">
                {reportResult.ai_disclaimer || 'Nội dung do AI tạo, vui lòng đối chiếu hóa đơn gốc.'}
              </span>
              <span className="font-semibold text-emerald-400">
                ✓ Đã che CCCD/SĐT cư dân
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#222B35] flex items-center justify-between text-[11px] text-gray-500">
          <span>
            Bảo mật: Không đưa thông tin nhạy cảm vào prompt. Số tiền do code tính toán chính xác.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[#2D3A4D] hover:border-gray-500 text-gray-300 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
