import React from 'react';
import { HardDrive, ExternalLink } from 'lucide-react';

export default function PinataBadge({ cid, className = '', label = 'Pinata IPFS' }) {
  if (!cid) return null;

  const isMock = cid.includes('Mock') || cid.includes('mock');
  const gatewayUrl = isMock ? '#' : `https://gateway.pinata.cloud/ipfs/${cid}`;
  const truncatedCid = cid.length > 20 ? `${cid.substring(0, 10)}...${cid.substring(cid.length - 8)}` : cid;

  return (
    <div className={`inline-flex items-center space-x-1.5 bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-700 ${className}`}>
      <HardDrive className={`w-3.5 h-3.5 ${isMock ? 'text-amber-500' : 'text-emerald-600'}`} />
      <span className="font-semibold text-slate-800">{label}:</span>
      {isMock ? (
        <span className="font-mono text-[11px] text-amber-700">{truncatedCid} (Simulated)</span>
      ) : (
        <a
          href={gatewayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 font-mono text-[11px] text-clinical-800 hover:text-clinical-900 underline hover:no-underline font-medium"
          title={`View image on Pinata IPFS Gateway: ${cid}`}
        >
          <span>{truncatedCid}</span>
          <ExternalLink className="w-3 h-3 text-slate-400 inline" />
        </a>
      )}
    </div>
  );
}
