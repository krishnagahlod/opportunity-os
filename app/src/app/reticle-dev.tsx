'use client';
import { useEffect } from 'react';

/** Dev/Preview: connect Reticle + install the React adapter, after hydration. */
export function ReticleDev() {
  useEffect(() => {
    const isAllowed =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
      process.env.NEXT_PUBLIC_RETICLE_ENABLED === 'true';

    if (!isAllowed) return;

    void import('@reticlehq/react').then(({ reticle, install, registerCapabilities }) => {
      install();
      // Both provided by withReticle() or fallback to local pairing token for preview testing.
      const token =
        process.env.NEXT_PUBLIC_RETICLE_TOKEN ||
        'b440bb64c61664ae6bee3c379077156210ead74c422661a2';
      const root = process.env.NEXT_PUBLIC_RETICLE_ROOT;
      const url = process.env.NEXT_PUBLIC_RETICLE_URL;

      reticle.connect({
        projectId: 'app-8761f14f',
        allowNonLocalhost: true,
        allowInProduction: true,
        ...(url ? { url } : {}),
        ...(token ? { token } : {}),
        ...(root ? { root } : {}),
      });

      registerCapabilities({
        testids: ['opportunity-card', 'save-button', 'search-input'],
        signals: [],
        stores: [],
      });
    });
  }, []);
  return null;
}
