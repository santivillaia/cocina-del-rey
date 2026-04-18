import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'La Cocina del Rey',
    short_name: 'Cabre',
    description: 'App de hábitos diarios para Cabre',
    start_url: '/',
    display: 'standalone',
    background_color: '#06060a',
    theme_color: '#06060a',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
