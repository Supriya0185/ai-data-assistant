import React from 'react';

interface Props {
  score: number;
  showLabel?: boolean;
}

export const QualityBadge: React.FC<Props> = ({ score, showLabel = true }) => {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700 border-green-200'
      : score >= 60
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-red-100 text-red-700 border-red-200';

  const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${color}`}
    >
      {emoji}
      {showLabel ? `Quality: ${score}/100` : `${score}/100`}
    </span>
  );
};
