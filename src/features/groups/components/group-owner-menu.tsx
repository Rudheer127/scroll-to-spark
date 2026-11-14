"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Menu } from "@/components/ui/menu";
import { DeleteGroupDialog } from "@/features/groups/components/delete-group-dialog";

type GroupOwnerMenuProps = { groupId: string; groupName: string };

/** Owner only. Rare and risky actions live here, out of the way. */
export function GroupOwnerMenu({ groupId, groupName }: GroupOwnerMenuProps) {
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <Menu
        label="More actions for this group"
        items={[
          { label: "Delete group", icon: Trash2, danger: true, onSelect: () => setDeleting(true) },
        ]}
      />
      <DeleteGroupDialog
        groupId={groupId}
        groupName={groupName}
        open={deleting}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}
