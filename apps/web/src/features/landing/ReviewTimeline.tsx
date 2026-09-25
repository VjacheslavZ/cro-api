import { useTranslation } from 'react-i18next';

/** FSRS-style review intervals, plotted on a log scale so the growth is visible. */
const REVIEW_DAYS = [1, 3, 7, 16, 35, 90];

export function ReviewTimeline() {
  const { t } = useTranslation();
  const width = 600;
  const pad = 40;
  const scale = (d: number) => pad + ((width - pad * 2) * Math.log(d)) / Math.log(REVIEW_DAYS[5]);
  return (
    <svg
      viewBox={`0 0 ${width} 64`}
      role="img"
      aria-label={t('landing.revision.timelineLabel')}
      className="w-full max-w-2xl overflow-visible"
    >
      <line x1={pad} x2={width - pad} y1={24} y2={24} className="stroke-border" strokeWidth={2} />
      {REVIEW_DAYS.map((d, i) => (
        <g key={d} transform={`translate(${scale(d)} 0)`}>
          <circle
            cy={24}
            r={7}
            className={i === 0 ? 'fill-primary' : 'fill-background stroke-primary'}
            strokeWidth={2}
          />
          <text y={56} textAnchor="middle" className="fill-muted-foreground font-sans text-[15px]">
            {d < 60
              ? t('landing.revision.days', { count: d })
              : t('landing.revision.months', { count: 3 })}
          </text>
        </g>
      ))}
    </svg>
  );
}
