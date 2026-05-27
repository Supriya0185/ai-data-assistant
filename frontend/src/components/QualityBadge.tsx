import React from 'react';

interface Props {
  score: number;
  showLabel?: boolean;
}

export const QualityBadge: React.FC<Props> = ({ score, showLabel = true }) => {
  const isHigh = score >= 80;
  const isMid = score >= 60;

  const config = isHigh
    ? {
        bar: 'bg-emerald-500',
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
        label: 'Excellent',
      }
    : isMid
    ? {
        bar: 'bg-amber-400',
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-400',
        label: 'Fair',
      }
    : {
        bar: 'bg-red-400',
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-400',
        label: 'Poor',
      };

  if (!showLabel) {
    // Compact variant: small colored progress bar
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${config.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${config.text}`}>{score}%</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-semibold ${config.text}`}>
          Quality: {score}/100
        </span>
        <span className={`text-xs ${config.text} opacity-70`}>· {config.label}</span>
      </div>
      {/* Mini bar */}
      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${config.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
