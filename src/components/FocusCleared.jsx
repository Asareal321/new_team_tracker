import './FocusCleared.css'
import Trak from './Trak'

// You finished everything the calendar block put in front of you.
//
// This is the best moment the focus hour produces, and the first version of it
// restored the parked board silently — which meant the moment passed without
// anything happening at all. It is a decision point instead: what you do next
// is yours, and "nothing" is one of the answers.
//
// The three choices are not decoration. Putting the board back is the common
// case; going to the braindump is for when the next hour is a different shape;
// and leaving it empty matters because sometimes you cleared the block because
// you are done working, and every other option argues with that.
export default function FocusCleared({ projectName, parkedCount, onRestore, onBraindump, onLeave }) {
  return (
    <div className="modal-overlay" onClick={onLeave}>
      <div className="fc-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="fc-head">
          <Trak mood="happy" size={56} />
          <div>
            <p className="fc-eyebrow">Block cleared</p>
            <h3 className="fc-heading">
              That is all of {projectName}.
            </h3>
          </div>
        </div>

        <p className="fc-body">
          {parkedCount > 0
            ? `${parkedCount} task${parkedCount === 1 ? '' : 's'} stepped aside for this hour. What now?`
            : 'Nothing was parked for this one, so the board is yours.'}
        </p>

        <div className="fc-actions">
          {parkedCount > 0 && (
            <button className="btn-primary fc-btn" onClick={onRestore}>
              Put them back
            </button>
          )}
          <button className="btn-ghost fc-btn" onClick={onBraindump}>
            Pick from the braindump
          </button>
          <button className="fc-quiet" onClick={onLeave}>
            Leave it empty
          </button>
        </div>
      </div>
    </div>
  )
}
