export interface Translation {
  id: number;
  articleId: number;
  lang: string;
  providerId: string;
  model: string;
  text: string;
  createdAt: number;
}

export interface ArticleMetaTranslation {
  articleId: number;
  lang: string;
  providerId: string;
  model: string;
  title: string;
  summary: string | null;
  createdAt: number;
}
