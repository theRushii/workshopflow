import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog = ({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', variant = 'danger', loading
}: Props) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="flex gap-4 mb-6">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        variant === 'danger' ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'
      }`}>
        {variant === 'danger'
          ? <Trash2 className="w-4 h-4 text-red-500" />
          : <AlertTriangle className="w-4 h-4 text-blue-500" />
        }
      </div>
      <p className="text-sm text-slate-600 leading-relaxed pt-1">{message}</p>
    </div>
    <div className="flex gap-2.5 justify-end">
      <button onClick={onClose} className="btn-secondary" disabled={loading}>
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : confirmLabel}
      </button>
    </div>
  </Modal>
);
