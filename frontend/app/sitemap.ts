import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://studflow.webcris.dev'

  return [
    {
      url: baseUrl,
      lastModified: new Date('2024-03-01'), // Use a static or DB-driven date, never new Date() per request
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Authenticated routes like /dashboard and /upload are omitted.
    // Sitemaps should only contain public, indexable pages.
  ]
}
