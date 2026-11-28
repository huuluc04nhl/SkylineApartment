import fs from 'fs';
import path from 'path';

const TARGET_DIRS = ['app', 'components', 'lib', 'docs', 'tests', 'supabase'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css', '.json', '.md', '.sql']);
const MOJIBAKE_RE = /[ÃÂÄÅÆ][\u0080-\u00BF]|á»|áº|Ä‘|â€/;

const errors = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      checkFile(full);
    }
  }
}

function checkFile(filePath) {
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const raw = fs.readFileSync(filePath);
  if (raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    errors.push(`${rel}: chứa UTF-8 BOM`);
  }
  const text = raw.toString('utf8');
  if (text.includes('\uFFFD')) {
    errors.push(`${rel}: chứa ký tự thay thế U+FFFD ()`);
  }
  // Bỏ qua docs/KIEM-THU.md hoặc file mô tả regex nếu cần, nhưng ở đây kiểm tra toàn bộ
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (MOJIBAKE_RE.test(lines[i])) {
      errors.push(`${rel}:${i + 1}: phát hiện chuỗi nghi ngờ mojibake -> ${lines[i].trim().slice(0, 80)}`);
      break;
    }
  }
}

for (const d of TARGET_DIRS) {
  walk(path.resolve(process.cwd(), d));
}

if (errors.length > 0) {
  console.error('❌ Kiểm tra mã hóa thất bại:');
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}

console.log('✅ check:encoding PASS — không phát hiện BOM, U+FFFD hay mojibake.');
