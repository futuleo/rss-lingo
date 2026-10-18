export interface Translation {
  id: number;
  articleId: number;
  lang: string;
  providerId: string;
  model: string;
  text: string;
  createdAt: number;
}
