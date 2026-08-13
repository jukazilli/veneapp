import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Veneapp',
    short_name: 'Veneapp',
    description: 'Agenda, atendimento e comissões em sincronia.',
    start_url: '/agenda',
    display: 'standalone',
    background_color: '#fff7fb',
    theme_color: '#0b0b0f',
    lang: 'pt-BR',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
