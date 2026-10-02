'use client';

interface RemoveComplaintDialogProps {
  complaintNumber: string;
  removing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation dialog for the irreversible "Remove Complaint" action. Styled
 * with a destructive (red) primary button so it is clearly different from the
 * normal status actions.
 */
export function RemoveComplaintDialog({
  complaintNumber,
  removing,
  onCancel,
  onConfirm,
}: RemoveComplaintDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">        <div className="w-full max-w-sm rounded-xl glass-modal p-5 shadow-lg" style={{background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)'}}>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{background: 'rgba(239,68,68,0.2)'}}>
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </span>
          <div>
            <h3 className="text-base font-semibold" style={{color: '#ffffff'}}>Remove Complaint</h3>
            <p className="mt-1 text-sm" style={{color: 'rgba(255,255,255,0.7)'}}>
              Are you sure you want to permanently remove this complaint?
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border p-3" style={{borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.15)'}}>
          <p className="text-sm" style={{color: 'rgba(252,165,165,0.9)'}}>
            This action cannot be undone. The complaint will be permanently deleted from the database.
          </p>
          <p className="mt-2 font-mono text-xs text-red-600">{complaintNumber}</p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={removing}
            className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/20 disabled:opacity-50"
            style={{borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)'}}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={removing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            style={{background: 'rgba(239,68,68,0.85)'}}
          >
            {removing && (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Permanently Remove
          </button>
        </div>
      </div>
    </div>
  );
}
