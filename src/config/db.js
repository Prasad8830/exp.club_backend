import mongoose from "mongoose";

function normalizeMongoUri(uri) {
  let out = (uri || "").trim();
  if (!out) return out;

  // Ensure a database name is present (e.g., "/habit_tracker")
  const dbNameRegex = /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/i;
  const match = out.match(dbNameRegex);
  const currentDb = match ? match[1] : "";
  if (!currentDb) {
    out = out.replace(
      /^(mongodb(?:\+srv)?:\/\/[^/]+\/)\??/i,
      (_m, prefix) => `${prefix}habit_tracker` + (out.includes("?") ? "?" : "")
    );
  }

  // Remove empty appName param if present as `?appName` or `&appName`
  out = out.replace(/([?&])appName(?=(?:&|$))/i, (m, sep) => (sep === "?" ? "?" : ""));

  return out;
}

export async function connectDB(uri) {
  if (!uri) throw new Error("MONGODB_URI is required");
  const normalized = normalizeMongoUri(uri);
  if (normalized !== uri) {
    // eslint-disable-next-line no-console
    console.warn("Normalized MONGODB_URI for connection");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(normalized);
}
