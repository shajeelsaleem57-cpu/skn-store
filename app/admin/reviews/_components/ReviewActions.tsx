"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../../_components/toast";
import { cn } from "@/lib/utils";

export function ReviewActions({
  id,
  isApproved,
  isFeatured,
}: {
  id: string;
  isApproved: boolean;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const update = async (body: Record<string, boolean>, message: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast(message);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this review permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast("Review deleted");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const btn = "rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!isApproved ? (
        <button type="button" disabled={busy} onClick={() => update({ isApproved: true }, "Review approved")} className={cn(btn, "bg-green-600 text-white hover:bg-green-700")}>
          Approve
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => update({ isApproved: false }, "Review unapproved")} className={cn(btn, "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50")}>
          Reject
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => update({ isFeatured: !isFeatured }, isFeatured ? "Removed from featured" : "Marked as featured")}
        className={cn(btn, isFeatured ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50")}
      >
        {isFeatured ? "Featured" : "Feature"}
      </button>
      <button type="button" disabled={busy} onClick={remove} className={cn(btn, "text-red-600 hover:bg-red-50")}>
        Delete
      </button>
    </div>
  );
}
