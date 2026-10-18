import { useLocalSearchParams } from 'expo-router';
import { FeedArticlesScreen } from '@pages/feed-articles';

export default function FeedArticlesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const feedId = Number(id);
  return <FeedArticlesScreen feedId={Number.isFinite(feedId) ? feedId : 0} />;
}
