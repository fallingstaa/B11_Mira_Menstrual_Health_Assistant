import { useEffect, useState } from 'react';

import { auth } from '@/config/firebase';

/**
 * GET /api/profile/avatar is authenticated like every other endpoint — a bare <Image uri=.../>
 * can't attach an Authorization header, so any screen showing the user's real photo needs this
 * fetched alongside the avatar URL and passed to <Image source={{ uri, headers }}>.
 *
 * Returns undefined until both a URL exists and the token's arrived — callers should keep
 * rendering their fallback (e.g. an initial-letter circle) until then, same as profile.tsx.
 */
export function useAvatarAuthHeader(avatarUrl: string | null | undefined): { Authorization: string } | undefined {
  const [header, setHeader] = useState<{ Authorization: string } | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!avatarUrl) {
      // Deferred (not called synchronously in the effect body) so this can't trigger a
      // cascading render — same reasoning as the token branch below, just for the "clear" case.
      Promise.resolve().then(() => {
        if (!cancelled) setHeader(undefined);
      });
      return () => {
        cancelled = true;
      };
    }
    auth.currentUser?.getIdToken().then((token) => {
      if (!cancelled && token) setHeader({ Authorization: `Bearer ${token}` });
    });
    return () => {
      cancelled = true;
    };
  }, [avatarUrl]);

  return header;
}
