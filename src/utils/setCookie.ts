import { Response } from "express";

export const setTokenCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: false, 
    sameSite: "lax",
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });
};