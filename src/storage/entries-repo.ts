import type { EntryRecord } from "../domain/entries/entry-types";
import { db } from "./db";

export const listEntries = () => db.entries.toArray();

export const saveEntry = async (entry: EntryRecord) => {
  await db.entries.put(entry);
};

export const deleteEntry = async (entryId: string) => {
  await db.entries.delete(entryId);
};
