import jwt from "jsonwebtoken";

export const generateToken = (userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret required");
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "15d" }
  );
};