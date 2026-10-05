import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all ${
        highlight
          ? 'bg-gradient-to-br from-emerald-950 to-slate-900 text-white border-emerald-800/40 shadow-sm'
          : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-emerald-300' : 'text-slate-500'}`}>
          {title}
        </p>
        {icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              highlight ? 'bg-white/10 text-emerald-300' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <h4 className={`text-2xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </h4>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className={`text-xs mt-1.5 ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
