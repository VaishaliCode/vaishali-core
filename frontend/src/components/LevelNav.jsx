// Floating level controls shown on Levels 01–05: Back, Restart, and Next (only after you've been further).
const NAMES = ['Ignition', 'Identity Signal', 'Systems Bay', 'Mission Archive', 'Honors Vault', 'Transmission']
const pad = (n) => String(n).padStart(2, '0')

export default function LevelNav({ level, furthest, onBack, onRestart, onNext }) {
  const canNext = level < furthest
  return (
    <nav className="lvnav" aria-label="Level controls">
      <button type="button" className="lvnav__btn" onClick={onBack}
        title={`Back to Lvl ${pad(level - 1)} — ${NAMES[level - 1]}`} aria-label="Go back one level">
        <b aria-hidden="true">←</b><span>Back</span>
      </button>
      <button type="button" className="lvnav__btn" onClick={onRestart}
        title="Start again from the beginning" aria-label="Restart from the beginning">
        <b aria-hidden="true">↺</b><span>Restart</span>
      </button>
      {canNext && (
        <button type="button" className="lvnav__btn lvnav__btn--next" onClick={onNext}
          title={`Forward to Lvl ${pad(level + 1)} — ${NAMES[level + 1]}`} aria-label="Go forward one level">
          <span>Next</span><b aria-hidden="true">→</b>
        </button>
      )}
    </nav>
  )
}
