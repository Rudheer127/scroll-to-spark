"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Menu } from "@/components/ui/menu";
import { DeleteGroupDialog } from "@/features/groups/components/delete-group-dialog";
import { EditGroupDialog } from "@/features/groups/components/edit-group-dialog";

type GroupOwnerMenuProps = {
  group: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    isPrivate: boolean;
  };
};

/** Owner only. Editing and the rare, risky actions live here. */
export function GroupOwnerMenu({ group }: GroupOwnerMenuProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <Menu
        label="More actions for this group"
        items={[
          { label: "Edit group", icon: Pencil, onSelect: () => setEditing(true) },
          { label: "Delete group", icon: Trash2, danger: true, onSelect: () => setDeleting(true) },
        ]}
      />
      <EditGroupDialog open={editing} onClose={() => setEditing(false)} group={group} />
      <DeleteGroupDialog
        groupId={group.id}
        groupName={group.name}
        open={deleting}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}
