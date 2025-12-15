import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { User } from "../models/User.js";
import { signUserToken } from "../utils/token.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const tokenSchema = z.object({ idToken: z.string().min(10) });

export async function googleSignIn(req, res) {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const googleId = payload?.sub;
    if (!email || !googleId) {
      return res.status(400).json({ error: "Google token missing required fields" });
    }
    const update = {
      name: payload.name || email.split("@")[0],
      avatarUrl: payload.picture,
      googleId,
      provider: "google",
    };
    const user = await User.findOneAndUpdate(
      { email },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const token = signUserToken(user.id);
    return res.json({ token, user });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Google auth error", err);
    return res.status(401).json({ error: "Google token verification failed" });
  }
}

export async function me(req, res) {
  const user = await User.findById(req.user.id).select("-__v");
  return res.json({ user });
}
