export function jobRoute(id?: string | null) {
  return id ? `/jobs/${id}` : '/jobs';
}

export function candidateRoute(id?: string | null) {
  return id ? `/candidates/${id}` : '/candidates';
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function titleCaseStatus(value?: string | null) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function statusClasses(status?: string | null) {
  const normalized = (status || '').toUpperCase();
  if (['ACTIVE', 'PUBLISHED', 'SCORED', 'SHORTLISTED'].includes(normalized)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (['DRAFT', 'APPLIED', 'SCREENED', 'INVITED'].includes(normalized)) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }
  if (['REVEALED', 'CLOSED', 'PENDING'].includes(normalized)) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (['REJECTED', 'ARCHIVED', 'INACTIVE', 'FAILED'].includes(normalized)) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export function scoreClasses(score?: number | null) {
  if (score === null || score === undefined) return 'border-slate-200 bg-slate-50 text-slate-600';
  if (score >= 85) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score >= 70) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (score >= 50) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

type CandidateLike = {
  id?: string;
  candidateName?: string;
  rawCandidateName?: string;
  candidateLabel?: string;
};

export function safeCandidateLabel(submission: CandidateLike | null | undefined, revealed = false, revealedData?: { candidateName?: string } | null) {
  if (revealed) {
    return revealedData?.candidateName || submission?.candidateName || submission?.rawCandidateName || submission?.candidateLabel || 'Candidate';
  }
  return submission?.candidateLabel || (submission?.id ? `Candidate ${String(submission.id).slice(0, 8)}` : 'Candidate');
}

export function initialsFrom(value?: string | null, fallback = 'HB') {
  if (!value) return fallback;
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return value.trim().slice(0, 2).toUpperCase();
}

export function cleanUrlLabel(value?: string | null) {
  if (!value || value === '[REDACTED]') return 'Available after reveal';
  return value.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}
