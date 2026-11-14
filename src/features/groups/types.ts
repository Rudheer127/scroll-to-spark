export type GroupSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  isPrivate: boolean;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
};
