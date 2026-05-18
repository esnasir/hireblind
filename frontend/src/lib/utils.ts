import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatActorName(emailOrId: string | null | undefined): string {
  if (!emailOrId) return 'Unknown User';
  const clean = emailOrId.toLowerCase().trim();
  if (clean.includes('admin') || clean === '4a5944c2-6192-404d-aeef-4c52b83ce156') {
    return 'System Admin';
  }
  if (clean.includes('recruiter') || clean === 'b7db5315-6429-45ee-80c4-c4b802198988') {
    return 'Lead Recruiter';
  }
  // If it's a UUID
  if (clean.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    return 'System User';
  }
  // Otherwise format the email clean name
  if (clean.includes('@')) {
    const parts = clean.split('@')[0].split(/[._\-]+/);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return emailOrId;
}
