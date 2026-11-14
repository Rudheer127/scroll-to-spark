import { CommentItem } from "@/features/comments/components/comment-item";
import type { CommentNode } from "@/features/comments/tree";

type CommentTreeProps = {
  nodes: CommentNode[];
  threadId: string;
  canParticipate: boolean;
  viewerId: string;
  isGroupOwner: boolean;
};

export function CommentTree({
  nodes,
  threadId,
  canParticipate,
  viewerId,
  isGroupOwner,
}: CommentTreeProps) {
  if (nodes.length === 0) {
    return <p className="text-muted">No comments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {nodes.map((node) => (
        <CommentItem
          key={node.id}
          node={node}
          threadId={threadId}
          depth={0}
          canParticipate={canParticipate}
          viewerId={viewerId}
          isGroupOwner={isGroupOwner}
        />
      ))}
    </ul>
  );
}
