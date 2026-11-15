export type GroupSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rules: string | null;
  color: string;
  isPrivate: boolean;
  isDemo: boolean;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
  hidden: boolean;
};
