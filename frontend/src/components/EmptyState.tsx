import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: Props) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
    <div className="relative mb-5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
        {icon || <Inbox className="w-7 h-7 text-slate-400" />}
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-100 border border-slate-200" />
    </div>
    <h3 className="text-base font-bold text-slate-700 mb-1.5">{title}</h3>
    {description && <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-5">{description}</p>}
    {action && !description && <div className="mt-4">{action}</div>}
    {action && description && action}
  </div>
);
