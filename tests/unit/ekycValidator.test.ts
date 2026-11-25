import { describe, it, expect } from 'vitest';
import { parseImageMetadata, validateCccdCard } from '@/lib/ekycValidator';

function makePngHeader(width: number, height: number, totalBytes = 20000): Buffer {
  const buf = Buffer.alloc(totalBytes, 0);
  buf[0] = 0x89;
  buf[1] = 0x50;
  buf[2] = 0x4e;
  buf[3] = 0x47;
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

describe('ekycValidator', () => {
  it('parses PNG dimensions and accepts valid landscape CCCD card (1.58:1)', () => {
    const png = makePngHeader(800, 505, 25000);
    const meta = parseImageMetadata(png);
    expect(meta).toMatchObject({ width: 800, height: 505, format: 'png' });

    const result = validateCccdCard(png, 'FRONT');
    expect(result.valid).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it('rejects portrait or undersized CCCD image', () => {
    const portrait = makePngHeader(400, 700, 25000);
    expect(validateCccdCard(portrait, 'FRONT').valid).toBe(false);

    const tiny = makePngHeader(800, 505, 5000);
    expect(validateCccdCard(tiny, 'BACK').valid).toBe(false);
  });
});
