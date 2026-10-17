"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@prisma/client";
import { useToast } from "../../_components/toast";
import { DeleteButton } from "../../_components/client";
import { IconArrowDown, IconArrowUp, IconEdit } from "../../_components/icons";
import { Pill } from "../../_components/ui";
import { cn } from "@/lib/utils";

export type CategoryNode = Category & {
  children: CategoryNode[];
  _count: { products: number; children: number };
};

function buildTree(rows: CategoryNode[]): CategoryNode[] {
  const byId = new Map(rows.map((r) => [r.id, { ...r, children: [] as CategoryNode[] }]));
  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sort = (list: CategoryNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

function Row({
  node,
  siblings,
  index,
  depth,
  onReorder,
  onToggle,
}: {
  node: CategoryNode;
  siblings: CategoryNode[];
  index: number;
  depth: number;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onToggle: (node: CategoryNode) => Promise<void>;
}) {
  const move = async (dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await onReorder(ids);
  };

  return (
    <div className={cn(depth > 0 && "ml-6 border-l-2 border-gray-100 pl-3")}>
      <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex shrink-0 flex-col">
          <button type="button" onClick={() => move(-1)} disabled={index === 0} className="p-0.5 text-gray-500 hover:text-gray-900 disabled:opacity-25" aria-label="Move up">
            <IconArrowUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => move(1)} disabled={index === siblings.length - 1} className="p-0.5 text-gray-500 hover:text-gray-900 disabled:opacity-25" aria-label="Move down">
            <IconArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {node.name} <span className="font-normal text-gray-400">/{node.slug}</span>
          </p>
          <p className="text-xs text-gray-500">
            {node._count.products} product{node._count.products === 1 ? "" : "s"}
            {node._count.children > 0 ? ` · ${node._count.children} subcategor${node._count.children === 1 ? "y" : "ies"}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onToggle(node)}
            title={node.isVisible ? "Hide category" : "Show category"}
          >
            {node.isVisible ? <Pill tone="green">Visible</Pill> : <Pill tone="gray">Hidden</Pill>}
          </button>
          <Link href={`/admin/categories/${node.id}`} title="Edit" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
            <IconEdit className="h-3.5 w-3.5" /> Edit
          </Link>
          <DeleteButton
            url={`/api/admin/categories/${node.id}`}
            confirmMessage={
              `Delete "${node.name}"?` +
              (node._count.products > 0 ? ` ${node._count.products} product(s) will be detached (kept, uncategorized).` : "") +
              (node._count.children > 0 ? ` ${node._count.children} subcategor(ies) will also be deleted.` : "")
            }
          />
        </div>
      </div>
      {node.children.length > 0 ? (
        <div className="mt-2 space-y-2">
          {node.children.map((child, i) => (
            <Row key={child.id} node={child} siblings={node.children} index={i} depth={depth + 1} onReorder={onReorder} onToggle={onToggle} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CategoryTree({ rows }: { rows: CategoryNode[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const tree = buildTree(rows);

  const onReorder = async (orderedIds: string[]) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Reorder failed");
      toast("Order updated");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Reorder failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (node: CategoryNode) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/categories/${node.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: node.name,
          slug: node.slug,
          description: node.description,
          image: node.image,
          icon: node.icon,
          parentId: node.parentId,
          sortOrder: node.sortOrder,
          isVisible: !node.isVisible,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast(node.isVisible ? "Category hidden" : "Category visible");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("space-y-2", busy && "pointer-events-none opacity-60")}>
      {tree.map((node, i) => (
        <Row key={node.id} node={node} siblings={tree} index={i} depth={0} onReorder={onReorder} onToggle={onToggle} />
      ))}
    </div>
  );
}
