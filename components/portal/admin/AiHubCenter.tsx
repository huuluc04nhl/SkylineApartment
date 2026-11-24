'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/languageContext';
import { 
  Sparkles, 
  Eye, 
  BrainCircuit, 
  Activity, 
  Flame, 
  Car, 
  Bot, 
  MessageSquareQuote, 
  Zap, 
  ShieldCheck, 
  Search, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  RefreshCw,
  Terminal,
  Layers,
  BarChart3,
  Sliders
} from 'lucide-react';

export default function AiHubCenter() {
  const { t, isEn } = useLanguage();
  const [activeAiTab, setActiveAiTab] = useState<'ALL' | 'VISION' | 'NLP' | 'PREDICTIVE' | 'ENERGY'>('ALL');
  const [isSimulatingModel, setIsSimulatingModel] = useState<string | null>(null);
  const [liveLog, setLiveLog] = useState<string[]>([
    '18:14:02 [AI-Vision] Giám sát 24 luồng CCTV Hầm B1 - Độ trễ: 18ms',
    '18:14:15 [AI-Energy] Giám sát công tơ điện nước toàn tòa BS-07 - Hệ số an toàn 99.8%',
    '18:14:28 [Kiểm Soát Xe] Nhận diện xe 51K-889.99 (Độ tin cậy: 99.4%) -> Mở Barrier B1',
    '18:14:40 [Trợ Lý Ảo] Cư dân CH-06 hỏi "Giờ mở hồ bơi" -> Phản hồi 0.12s',
  ]);

  const handleRunSimulation = (modelName: string, resultLog: string) => {
    setIsSimulatingModel(modelName);
    setTimeout(() => {
      setIsSimulatingModel(null);
      setLiveLog(prev => [`${new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN')} [${modelName}] ${resultLog}`, ...prev.slice(0, 7)]);
    }, 1000);
  };

  const aiModules = [
    {
      id: '3.1.7',
      name: 'AI Resident Assistant (RAG Chatbot)',
      category: 'NLP',
      tech: 'LangChain • PhoBERT Embedding • Vector DB',
      accuracy: '98.5%',
      latency: '120ms',
      status: t('Đang hoạt động', 'Online Active'),
      desc: t('Tự động đọc hiểu Sổ tay cư dân SKYLINE, giải đáp 24/7 và chuyển tiếp Lễ tân khi có yêu cầu phức tạp.', 'Auto-comprehends SKYLINE handbook, assists residents 24/7 and escalates complex requests to Concierge.'),
      icon: Bot,
      color: 'text-blue-400',
      action: t('Chạy Test Truy Xuất RAG', 'Test RAG Retrieval'),
      simResult: t('Truy xuất thành công Sổ tay cư dân: "Hồ bơi mở cửa 06:00 - 21:00" (Độ khớp: 99.2%)', 'Successfully retrieved from Handbook: "Pool opens 06:00 - 21:00" (Match: 99.2%)'),
    },
    {
      id: '3.1.8',
      name: 'AI Smart Search (Semantic NLP)',
      category: 'NLP',
      tech: 'Cosine Similarity • Intent Classification',
      accuracy: '97.8%',
      latency: '45ms',
      status: t('Đang hoạt động', 'Online Active'),
      desc: t('Hiểu ngữ nghĩa tự nhiên (VD: "nhà bị rỉ nước" -> tự động trỏ đến tạo Ticket sửa chữa ưu tiên cao).', 'Understands natural intent (e.g. "leaking pipe" -> automatically routes to high-priority maintenance ticket).'),
      icon: Search,
      color: 'text-amber-400',
      action: t('Test Phân Loại Ý Định (Intent)', 'Test Intent Classification'),
      simResult: t('Intent: "REPORT_LEAKAGE" -> Gán Module "resident-tickets" (Độ tin cậy: 98.6%)', 'Intent: "REPORT_LEAKAGE" -> Assigned to "resident-tickets" (Confidence: 98.6%)'),
    },
    {
      id: '3.1.9',
      name: 'AI Maintenance Assistant (Predictive)',
      category: 'PREDICTIVE',
      tech: 'LSTM Autoencoder • FFT Vibration Analysis',
      accuracy: '96.2%',
      latency: '200ms',
      status: t('Đang hoạt động', 'Online Active'),
      desc: t('Chấm điểm sức khỏe thiết bị (Health Score 0-100) và phát hiện rung lắc bạc đạn Thang máy trước khi chết máy.', 'Scores equipment health (0-100) and detects bearing anomalies before elevator shutdown.'),
      icon: Activity,
      color: 'text-emerald-400',
      action: t('Chạy Dự Báo Rung Lắc Thang Máy', 'Run Elevator Vibration Prediction'),
      simResult: t('Thang máy Chung Cư BS-07: Health Score 96.8/100 • Khuyến nghị bảo dưỡng định kỳ sau 20 ngày', 'Elevator BS-07: Health Score 96.8/100 • Preventive maintenance recommended in 20 days'),
    },
    {
      id: '3.1.10',
      name: 'AI Security (FaceID & Vision CCTV)',
      category: 'VISION',
      tech: 'YOLOv8 • InsightFace 512D • Anti-Spoofing',
      accuracy: '99.8%',
      latency: '35ms',
      status: t('Cảnh báo khói Hầm B1', 'Smoke Alert B1'),
      desc: t('Nhận diện khuôn mặt FaceID mở cửa < 0.5s và phân tích camera phát hiện đám cháy, người ngã, xâm nhập trái phép.', 'FaceID authentication in <0.5s and computer vision detection of fire, slip-and-fall, and unauthorized entry.'),
      icon: Eye,
      color: 'text-red-400',
      action: t('Quét Khói Lửa & Liveness FaceID', 'Scan Fire & FaceID Liveness'),
      simResult: t('CCTV Camera B1-04: Phát hiện làn khói mỏng (96.4%) -> Đã gửi chuông báo phòng Bảo vệ', 'CCTV B1-04: Thin smoke detected (96.4%) -> Alert dispatched to Security Command'),
    },
    {
      id: '3.1.11',
      name: 'AI Billing Assistant (Anomaly Audit)',
      category: 'PREDICTIVE',
      tech: 'Isolation Forest • XGBoost Classifier',
      accuracy: '99.1%',
      latency: '80ms',
      status: t('Đang hoạt động', 'Online Active'),
      desc: t('Tự động rà soát toàn bộ công tơ điện nước toàn chung cư, bôi đỏ các căn hộ biến động bất thường (>50%).', 'Audits all utility meters across the building, flagging anomalous spikes (>50%).'),
      icon: Zap,
      color: 'text-yellow-400',
      action: t('Quét Đối Soát Hóa Đơn T08', 'Audit Statements'),
      simResult: t('Đã quét toàn bộ 34 tầng tòa BS-07: Các chỉ số điện nước nằm trong ngưỡng an toàn định mức', 'Scanned all 34 floors of BS-07: All MEP readings within safe operating thresholds'),
    },
    {
      id: '3.1.12',
      name: 'AI Community Assistant (Auto-Moderation)',
      category: 'NLP',
      tech: 'Toxic-Bert • VADER Sentiment Analysis',
      accuracy: '95.4%',
      latency: '60ms',
      status: t('Đang hoạt động', 'Online Active'),
      desc: t('Tự động kiểm duyệt bài viết độc hại trên diễn đàn cư dân và chấm điểm cảm xúc cộng đồng (88% Hài lòng).', 'Auto-moderates community board posts and evaluates overall resident sentiment score (88% Positive).'),
      icon: MessageSquareQuote,
      color: 'text-purple-400',
      action: t('Kiểm Duyệt Nội Dung & Sentiment', 'Audit Content & Sentiment'),
      simResult: t('Đã phân tích 15 bài thảo luận: 88% Tích cực, 08% Trung tính, 04% Góp ý • 0 bài vi phạm quy chuẩn', 'Analyzed 15 forum threads: 88% Positive, 8% Neutral, 4% Feedback • 0 policy violations'),
    },
    {
      id: '3.1.13',
      name: 'AI Strategic Analytics (Optimization)',
      category: 'PREDICTIVE',
      tech: 'Multi-Variate Time Series • Resource Allocator',
      accuracy: '94.0%',
      latency: '300ms',
      status: t('Đang hoạt động', 'Online Active'),
      desc: t('Khai phá dữ liệu tổng thể và xuất khuyến nghị bằng văn bản (VD: Đề xuất mở thêm slot BBQ cuối tuần).', 'Mines operational telemetry and generates advisory reports (e.g. recommend extra weekend BBQ slots).'),
      icon: BarChart3,
      color: 'text-cyan-400',
      action: t('Tạo Khuyến Nghị Vận Hành', 'Generate Operations Advisory'),
      simResult: t('Đề xuất: Nhu cầu Gym tăng 30% vào 18h-20h -> Bật chế độ làm mát tăng cường và thêm HLV ca tối', 'Proposal: Gym traffic +30% at 18:00-20:00 -> Increase cooling capacity and assign evening fitness staff'),
    },
    {
      id: '3.1.14',
      name: 'AI Energy Management (Leakage Detection)',
      category: 'ENERGY',
      tech: 'Night Flow Anomaly Detector • IoT Telemetry',
      accuracy: '98.9%',
      latency: '10ms',
      status: t('Ổn định (Giám sát 24/7)', 'Stable (24/7 Monitored)'),
      desc: t('Giám sát thói quen tiêu thụ điện nước, phát hiện rò rỉ nước ngầm khung giờ 02:00 - 04:00 sáng.', 'Monitors water/power flow patterns, catching subsurface water leaks between 02:00 - 04:00 AM.'),
      icon: Sparkles,
      color: 'text-amber-500',
      action: t('Kiểm Tra Dòng Chảy Ban Đêm', 'Check Night Flow Infiltration'),
      simResult: t('Tòa BS-07: Không phát hiện thất thoát dòng chảy ban đêm. Hệ thống van cấp nước vận hành ổn định.', 'BS-07: Zero nocturnal pipe leakage detected. Solenoid valves operating with nominal pressure.'),
    },
    {
      id: '3.1.15',
      name: t('Hệ Thống Nhận Diện Biển Số Xe Tự Động', 'Automated License Plate Recognition (ALPR)'),
      category: 'VISION',
      tech: t('Camera Cảm Biến Tốc Độ Cao', 'High-speed OCR Sensors'),
      accuracy: '99.4%',
      latency: '25ms',
      status: t('Đang hoạt động', 'Online Active'),
      desc: t('Tự động đọc biển số xe ô tô tốc độ cao, đóng/mở barrier hầm B1 và quản lý sức chứa bãi đỗ thông minh.', 'High-speed license plate OCR, automated B1 barrier trigger, and smart parking capacity management.'),
      icon: Car,
      color: 'text-emerald-500',
      action: t('Quét Biển Số Tự Động Mở Cổng', 'Scan Plate & Open Gate'),
      simResult: t('Camera Hầm B1: Biển số 51K-889.99 hợp lệ -> Lệnh mở Barrier trong 0.28 giây', 'Basement B1: Plate 51K-889.99 authorized -> Barrier open command issued in 0.28s'),
    },
  ];

  const filteredModules = activeAiTab === 'ALL'
    ? aiModules
    : aiModules.filter(m => m.category === activeAiTab);

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222B35] pb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-semibold flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-[#C5A880]" /> {t('Trí Tuệ Nhân Tạo • AI Hub', 'Artificial Intelligence • AI Hub')}
          </div>
          <h2 className="font-serif text-2xl text-white font-bold mt-1">
            {t('Trung Tâm Điều Hành AI', 'AI Command Center')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#161B22] border border-[#2D3748] text-emerald-400 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            9/9 {t('Mô Hình Hoạt Động', 'Active AI Models')}
          </span>
        </div>
      </div>

      {/* Real-time AI Terminal Output Stream */}
      <div className="p-4 bg-[#080B10] border border-[#222B35] space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400 border-b border-[#1A222C] pb-2 font-mono">
          <span className="flex items-center gap-2 text-[#C5A880]">
            <Terminal className="w-4 h-4" /> {t('Nhật Ký Xử Lý AI', 'AI Live Event Stream')}
          </span>
          <span className="text-[10px] text-gray-500">CUDA Cores: Active • TensorRT FP16</span>
        </div>

        <div className="font-mono text-[11px] space-y-1 text-gray-300 max-h-36 overflow-y-auto">
          {liveLog.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-[#C5A880]">❯</span>
              <span className={idx === 0 ? 'text-white font-semibold' : 'text-gray-400'}>{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs by AI Domain */}
      <div className="flex border-b border-[#222B35] gap-2 overflow-x-auto text-xs font-semibold uppercase tracking-wider">
        <button
          onClick={() => setActiveAiTab('ALL')}
          className={`pb-3 px-4 transition-all border-b-2 flex items-center gap-2 ${
            activeAiTab === 'ALL'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" /> {t('Toàn Bộ 9 Module AI', 'All 9 AI Modules')} ({aiModules.length})
        </button>

        <button
          onClick={() => setActiveAiTab('VISION')}
          className={`pb-3 px-4 transition-all border-b-2 flex items-center gap-2 ${
            activeAiTab === 'VISION'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Eye className="w-4 h-4" /> {t('Thị Giác Máy Tính (Vision AI & FaceID)', 'Computer Vision (Vision AI & FaceID)')}
        </button>

        <button
          onClick={() => setActiveAiTab('NLP')}
          className={`pb-3 px-4 transition-all border-b-2 flex items-center gap-2 ${
            activeAiTab === 'NLP'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Bot className="w-4 h-4" /> {t('Xử Lý Ngôn Ngữ Tự Nhiên (NLP & RAG)', 'Natural Language Processing (NLP & RAG)')}
        </button>

        <button
          onClick={() => setActiveAiTab('PREDICTIVE')}
          className={`pb-3 px-4 transition-all border-b-2 flex items-center gap-2 ${
            activeAiTab === 'PREDICTIVE'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Activity className="w-4 h-4" /> {t('Học Máy Dự Báo (Predictive & Anomaly)', 'Predictive ML & Anomaly')}
        </button>

        <button
          onClick={() => setActiveAiTab('ENERGY')}
          className={`pb-3 px-4 transition-all border-b-2 flex items-center gap-2 ${
            activeAiTab === 'ENERGY'
              ? 'border-[#C5A880] text-[#C5A880] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Zap className="w-4 h-4" /> {t('Quản Lý Năng Lượng & Rò Rỉ Nước', 'Energy & Water Leakage')}
        </button>
      </div>

      {/* 9 AI Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((item) => {
          const Icon = item.icon;
          const isRunning = isSimulatingModel === item.name;

          return (
            <div
              key={item.id}
              className="p-5 bg-[#121820] border border-[#222B35] hover:border-[#C5A880]/70 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-[#1C2533] border border-[#C5A880]/50 text-[#C5A880] text-[10px] font-mono font-bold">
                    Module {item.id}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {item.status}
                  </span>
                </div>

                {/* Title */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-[#1C2533] border border-[#2D3748] flex items-center justify-center ${item.color} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white group-hover:text-[#C5A880] transition-colors leading-tight">
                      {item.name}
                    </h3>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[200px]">
                      {item.tech}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  {item.desc}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-[#161B22] p-2.5 border border-[#222B35] text-[11px] font-mono">
                  <div>
                    <span className="text-gray-400">{t('Độ chính xác:', 'Accuracy:')}</span>{' '}
                    <strong className="text-emerald-400">{item.accuracy}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('Độ trễ xử lý:', 'Latency:')}</span>{' '}
                    <strong className="text-cyan-400">{item.latency}</strong>
                  </div>
                </div>
              </div>

              {/* Action Button: Run Simulation */}
              <button
                onClick={() => handleRunSimulation(item.name, item.simResult)}
                disabled={isRunning}
                className="w-full py-2 bg-[#161B22] hover:bg-[#C5A880] text-gray-300 hover:text-[#0D1117] border border-gray-700 hover:border-[#C5A880] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#C5A880] group-hover:text-[#0D1117]" />}
                {isRunning ? t('Đang Chạy Mô Hình AI...', 'Running AI Model...') : item.action}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
