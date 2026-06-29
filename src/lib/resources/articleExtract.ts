import { extract } from '@extractus/article-extractor'

export interface ArticleData {
  title?: string
  content?: string
  description?: string
  author?: string
  published?: string
  image?: string
}

export async function extractArticle(url: string): Promise<ArticleData | null> {
  try {
    const article = await extract(url)
    if (!article) return null
    return {
      title: article.title ?? undefined,
      content: article.content ?? undefined,
      description: article.description ?? undefined,
      author: article.author ?? undefined,
      published: article.published ?? undefined,
      image: article.image ?? undefined,
    }
  } catch {
    return null
  }
}
