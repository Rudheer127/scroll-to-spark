export type ThreadSummary = {
  id: string;
  groupId: string;
  title: string;
  body: string | null;
  createdAt: string;
  authorName: string;
  voteScore: number;
  myVote: -1 | 0 | 1;
  commentCount: number;
};
