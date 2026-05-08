import { type FormEvent, useEffect, useState } from "react";
import {
  type BookmarkDto,
  deleteBookmark,
  getBookmark,
  patchBookmark,
  reprocessBookmark,
} from "../api";

export function useBookmarkEditor(bookmarkId: number | undefined) {
  const [b, setB] = useState<BookmarkDto | null>(null);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [abstractZh, setAbstractZh] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const n = bookmarkId;
    if (n == null || !Number.isFinite(n)) return;
    void getBookmark(n)
      .then((row) => {
        setB(row);
        setTitle(row.title ?? "");
        setAbstract(row.abstract ?? "");
        setAbstractZh(row.abstractZh ?? "");
        setTags(row.tagNames);
        setIsEditing(false);
      })
      .catch((e) => setErr(String(e)));
  }, [bookmarkId]);

  async function saveMeta() {
    if (!b) return;
    setBusy(true);
    try {
      const row = await patchBookmark(b.id, { title, abstract, abstractZh });
      setB(row);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  function cancelEdit() {
    if (!b) return;
    setTitle(b.title ?? "");
    setAbstract(b.abstract ?? "");
    setAbstractZh(b.abstractZh ?? "");
    setTags(b.tagNames);
    setTagInput("");
    setIsEditing(false);
  }

  async function addTag(e: FormEvent) {
    e.preventDefault();
    const t = tagInput.trim().toLowerCase();
    if (!t || !b) return;
    const next = [...new Set([...tags, t])];
    setBusy(true);
    try {
      const row = await patchBookmark(b.id, { tagNames: next });
      setB(row);
      setTags(row.tagNames);
      setTagInput("");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function removeTag(t: string) {
    if (!b) return;
    const next = tags.filter((x) => x !== t);
    setBusy(true);
    try {
      const row = await patchBookmark(b.id, { tagNames: next });
      setB(row);
      setTags(row.tagNames);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function reprocess() {
    if (!b) return;
    setBusy(true);
    setErr(null);
    try {
      await reprocessBookmark(b.id);
      const row = await getBookmark(b.id);
      setB(row);
      setTitle(row.title ?? "");
      setAbstract(row.abstract ?? "");
      setAbstractZh(row.abstractZh ?? "");
      setTags(row.tagNames);
      setIsEditing(false);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deleteById(): Promise<boolean> {
    if (!b) return false;
    setBusy(true);
    setErr(null);
    try {
      await deleteBookmark(b.id);
      return true;
    } catch (e) {
      setErr(String(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    b,
    title,
    setTitle,
    abstract,
    setAbstract,
    abstractZh,
    setAbstractZh,
    tagInput,
    setTagInput,
    tags,
    err,
    busy,
    isEditing,
    setIsEditing,
    saveMeta,
    cancelEdit,
    addTag,
    removeTag,
    reprocess,
    deleteById,
  };
}
