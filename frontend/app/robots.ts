import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://studflow.webcris.dev'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'], // Prevent crawling of private/dynamic routes
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
