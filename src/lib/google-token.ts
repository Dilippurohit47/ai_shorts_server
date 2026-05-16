import { prisma } from "./prisma"
import { oauth2Client } from "./google"

/**
 * Returns a valid access token for the user's connected platform account.
 * Refreshes the token if it's expired. Marks account as disconnected if refresh fails.
 */
enum Platform {
  "YOUTUBE",
  "INSTAGRAM",
  "FACEBOOK"
}
export async function getValidAccessToken(userId: string, platform: Platform) {
  const account = await prisma.connectedAccount.findFirst({
    where: { userId, platform, isConnected: true },
  })

  if (!account) {
    throw new Error(`No connected ${platform} account for user`)
  }

  // Is the access token still valid? (with 1 min buffer to avoid edge-of-expiry failures)
  const now = Date.now()
  const expiresAt = account?.expiresAt?.getTime()
  const oneMinute = 60 * 1000

  if (expiresAt - oneMinute > now) {
    return account.accessToken
  }

  // Expired — refresh it
  try {
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error("Refresh returned incomplete credentials")
    }

    // Save the new access token + expiry back to DB
    const updated = await prisma.connectedAccount.update({
      where: { id: account.id },
      data: {
        accessToken: credentials.access_token,
        expiresAt: new Date(credentials.expiry_date),
      },
    })

    return updated.accessToken
  } catch (err: any) {
    console.error("Token refresh failed:", err.message)

    // Refresh token is dead — mark account as disconnected
    if (err.message?.includes("invalid_grant")) {
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: { isConnected: false },
      })
      throw new Error(`${platform} account needs reconnection`)
    }

    throw err
  }
}