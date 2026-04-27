import { ConvexReactClient } from "convex/react";

let _client = null;

export const getConvexClient = () => {
  if (_client) return _client;
  const url = (process.env.EXPO_PUBLIC_CONVEX_URL || "").trim();
  if (!url) return null;
  _client = new ConvexReactClient(url, { unsavedChangesWarning: false });
  return _client;
};

