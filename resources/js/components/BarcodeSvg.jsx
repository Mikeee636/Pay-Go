import React from 'react';

/**
 * Clean Square QR Code Tag Component
 * Exactly matches the requested visual layout:
 * - Large crisp QR Code
 * - Monospace Code Number label (e.g. 8991001)
 * - Dark Green Product Name label (e.g. Kopi Susu Gula Aren 250ml)
 */
export function BarcodeSvg({ code, name = '', height = 220, showLabel = true, className = '' }) {
  if (!code) return null;

  const codeStr = String(code).trim();
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(codeStr)}&margin=1`;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-md ${className}`} style={{ minWidth: '220px' }}>
      {/* High-Contrast Square QR Code Image */}
      <div className="bg-white p-2 flex items-center justify-center">
        <img
          src={qrApiUrl}
          alt={`QR-${codeStr}`}
          crossOrigin="anonymous"
          style={{ width: `${height}px`, height: `${height}px`, objectFit: 'contain' }}
        />
      </div>

      {showLabel && (
        <div className="mt-3 flex flex-col items-center text-center" style={{ gap: '4px' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', letterSpacing: '1.5px' }}>
            {codeStr}
          </span>
          {name && (
            <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#003333', marginTop: '2px' }}>
              {name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default BarcodeSvg;
