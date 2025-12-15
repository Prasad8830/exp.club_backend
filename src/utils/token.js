import jwt from "jsonwebtoken";

export function signUserToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
