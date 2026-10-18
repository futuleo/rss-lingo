import { useLocalSearchParams } from 'expo-router';
import { ArticleReaderScreen } from '@pages/article-reader';

export default function ArticleReaderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const articleId = Number(id);
  return <ArticleReaderScreen articleId={Number.isFinite(articleId) ? articleId : 0} />;
}
