import React from 'react';

interface Props {
  status: string;
  className?: string;
}

const LABELS: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  converted: 'Converted',
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  draft: 'Draft',
  issued: 'Issued',
  partially_paid: 'Partial',
  paid: 'Paid',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

// Dot colors per status group
const DOTS: Record<string, string> = {
  new: 'bg-slate-400',
  under_review: 'bg-amber-500',
  accepted: 'bg-emerald-500',
  rejected: 'bg-red-500',
  converted: 'bg-violet-500',
  pending: 'bg-slate-400',
  assigned: 'bg-blue-500',
  in_progress: 'bg-orange-500',
  on_hold: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  draft: 'bg-slate-400',
  issued: 'bg-blue-500',
  partially_paid: 'bg-orange-500',
  paid: 'bg-emerald-500',
};

export const StatusBadge = ({ status, className = '' }: Props) => {
  const key = status?.toLowerCase().replace(/\s/g, '_') || 'unknown';
  const dot = DOTS[key];
  return (
    <span className={`badge-${key} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />}
      {LABELS[key] || status}
    </span>
  );
};
