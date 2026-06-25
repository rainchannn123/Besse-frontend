'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import {
  ActivityCategory,
  ActivityLogEntry,
  ActivityLogStatsData,
  ActivityStatus,
} from '@/types/admin';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS: Array<{
  value: ActivityCategory | '';
  label: string;
}> = [
  { value: '', label: 'All categories' },
  { value: 'auth', label: 'Auth' },
  { value: 'admin', label: 'Admin' },
  { value: 'lobby', label: 'Lobby' },
  { value: 'matchmaking', label: 'Matchmaking' },
  { value: 'game', label: 'Game' },
  { value: 'municipality', label: 'Municipality' },
  { value: 'mrf', label: 'MRF' },
  { value: 'broker', label: 'Broker' },
  { value: 'system', label: 'System' },
];

const STATUS_OPTIONS: Array<{
  value: ActivityStatus | '';
  label: string;
}> = [
  { value: '', label: 'All status' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
];

const CATEGORY_COLOR: Record<ActivityCategory, string> = {
  auth: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
  lobby: 'bg-yellow-100 text-yellow-900',
  matchmaking: 'bg-amber-100 text-amber-900',
  game: 'bg-emerald-100 text-emerald-900',
  municipality: 'bg-cyan-100 text-cyan-900',
  mrf: 'bg-orange-100 text-orange-900',
  broker: 'bg-pink-100 text-pink-900',
  system: 'bg-gray-100 text-gray-800',
};

const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString();
};

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [stats, setStats] = useState<ActivityLogStatsData | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [category, setCategory] = useState<ActivityCategory | ''>('');
  const [status, setStatus] = useState<ActivityStatus | ''>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getActivityLogs({
        page,
        limit,
        category: category || undefined,
        status: status || undefined,
        search: search || undefined,
      });

      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      } else {
        setError(response.message || 'Failed to load activity logs');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load activity logs'
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, category, status, search]);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminService.getActivityLogStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.warn('Failed to load activity log stats', err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadLogs();
  }, [isOpen, loadLogs]);

  useEffect(() => {
    if (!isOpen) return;
    loadStats();
  }, [isOpen, loadStats]);

  useEffect(() => {
    setPage(1);
  }, [category, status, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setCategory('');
    setStatus('');
    setSearch('');
    setSearchInput('');
  };

  const totalsSummary = useMemo(() => {
    if (!stats) return null;
    return [
      { label: 'Total', value: stats.totalLogs },
      { label: 'Last 24h', value: stats.last24Hours },
      { label: 'Last 7d', value: stats.last7Days },
    ];
  }, [stats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-[1400px] max-h-[92vh] flex flex-col rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#d3c4ad] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#3A7D2C] p-2 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#4f2d14]">Activity Log</h2>
              <p className="text-xs text-[#7a5f41]">
                Audit trail of every action performed across the platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadLogs();
                loadStats();
              }}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-[#5b7f3b] bg-white px-3 py-1.5 text-sm font-semibold text-[#2e4a1f] hover:bg-[#eef8e4] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#7a5f41] hover:bg-[#f0e6d0]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        {totalsSummary && (
          <div className="flex flex-wrap gap-3 border-b border-[#d3c4ad] bg-[#fffaf0] px-6 py-3">
            {totalsSummary.map(item => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-lg border border-[#d3c4ad] bg-white px-3 py-1.5"
              >
                <span className="text-xs uppercase tracking-wide text-[#7a5f41]">
                  {item.label}
                </span>
                <span className="text-sm font-bold text-[#4f2d14]">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
            {stats?.byCategory.slice(0, 5).map(entry => (
              <div
                key={entry.category}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  CATEGORY_COLOR[entry.category as ActivityCategory] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {entry.category}: {entry.count}
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#d3c4ad] bg-[#fff9ef] px-6 py-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2 min-w-[260px]"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a5f41]" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search description, action, user, session…"
                className="w-full rounded-lg border border-[#ccb99b] bg-white px-9 py-2 text-sm text-[#4f2d14] focus:outline-none focus:ring-2 focus:ring-[#84a95b]"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#3A7D2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2d6322]"
            >
              Search
            </button>
          </form>

          <select
            value={category}
            onChange={e => setCategory(e.target.value as ActivityCategory | '')}
            className="rounded-lg border border-[#ccb99b] bg-white px-3 py-2 text-sm text-[#4f2d14] focus:outline-none focus:ring-2 focus:ring-[#84a95b]"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value as ActivityStatus | '')}
            className="rounded-lg border border-[#ccb99b] bg-white px-3 py-2 text-sm text-[#4f2d14] focus:outline-none focus:ring-2 focus:ring-[#84a95b]"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {(category || status || search) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-[#ccb99b] bg-white px-3 py-2 text-sm font-semibold text-[#7a5f41] hover:bg-[#f0e6d0]"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-[#7a5f41]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading activity logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[#7a5f41]">
              <Activity className="mb-2 h-10 w-10 opacity-50" />
              <p className="font-semibold text-[#4f2d14]">No activity yet</p>
              <p className="text-sm">
                {category || status || search
                  ? 'Try adjusting or clearing your filters.'
                  : 'Activity will appear here as users interact with the platform.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-separate border-spacing-y-1">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#7a5f41]">
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Actor</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const isExpanded = expandedLogId === log._id;
                    const statusColor =
                      log.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800';
                    const categoryColor =
                      CATEGORY_COLOR[log.category] || 'bg-gray-100 text-gray-800';

                    return (
                      <React.Fragment key={log._id}>
                        <tr
                          className="cursor-pointer rounded-lg bg-white shadow-[0_1px_4px_rgba(52,37,12,0.08)] hover:shadow-md transition-shadow"
                          onClick={() =>
                            setExpandedLogId(isExpanded ? null : log._id)
                          }
                        >
                          <td className="px-3 py-2 align-top text-xs text-[#4f2d14] whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-3 py-2 align-top text-sm">
                            <div className="font-semibold text-[#4f2d14]">
                              {log.userName || 'Anonymous'}
                            </div>
                            {log.userEmail && (
                              <div className="text-xs text-[#7a5f41]">
                                {log.userEmail}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${categoryColor}`}
                            >
                              {log.category}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-xs font-mono text-[#4f2d14]">
                            {log.action}
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-[#4f2d14] max-w-[360px]">
                            <span className="line-clamp-2">{log.description}</span>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}
                            >
                              {log.status === 'success' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {log.status}
                              {log.statusCode ? ` ${log.statusCode}` : ''}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-xs font-mono text-[#7a5f41]">
                            {log.sessionId
                              ? log.sessionId.slice(0, 12) + '…'
                              : '—'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-3 pb-3">
                              <div className="rounded-lg border border-[#d3c4ad] bg-[#fffaf0] p-3 text-xs text-[#4f2d14]">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div>
                                    <p className="font-semibold text-[#7a5f41] uppercase tracking-wide">
                                      Request
                                    </p>
                                    <p>
                                      <span className="font-mono">
                                        {log.method} {log.route}
                                      </span>
                                    </p>
                                    {log.ipAddress && (
                                      <p>
                                        IP:{' '}
                                        <span className="font-mono">{log.ipAddress}</span>
                                      </p>
                                    )}
                                    {log.userAgent && (
                                      <p className="break-words">
                                        UA:{' '}
                                        <span className="font-mono">{log.userAgent}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#7a5f41] uppercase tracking-wide">
                                      Actor context
                                    </p>
                                    {log.accountType && <p>Account: {log.accountType}</p>}
                                    {log.role && <p>Role: {log.role}</p>}
                                    {log.sessionId && (
                                      <p>
                                        Session:{' '}
                                        <span className="font-mono">{log.sessionId}</span>
                                      </p>
                                    )}
                                    {log.targetUserId && (
                                      <p>
                                        Target User:{' '}
                                        <span className="font-mono">{log.targetUserId}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div className="mt-3">
                                    <p className="font-semibold text-[#7a5f41] uppercase tracking-wide">
                                      Metadata
                                    </p>
                                    <pre className="mt-1 max-h-60 overflow-auto rounded bg-[#f5efe2] p-2 font-mono text-[11px] text-[#4f2d14]">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d3c4ad] bg-[#fff9ef] px-6 py-3">
          <div className="text-xs text-[#7a5f41]">
            Showing {logs.length} of {total.toLocaleString()} log
            {total === 1 ? '' : 's'} · Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-lg border border-[#ccb99b] bg-white px-3 py-1.5 text-sm font-semibold text-[#4f2d14] hover:bg-[#f0e6d0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 rounded-lg border border-[#ccb99b] bg-white px-3 py-1.5 text-sm font-semibold text-[#4f2d14] hover:bg-[#f0e6d0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogModal;
