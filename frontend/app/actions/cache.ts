"use server";

import { revalidatePath } from "next/cache";

/**
 * Purges the Next.js Client Cache and revalidates active layout/page data
 * after any client-side mutation so revisited routes never show stale state.
 */
export async function invalidateAppCache(): Promise<void> {
  revalidatePath("/", "layout");
}
