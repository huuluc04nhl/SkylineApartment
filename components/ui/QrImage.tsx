'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

interface QrImageProps {
  value: string;
  size?: number;
  alt?: string;
  className?: string;
}

export default function QrImage({
  value,
  size = 140,
  alt = 'QR Code',
  className = 'w-28 h-28 object-contain',
}: QrImageProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const trimmed = (value || '').trim();
    if (!trimmed) {
      setDataUrl('');
      setHasError(true);
      return;
    }

    setHasError(false);
    QRCode.toDataURL(trimmed, {
      width: size,
      margin: 1.5,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0D1117',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) {
          setDataUrl('');
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [value, size]);

  if (hasError || !dataUrl) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} bg-[#121820] border border-[#222B35] flex flex-col items-center justify-center text-[#C5A880] gap-1 p-2 text-center`}
      >
        <QrCode className="w-6 h-6 opacity-80" />
        <span className="text-[9px] font-mono text-gray-400">QR</span>
      </div>
    );
  }

  return <img src={dataUrl} alt={alt} className={className} />;
}
