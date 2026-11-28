'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type Language = 'vi' | 'en';

import keyViLocale from './locales/key-vi.json';
import keyEnLocale from './locales/key-en.json';

// =============================================================================
// CORE KEY DICTIONARY & GLOSSARY (loaded from per-language JSON files)
// =============================================================================
const KEY_VI: Record<string, string> = keyViLocale;
const KEY_EN: Record<string, string> = keyEnLocale;

export const KEY_DICTIONARY: Record<string, Record<Language, string>> = Object.fromEntries(
  Object.keys(KEY_VI).map((key) => [
    key,
    { vi: KEY_VI[key], en: KEY_EN[key] ?? KEY_VI[key] },
  ])
);

// =============================================================================
// FAST LOOKUP MAPS (O(1)) — LOADED ON DEMAND FROM JSON LOCALES
// =============================================================================
const VI_TO_EN_MAP = new Map<string, string>();
const EN_TO_VI_MAP = new Map<string, string>();
const loadedLocales = new Set<Language>();
const loadingLocales = new Map<Language, Promise<void>>();

function indexLocaleMap(dict: Record<string, string>, targetMap: Map<string, string>) {
  for (const [k, v] of Object.entries(dict)) {
    const cleanK = k.trim();
    const cleanV = v.trim();
    if (!cleanK || !cleanV) continue;
    targetMap.set(cleanK.toLowerCase(), cleanV);
    if (cleanK.includes('&amp;')) {
      targetMap.set(cleanK.replace(/&amp;/g, '&').toLowerCase(), cleanV.replace(/&amp;/g, '&'));
    }
    if (cleanK.includes('&') && !cleanK.includes('&amp;')) {
      targetMap.set(cleanK.replace(/&/g, '&amp;').toLowerCase(), cleanV.replace(/&/g, '&amp;'));
    }
  }
}

export async function loadLocaleDictionary(lang: Language): Promise<void> {
  if (loadedLocales.has(lang)) return;
  const inflight = loadingLocales.get(lang);
  if (inflight) return inflight;

  const task = (async () => {
    try {
      if (lang === 'en') {
        const mod = await import('./locales/en.json');
        indexLocaleMap((mod.default || mod) as Record<string, string>, VI_TO_EN_MAP);
      } else {
        const mod = await import('./locales/vi.json');
        indexLocaleMap((mod.default || mod) as Record<string, string>, EN_TO_VI_MAP);
      }
      loadedLocales.add(lang);
    } finally {
      loadingLocales.delete(lang);
    }
  })();

  loadingLocales.set(lang, task);
  return task;
}

// Index KEY_DICTIONARY into lookup maps with highest priority
for (const [key, obj] of Object.entries(KEY_DICTIONARY)) {
  const cleanVi = obj.vi?.trim();
  const cleanEn = obj.en?.trim();
  if (cleanVi && cleanEn) {
    VI_TO_EN_MAP.set(cleanVi.toLowerCase(), cleanEn);
    EN_TO_VI_MAP.set(cleanEn.toLowerCase(), cleanVi);
    VI_TO_EN_MAP.set(key.toLowerCase(), cleanEn);
    EN_TO_VI_MAP.set(key.toLowerCase(), cleanVi);
    if (cleanVi.includes('&amp;')) {
      VI_TO_EN_MAP.set(cleanVi.replace(/&amp;/g, '&').toLowerCase(), cleanEn.replace(/&amp;/g, '&'));
      EN_TO_VI_MAP.set(cleanEn.replace(/&amp;/g, '&').toLowerCase(), cleanVi.replace(/&amp;/g, '&'));
    }
    if (cleanVi.includes('&') && !cleanVi.includes('&amp;')) {
      VI_TO_EN_MAP.set(cleanVi.replace(/&/g, '&amp;').toLowerCase(), cleanEn.replace(/&/g, '&amp;'));
      EN_TO_VI_MAP.set(cleanEn.replace(/&/g, '&amp;').toLowerCase(), cleanVi.replace(/&/g, '&amp;'));
    }
  }
}

// =============================================================================
// SAFE WHITESPACE & CHARACTER PRESERVATION HELPER
// =============================================================================
function preserveWhitespace(original: string, translated: string): string {
  if (!original) return translated;
  const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return translated;
  return match[1] + translated + match[3];
}

// =============================================================================
// STRUCTURAL & PATTERN TRANSLATION ENGINE
// =============================================================================
export function translateString(text: string, targetLang: Language): string {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  const lower = trimmed.toLowerCase();

  // 1. Direct O(1) Dictionary Lookup
  if (targetLang === 'en' && VI_TO_EN_MAP.has(lower)) {
    const translated = VI_TO_EN_MAP.get(lower)!;
    return preserveWhitespace(text, matchCase(trimmed, translated));
  }
  if (targetLang === 'vi' && EN_TO_VI_MAP.has(lower)) {
    const translated = EN_TO_VI_MAP.get(lower)!;
    return preserveWhitespace(text, matchCase(trimmed, translated));
  }

  // 1b. Multi-part Delimiters: " • ", " | ", " - ", " & ", " &amp; ", " và ", "\n"
  for (const sep of [' • ', ' | ', ' - ', ' & ', ' &amp; ', ' và ', '\n']) {
    if (trimmed.includes(sep)) {
      const parts = trimmed.split(sep);
      let changed = false;
      const translatedParts = parts.map(p => {
        const trans = translateString(p, targetLang);
        if (trans !== p) changed = true;
        return trans;
      });
      // CRITICAL: Prevent hybrid half-Vietnamese half-English outputs
      const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const hasRemainingVn = targetLang === 'en' && translatedParts.some(p => vnCharRegex.test(p));
      if (changed && !hasRemainingVn) {
        return preserveWhitespace(text, translatedParts.join(sep));
      }
    }
  }

  // 1c. Multi-Sentence Paragraphs (period + space)
  if (trimmed.includes('. ') && !trimmed.match(/^\d+\.\s/)) {
    const sentences = trimmed.split(/(?<=\.)\s+/);
    if (sentences.length > 1) {
      let anyChanged = false;
      const transSentences = sentences.map(s => {
        const trans = translateString(s, targetLang);
        if (trans !== s) anyChanged = true;
        return trans;
      });
      const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const hasRemainingVn = targetLang === 'en' && transSentences.some(s => vnCharRegex.test(s));
      if (anyChanged && !hasRemainingVn) {
        return preserveWhitespace(text, transSentences.join(' '));
      }
    }
  }

  // 2. Structural Patterns
  // Quotes: "...", '...'
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const q = trimmed[0];
    const inner = trimmed.slice(1, -1);
    const trans = translateString(inner, targetLang);
    return preserveWhitespace(text, `${q}${trans}${q}`);
  }

  // Bullets, emojis & List markers: "* ", "- ", "+ ", "• ", "🟢 ", "🟡 ", "⚪ ", "🔴 "
  for (const b of ['* ', '- ', '+ ', '• ', '🟢 ', '🟡 ', '⚪ ', '🔴 ', '🔵 ', '✨ ', '🏛️ ', '🗑️ ', '💳 ', '📜 ']) {
    if (trimmed.startsWith(b)) {
      const inner = trimmed.slice(b.length);
      const trans = translateString(inner, targetLang);
      return preserveWhitespace(text, `${b}${trans}`);
    }
  }

  // Universal trailing parentheses: "Unit CH-06 (Chủ Hộ)", "Căn CH-06 (Chủ Hộ)", "Nguyễn Văn A (Chủ Hộ)", "Có Sẵn (3)", "Hồ Bơi (Miễn phí)"
  const trailingParen = trimmed.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (trailingParen && !trimmed.startsWith('(')) {
    const mainPhrase = trailingParen[1].trim();
    const parenContent = trailingParen[2].trim();
    if (mainPhrase.length > 0 && parenContent.length > 0) {
      const transMain = translateString(mainPhrase, targetLang);
      const transParen = translateString(parenContent, targetLang);
      if (transMain !== mainPhrase || transParen !== parenContent) {
        return preserveWhitespace(text, `${transMain} (${transParen})`);
      }
    }
  }

  // Numbered prefixes: "1. ", "2. ", "10) "
  const numPrefix = trimmed.match(/^(\d+[\.\)]\s*)(.*)$/);
  if (numPrefix) {
    const prefix = numPrefix[1];
    const rest = numPrefix[2];
    const trans = translateString(rest, targetLang);
    return preserveWhitespace(text, `${prefix}${trans}`);
  }

  // Parentheses: "(Chính thức)", "(Chưa có)", "(Chủ Hộ)"
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(1, -1).trim();
    const parenMap: Record<string, string> = {
      'chủ hộ': 'Owner',
      'người nhà': 'Family Member',
      'khách thuê': 'Family Member',
      'cư dân': 'Resident',
      'ban quản lý': 'Management Board',
      'kỹ thuật viên': 'Technician',
      'chính thức': 'Official',
      'tạm thời': 'Temporary',
      'chưa có': 'None',
      'đang ở': 'Occupied',
      'đã ở': 'Occupied',
      'căn trống': 'Vacant'
    };
    if (targetLang === 'en' && parenMap[inner.toLowerCase()]) {
      return preserveWhitespace(text, `(${parenMap[inner.toLowerCase()]})`);
    }
    const trans = translateString(inner, targetLang);
    return preserveWhitespace(text, `(${trans})`);
  }

  // Time slot: "06:00 - 08:00 (Sáng sớm bình minh)"
  const timeSlot = trimmed.match(/^(\d{2}:\d{2}\s*-\s*\d{2}:\d{2})\s*\((.*)\)$/);
  if (timeSlot) {
    const timeRange = timeSlot[1];
    const desc = translateString(timeSlot[2], targetLang);
    return preserveWhitespace(text, `${timeRange} (${desc})`);
  }

  // Duration: "1 Giờ (Gặp nhanh)", "24 Giờ (Cả ngày)"
  const duration = trimmed.match(/^(\d+)\s*Giờ\s*\((.*)\)$/i);
  if (duration && targetLang === 'en') {
    const hours = duration[1];
    const desc = translateString(duration[2], targetLang);
    return preserveWhitespace(text, `${hours} ${parseInt(hours) === 1 ? 'Hour' : 'Hours'} (${desc})`);
  }

  // Key-Value with colon: "Trạng thái: Đang xử lý"
  if (trimmed.includes(':') && !trimmed.includes('http') && !trimmed.match(/\d{2}:\d{2}/)) {
    const idx = trimmed.indexOf(':');
    const label = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (label.length > 0) {
      const transLabel = translateString(label, targetLang);
      const transVal = val.length > 0 ? translateString(val, targetLang) : '';
      const combined = val.length > 0 ? `${transLabel}: ${transVal}` : `${transLabel}:`;
      return preserveWhitespace(text, combined);
    }
  }

  // 3. Domain Templates (EN)
  if (targetLang === 'en') {
    // Apartments: "Căn BS-07", "Căn hộ BS-07.08", "Căn CH-06 (Chủ Hộ)"
    let m = trimmed.match(/^(?:Căn hộ|Căn)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Apartment ${code}${rest}`.trim());
    }

    m = trimmed.match(/^(?:Chủ Hộ Căn|Chủ Hộ)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Apartment Owner ${code}${rest}`.trim());
    }

    m = trimmed.match(/^(?:Người Nhà Căn)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Family Member ${code}${rest}`.trim());
    }

    m = trimmed.match(/^(?:Khách Thuê Căn)\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]{1,3}-\d+/i.test(m[1]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Family Member ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tòa\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-D]$/i.test(m[1]) || /^(?:The\s+Tropical|Tropical|Sapphire|Diamond|Ruby)$/i.test(m[1] + m[2]))) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Tower ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tầng\s+(\d+|[A-Z0-9]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^(?:G|B1|B2|B3|M|L)$/i.test(m[1]))) {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Floor ${fl}${rest}`.trim());
    }

    m = trimmed.match(/^Phòng\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && /\d/.test(m[1])) {
      const room = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Room ${room}${rest}`.trim());
    }

    m = trimmed.match(/^Khu\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/^[A-Z0-9]$/i.test(m[1]) || /^\d+$/.test(m[1]))) {
      const zone = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Zone ${zone}${rest}`.trim());
    }

    m = trimmed.match(/^Ô\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m && (/\d/.test(m[1]) || /^[A-Z]-\d+/i.test(m[1]))) {
      const slot = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Slot ${slot}${rest}`.trim());
    }

    // Relative Time Templates
    m = trimmed.match(/^(\d+)\s+ngày trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'day ago' : 'days ago'}`);

    m = trimmed.match(/^(\d+)\s+giờ trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'hour ago' : 'hours ago'}`);

    m = trimmed.match(/^(\d+)\s+phút trước$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'minute ago' : 'minutes ago'}`);

    // Counters: "2 người", "4 phòng ngủ", "2 phòng tắm"
    m = trimmed.match(/^(\d+)\s+người$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'person' : 'people'}`);

    m = trimmed.match(/^(\d+)\s+phòng ngủ$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'bedroom' : 'bedrooms'}`);

    m = trimmed.match(/^(\d+)\s+phòng tắm$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ${parseInt(m[1]) === 1 ? 'bathroom' : 'bathrooms'}`);

    // Status chips with counter: "Tất cả (12)", "Đang xử lý (3)"
    m = trimmed.match(/^([^\(\)]+)\s*\(([0-9]+)\)$/);
    if (m) {
      const base = translateString(m[1].trim(), 'en');
      return preserveWhitespace(text, `${base} (${m[2]})`);
    }

    // AI Auto Dispatch reasoning: "AI chọn Lê Quốc Tuấn: Đúng chuyên môn..."
    m = trimmed.match(/^AI chọn\s+([^:]+):\s*(.*)$/i);
    if (m) {
      const techName = m[1].trim();
      const reasonRest = translateString(m[2].trim(), 'en');
      return preserveWhitespace(text, `AI selected ${techName}: ${reasonRest}`);
    }

    // Dynamic pattern for floor occupancy: "ĐÃ Ở: 3/21", "Ở: 3/21 CĂN", "Ở: 3/21"
    m = trimmed.match(/^(?:ĐÃ Ở|Ở):\s*(\d+\/\d+)(?:\s*CĂN)?$/i);
    if (m) {
      return preserveWhitespace(text, targetLang === 'en' ? `OCCUPIED: ${m[1]}` : `ĐÃ Ở: ${m[1]}`);
    }

    // Dynamic pattern for "Mặt Bằng Tầng 30" -> "Floor 30 Floorplan"
    m = trimmed.match(/^Mặt Bằng Tầng\s+(\d+|[A-Z0-9]+)(.*)$/i);
    if (m && targetLang === 'en') {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2].trim(), 'en') : '';
      return preserveWhitespace(text, `Floor ${fl} Floorplan${rest}`.trim());
    }

    // Dynamic pattern for "LÕI THANG MÁY & SẢNH CHỜ TẦNG 30"
    m = trimmed.match(/^LÕI THANG MÁY & SẢNH CHỜ TẦNG\s+(\d+|[A-Z0-9]+)$/i);
    if (m && targetLang === 'en') {
      return preserveWhitespace(text, `ELEVATOR CORE & FLOOR ${m[1]} LOBBY`);
    }

    // Dynamic pattern for "CHI TIẾT MỞ RỘNG • TẦNG 30"
    m = trimmed.match(/^CHI TIẾT MỞ RỘNG • TẦNG\s+(\d+|[A-Z0-9]+)$/i);
    if (m && targetLang === 'en') {
      return preserveWhitespace(text, `EXPANDED DETAILS • FLOOR ${m[1]}`);
    }

    // Dynamic pattern for "XEM NHANH: TẦNG X (...)"
    m = trimmed.match(/^XEM NHANH:\s*TẦNG\s+(\d+)\s*\((.*)\)$/i);
    if (m && targetLang === 'en') {
      const desc = translateString(m[2], 'en');
      return preserveWhitespace(text, `QUICK VIEW: FLOOR ${m[1]} (${desc})`);
    }

    // Common prefixes: "Danh sách...", "Lịch sử...", "Chi tiết...", "Quản lý..."
    const prefixMap: Array<[string, string]> = [
      ['Danh sách', 'List of'],
      ['Lịch sử', 'History of'],
      ['Chi tiết', 'Details of'],
      ['Quản lý', 'Management of'],
      ['Thông tin', 'Information of'],
      ['Không có', 'No'],
      ['Chưa có', 'No']
    ];
    for (const [pVi, pEn] of prefixMap) {
      if (trimmed.startsWith(pVi + ' ')) {
        const rest = trimmed.slice(pVi.length + 1).trim();
        const transRest = translateString(rest, 'en');
        const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        if (transRest !== rest && !vnCharRegex.test(transRest)) {
          return preserveWhitespace(text, `${pEn} ${transRest}`);
        }
      }
    }

    // Currencies: "1.500.000 đ" -> "1,500,000 VND"
    m = trimmed.match(/^([0-9\.,]+)\s*(đ|VNĐ|vnd)$/i);
    if (m) {
      return preserveWhitespace(text, `${m[1]} VND`);
    }

    // Prices in Billion: "2.31 Tỷ", "Từ 3.2 Tỷ"
    m = trimmed.match(/^(Từ\s+)?([0-9\.,]+)\s*Tỷ$/i);
    if (m) {
      const prefix = m[1] ? 'From ' : '';
      return preserveWhitespace(text, `${prefix}${m[2]} Billion VND`);
    }

    // Price per m²: "~ 55.0 tr/m²", "55.0 tr/m²"
    m = trimmed.match(/^([~≈]\s*)?([0-9\.,]+)\s*tr\/m²$/i);
    if (m) {
      const prefix = m[1] || '';
      return preserveWhitespace(text, `${prefix}${m[2]}M VND/m²`);
    }

    // Unit Areas: "54.8 m² tim tường", "Tim tường: 54.8 m²"
    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*tim tường$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² Gross Built Area`);

    m = trimmed.match(/^Tim tường:\s*([0-9\.,]+)\s*m²$/i);
    if (m) return preserveWhitespace(text, `Gross Area: ${m[1]} m²`);

    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*thông thủy$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² Net Usable Area`);

    // Management fee: "Phí QL: 12.500 đ/m²"
    m = trimmed.match(/^Phí QL:\s*([0-9\.,]+)\s*(?:đ|VND)\/m²$/i);
    if (m) return preserveWhitespace(text, `Management Fee: ${m[1]} VND/m²`);

    // Room configurations: "1 PN • 1 WC", "2 PN • 1 WC"
    m = trimmed.match(/^(\d+)\s*PN\s*•\s*(\d+)\s*WC$/i);
    if (m) return preserveWhitespace(text, `${m[1]} Bed • ${m[2]} Bath`);

    // Month & Year: "Tháng 08/2026" -> "August 2026"
    m = trimmed.match(/^Tháng\s+(\d{1,2})\/(\d{4})$/i);
    if (m) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIdx = parseInt(m[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return preserveWhitespace(text, `${monthNames[monthIdx]} ${m[2]}`);
      }
      return preserveWhitespace(text, `Month ${m[1]}/${m[2]}`);
    }
  }

  // 4. Reverse Domain Templates (VI)
  if (targetLang === 'vi') {
    // Month & Year: "August 2026" -> "Tháng 08/2026"
    let m = trimmed.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
    if (m) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const monthIdx = monthNames.indexOf(m[1].toLowerCase()) + 1;
      const padMonth = monthIdx < 10 ? `0${monthIdx}` : `${monthIdx}`;
      return preserveWhitespace(text, `Tháng ${padMonth}/${m[2]}`);
    }
    m = trimmed.match(/^Apartment\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Căn hộ ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Tower\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const code = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Tòa ${code}${rest}`.trim());
    }

    m = trimmed.match(/^Floor\s+(\d+)(.*)$/i);
    if (m) {
      const fl = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Tầng ${fl}${rest}`.trim());
    }

    m = trimmed.match(/^Room\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const room = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Phòng ${room}${rest}`.trim());
    }

    m = trimmed.match(/^Zone\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const zone = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Khu ${zone}${rest}`.trim());
    }

    m = trimmed.match(/^Slot\s+([A-Za-z0-9\.\-_]+)(.*)$/i);
    if (m) {
      const slot = m[1];
      const rest = m[2] ? ' ' + translateString(m[2], 'vi') : '';
      return preserveWhitespace(text, `Ô ${slot}${rest}`.trim());
    }

    m = trimmed.match(/^(\d+)\s+days?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} ngày trước`);

    m = trimmed.match(/^(\d+)\s+hours?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} giờ trước`);

    m = trimmed.match(/^(\d+)\s+minutes?\s+ago$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phút trước`);

    m = trimmed.match(/^(\d+)\s+(?:people|person)$/i);
    if (m) return preserveWhitespace(text, `${m[1]} người`);

    m = trimmed.match(/^(\d+)\s+bedrooms?$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phòng ngủ`);

    m = trimmed.match(/^(\d+)\s+bathrooms?$/i);
    if (m) return preserveWhitespace(text, `${m[1]} phòng tắm`);

    // Status chips with counter: "All (12)", "Pending (3)"
    m = trimmed.match(/^([^\(\)]+)\s*\(([0-9]+)\)$/);
    if (m) {
      const base = translateString(m[1].trim(), 'vi');
      return preserveWhitespace(text, `${base} (${m[2]})`);
    }

    const reversePrefixMap: Array<[string, string]> = [
      ['List of', 'Danh sách'],
      ['History of', 'Lịch sử'],
      ['Details of', 'Chi tiết'],
      ['Management of', 'Quản lý'],
      ['Information of', 'Thông tin'],
      ['No', 'Không có']
    ];
    for (const [pEn, pVi] of reversePrefixMap) {
      if (trimmed.startsWith(pEn + ' ')) {
        const rest = trimmed.slice(pEn.length + 1).trim();
        const transRest = translateString(rest, 'vi');
        if (transRest !== rest) {
          return preserveWhitespace(text, `${pVi} ${transRest}`);
        }
      }
    }

    // Reverse Prices in Billion
    m = trimmed.match(/^(From\s+)?([0-9\.,]+)\s*Billion\s*VND$/i);
    if (m) {
      const prefix = m[1] ? 'Từ ' : '';
      return preserveWhitespace(text, `${prefix}${m[2]} Tỷ`);
    }

    // Reverse Price per m²
    m = trimmed.match(/^([~≈]\s*)?([0-9\.,]+)\s*M\s*VND\/m²$/i);
    if (m) {
      const prefix = m[1] || '';
      return preserveWhitespace(text, `${prefix}${m[2]} tr/m²`);
    }

    // Reverse Unit Areas
    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*Gross\s*(?:Built\s*)?Area$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² tim tường`);

    m = trimmed.match(/^Gross\s*Area:\s*([0-9\.,]+)\s*m²$/i);
    if (m) return preserveWhitespace(text, `Tim tường: ${m[1]} m²`);

    m = trimmed.match(/^([0-9\.,]+)\s*m²\s*Net\s*(?:Usable\s*)?Area$/i);
    if (m) return preserveWhitespace(text, `${m[1]} m² thông thủy`);

    // Reverse Management Fee
    m = trimmed.match(/^Management\s*Fee:\s*([0-9\.,]+)\s*VND\/m²$/i);
    if (m) return preserveWhitespace(text, `Phí QL: ${m[1]} đ/m²`);

    // Reverse Room configuration
    m = trimmed.match(/^(\d+)\s*Bed\s*•\s*(\d+)\s*Bath$/i);
    if (m) return preserveWhitespace(text, `${m[1]} PN • ${m[2]} WC`);

    m = trimmed.match(/^([0-9\.,]+)\s*VND$/i);
    if (m) {
      return preserveWhitespace(text, `${m[1]} đ`);
    }
  }

  return text;
}

function matchCase(source: string, target: string): string {
  if (!source || !target) return target;
  if (source === source.toUpperCase() && /[a-zA-ZÀ-ỹ]/.test(source) && source.length > 1) {
    return target.toUpperCase();
  }
  const firstLetterMatch = source.match(/[a-zA-ZÀ-ỹ]/);
  if (firstLetterMatch && firstLetterMatch[0] === firstLetterMatch[0].toUpperCase()) {
    const targetLetterMatch = target.match(/[a-zA-Z]/);
    if (targetLetterMatch && targetLetterMatch.index !== undefined) {
      const idx = targetLetterMatch.index;
      return target.slice(0, idx) + target.charAt(idx).toUpperCase() + target.slice(idx + 1);
    }
  }
  return target;
}

// =============================================================================
// REACT CONTEXT & PROVIDER
// =============================================================================
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyOrText: string, fallback?: string) => string;
  isMounted: boolean;
  isEn: boolean;
  isVi: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getCookieLanguage(): Language {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)skyline_language=([^;]+)/);
    if (match && (match[1] === 'vi' || match[1] === 'en')) {
      return match[1] as Language;
    }
    try {
      const ls = localStorage.getItem('skyline_language');
      if (ls === 'vi' || ls === 'en') {
        document.cookie = 'skyline_language=' + ls + '; path=/; max-age=31536000; SameSite=Lax';
        return ls as Language;
      }
    } catch {}
  }
  return 'vi';
}

function setCookieLanguage(lang: Language) {
  if (typeof document !== 'undefined') {
    document.cookie = 'skyline_language=' + lang + '; path=/; max-age=31536000; SameSite=Lax';
    try {
      localStorage.setItem('skyline_language', lang);
    } catch {}
  }
}

export function LanguageProvider({ 
  children,
  initialLanguage = 'vi',
}: { 
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  // Always initialize with default 'vi' (or server-provided initialLanguage) to ensure
  // SSR HTML matches client initial hydration identically, eliminating React hydration errors.
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [isMounted, setIsMounted] = useState(false);
  const [localeVersion, setLocaleVersion] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    const saved = getCookieLanguage();
    if (saved && saved !== initialLanguage) {
      setLanguageState(saved);
    }
    applyDocumentLang(saved);
  }, [initialLanguage]);

  useEffect(() => {
    let active = true;
    loadLocaleDictionary(language).then(() => {
      if (active) setLocaleVersion((v) => v + 1);
    });
    return () => {
      active = false;
    };
  }, [language]);

  const applyDocumentLang = (lang: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setCookieLanguage(lang);
    applyDocumentLang(lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('skyline_language_changed', { detail: { language: lang } }));
    }
  };

  const toggleLanguage = () => {
    const next = language === 'vi' ? 'en' : 'vi';
    setLanguage(next);
  };

  /**
   * Direct translation helper in React components (Clean, safe i18n architecture)
   */
  const t = (keyOrText: string, fallback?: string): string => {
    if (!keyOrText) return fallback || '';
    const trimmed = keyOrText.trim();

    // 1. Direct key dictionary lookup (e.g. 'nav.dashboard', 'role.admin')
    if (KEY_DICTIONARY[trimmed]) {
      return KEY_DICTIONARY[trimmed][language];
    }
    if (trimmed.includes('&') && KEY_DICTIONARY[trimmed.replace(/&/g, '&amp;')]) {
      return KEY_DICTIONARY[trimmed.replace(/&/g, '&amp;')][language];
    }
    if (trimmed.includes('&amp;') && KEY_DICTIONARY[trimmed.replace(/&amp;/g, '&')]) {
      return KEY_DICTIONARY[trimmed.replace(/&amp;/g, '&')][language];
    }
    if (trimmed.endsWith(':')) {
      const withoutColon = trimmed.slice(0, -1).trim();
      if (KEY_DICTIONARY[withoutColon]) {
        return KEY_DICTIONARY[withoutColon][language] + ':';
      }
    } else if (KEY_DICTIONARY[trimmed + ':']) {
      const withColon = KEY_DICTIONARY[trimmed + ':'][language];
      return withColon.endsWith(':') ? withColon.slice(0, -1).trim() : withColon;
    }

    const vnCharRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

    // 2. Target English
    if (language === 'en') {
      if (fallback && !vnCharRegex.test(fallback) && !fallback.includes('.') && fallback !== trimmed) {
        return fallback;
      }
      const trans = translateString(trimmed, 'en');
      if (trans !== trimmed && !vnCharRegex.test(trans)) return trans;
      if (fallback && fallback !== trimmed) {
        const transFallback = translateString(fallback, 'en');
        if (transFallback !== fallback && !vnCharRegex.test(transFallback)) return transFallback;
      }
      return trans || fallback || keyOrText;
    }

    // 3. Target Vietnamese
    if (fallback && vnCharRegex.test(fallback) && (trimmed.includes('.') || trimmed.includes('_') || /^[a-z]+$/.test(trimmed))) {
      return fallback;
    }
    if (trimmed.includes('.') || trimmed.includes('_') || /^[a-z]+$/.test(trimmed)) {
      return fallback || keyOrText;
    }

    const viTrans = translateString(trimmed, 'vi');
    return viTrans || fallback || keyOrText;
  };

  const value = useMemo(
    () => ({ 
      language, 
      setLanguage, 
      toggleLanguage, 
      t, 
      isMounted,
      isEn: language === 'en',
      isVi: language === 'vi'
    }),
    [language, isMounted, localeVersion]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
