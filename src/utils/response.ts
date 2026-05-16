export const sendError = (res: any, status: number, message: string, error?: any) => {
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error?.message || error : undefined,
  });
};
