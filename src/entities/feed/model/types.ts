export interface Feed {
  id: number;
  url: string;
  title: string | null;
  siteUrl: string | null;
  createdAt: number;
  lastFetchedAt: number | null;
}

export interface NewFeed {
  url: string;
  title?: string | null;
  siteUrl?: string | null;
}
