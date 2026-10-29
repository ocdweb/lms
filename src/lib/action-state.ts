export type ActionState = { ok?: string; error?: string; at?: number } | null;

export const ok = (message: string): ActionState => ({ ok: message, at: Date.now() });
export const fail = (message: string): ActionState => ({ error: message, at: Date.now() });
