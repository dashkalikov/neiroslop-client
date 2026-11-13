import { useLanguage } from '../LanguageContext.jsx';
import { formatCoins } from '../data/games.js';

export default function PaylinePicker({ lines, wins, rows, selected, onSelect, multiplier }) {
  const { t } = useLanguage();
  const awards = new Map(wins.map(win => [win.index, win.payout * multiplier]));

  return <div className="payline-picker" role="group" aria-label={t("Inspect paylines")}>
    {lines.map(({ index, cells }) => {
      const award = awards.get(index);
      const rowNumbers = cells.map(([, row]) => row + 1).join(', ');
      return <button key={index} type="button"
        aria-label={t('Line {0}, rows {1}{2}', index + 1, rowNumbers, award ? t(', win {0} coins', formatCoins(award)) : '')}
        aria-pressed={selected === index}
        onClick={() => onSelect(selected === index ? null : index)}>
        <span className="payline-thumbnail" style={{ '--map-rows': rows }} aria-hidden="true">
          {cells.map(([column, row]) => <i key={column} style={{ gridColumn: column + 1, gridRow: row + 1 }}/>)}
        </span>
        <span>{index + 1}{award ? <b> +{formatCoins(award)}</b> : null}</span>
      </button>;
    })}
  </div>;
}
