import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Replace with your actual production URL when deployed
  const baseUrl = 'https://studflow.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/'], // Prevent crawling of private/dynamic routes
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
