import { useTranslation } from 'react-i18next';

import { SPECIMENS, type PracticeMode } from './modeSpecimens';

export function ModeList({ heading, modes }: { heading: string; modes: readonly PracticeMode[] }) {
  const { t } = useTranslation();
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">{heading}</h3>
      <dl className="divide-y border-y">
        {modes.map((m) => (
          <div
            key={m}
            className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <div>
              <dt className="font-medium">{t(`landing.modes.${m}.name`)}</dt>
              <dd className="text-sm text-muted-foreground">{t(`landing.modes.${m}.desc`)}</dd>
            </div>
            <dd lang="hr" className="font-display text-xl sm:justify-self-end sm:text-right">
              {SPECIMENS[m]}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
