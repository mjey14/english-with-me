const BASE_URL = "http://172.20.10.3:8000";

export const api = {
  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/users/me`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  updateProfile: async (roleModelDescription: string) => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_model_description: roleModelDescription }),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },
  updateModes: async (enabled_modes: string[]) => {
    const res = await fetch(`${BASE_URL}/users/me/modes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled_modes }),
    });
    if (!res.ok) throw new Error("Failed to update modes");
    return res.json();
  },

  getHistory: async (q?: string) => {
    const url = q
      ? `${BASE_URL}/history?q=${encodeURIComponent(q)}`
      : `${BASE_URL}/history`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  },

  deleteHistory: async (id: string) => {
    const res = await fetch(`${BASE_URL}/history/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete history item");
    return res.json();
  },

  getLearnExpressions: async (category: string, sub_category: string | null, details?: string) => {
    const res = await fetch(`${BASE_URL}/learn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, sub_category, details: details || null }),
    });
    if (!res.ok) throw new Error("Failed to generate expressions");
    return res.json();
  },

  getReviewItems: async () => {
    const res = await fetch(`${BASE_URL}/review`);
    if (!res.ok) throw new Error("Failed to fetch review items");
    return res.json();
  },

  dismissReviewItem: async (id: string) => {
    const res = await fetch(`${BASE_URL}/review/${id}/dismiss`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to dismiss review item");
    return res.json();
  },

  convert: async (
    korean_input: string,
    category: string,
    sub_category: string | null,
    user_context?: string
  ) => {
    const res = await fetch(`${BASE_URL}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ korean_input, category, sub_category, user_context: user_context || null }),
    });
    if (!res.ok) throw new Error("Conversion failed");
    return res.json();
  },
};
