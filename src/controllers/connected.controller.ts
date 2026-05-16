import { Request, Response } from "express"
import { google } from "googleapis"
import { prisma } from "../lib/prisma"
import { sendError } from "../utils/response"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI  
)

export const connectYoutube = (req: Request, res: Response) => {
  const userId = req.query.userId as string

if (!userId) return sendError(res, 400, "userId required")

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",       
    prompt: "consent",            
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    state: userId,                
  })

  res.redirect(url)
}

export const youtubeCallback = async (req: Request, res: Response) => {
  try {
    const { code, state: userId } = req.query

    if (!code || !userId) return sendError(res, 400, "Missing code or userId")

    // exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string)

    const { access_token, refresh_token, expiry_date } = tokens

    // get their YouTube channel info
    oauth2Client.setCredentials(tokens)
    const youtube = google.youtube({ version: "v3", auth: oauth2Client })
    const channelRes = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    })
    const channel = channelRes.data.items?.[0]

    // save to ConnectedAccount
    await prisma.connectedAccount.upsert({
      where: {
        userId_platform: {
          userId: userId as string,
          platform: "YOUTUBE",
        }
      },
      update: {
        accessToken: access_token!,
        refreshToken: refresh_token ?? undefined,
        expiresAt: expiry_date ? new Date(expiry_date) : null,
        accountName: channel?.snippet?.title ?? null,
        accountId: channel?.id ?? null,
      },
      create: {
        userId: userId as string,
        platform: "YOUTUBE",
        accessToken: access_token!,
        refreshToken: refresh_token!,
        expiresAt: expiry_date ? new Date(expiry_date) : null,
        accountName: channel?.snippet?.title ?? null,
        accountId: channel?.id ?? null,
      }
    })

    // redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=youtube`)

  } catch (error) {
    console.error(error)
    sendError(res, 500, "Failed to connect YouTube", error)
  }
}




export const connectToFacebook = (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string
    if (!userId) return sendError(res, 400, "userId required")

    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      redirect_uri: `${process.env.BASE_URL}/api/connected/facebook/callback`,
      state: userId, 
      scope: [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "business_management",
      ].join(","),
      response_type: "code",
    })

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
    return res.redirect(authUrl)
  } catch (error) {
    sendError(res, 500, "Failed to connect facebook", error)
  }
}


export const getConnectedAccounts = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string

    const accounts = await prisma.connectedAccount.findMany({
      where: { userId },
      select: {
        id: true,                 // need this for the update
        platform: true,
        accountName: true,
        accountId: true,
        createdAt: true,
        expiresAt: true,
        refreshToken: true,
      },
    })

    const now = Date.now()
    const SKEW_MS = 60_000

    const normalized = await Promise.all(
      accounts.map(async (acc) => {
        const expiredAtMs = acc.expiresAt ? acc.expiresAt.getTime() : null
        const isExpired = expiredAtMs !== null && expiredAtMs - SKEW_MS <= now
        const canAutoRefresh = Boolean(acc.refreshToken)

        let status: "connected" | "expired" | "needs_reconnect" =
          !isExpired ? "connected" : canAutoRefresh ? "expired" : "needs_reconnect"

        let expiresAt = acc.expiresAt

        // Only try to refresh YouTube tokens that are expired but have a refresh token
        if (status === "expired" && acc.platform === "YOUTUBE") {
          try {
            const oauth2 = new google.auth.OAuth2(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET,
            )
            oauth2.setCredentials({ refresh_token: acc.refreshToken! })

            const { credentials } = await oauth2.refreshAccessToken()

            const newExpiresAt = credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : null

            await prisma.connectedAccount.update({
              where: { id: acc.id },
              data: {
                accessToken: credentials.access_token!,
                expiresAt: newExpiresAt,
                // Google sometimes rotates the refresh token — keep the new one if given
                ...(credentials.refresh_token
                  ? { refreshToken: credentials.refresh_token }
                  : {}),
              },
            })

            expiresAt = newExpiresAt
            status = "connected"
          } catch (err: any) {
            // invalid_grant => user revoked, password changed, token too old, etc.
            console.error(`Refresh failed for account ${acc.id}:`, err?.message)
            status = "needs_reconnect"
          }
        }

        return {
          id: acc.platform.toLowerCase(),
          platform: acc.platform,
          accountName: acc.accountName,
          accountId: acc.accountId,
          createdAt: acc.createdAt,
          expiresAt,
          status,
          needsReconnect: status === "needs_reconnect",
        }
      }),
    )

    return res.json({ accounts: normalized })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch accounts" })
  }
}

export const facebookCallback = async (req: Request, res: Response) => {
  try {
    const { code, state: userId, error: fbError, error_description } = req.query
    if (fbError) {
      return sendError(res, 400, `Facebook auth failed: ${error_description ?? fbError}`)
    }

    if (!code || !userId) return sendError(res, 400, "Missing code or userId")

    const redirectUri = `${process.env.BASE_URL}/api/connected/facebook/callback`

    const shortRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          redirect_uri: redirectUri,
          code: code as string,
        }),
    )
    const shortData = await shortRes.json()
    if (!shortRes.ok) return sendError(res, 400, "Token exchange failed", shortData)

    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.FACEBOOK_APP_ID!,
          client_secret: process.env.FACEBOOK_APP_SECRET!,
          fb_exchange_token: shortData.access_token,
        }),
    )
    const longData = await longRes.json()
    if (!longRes.ok) return sendError(res, 400, "Long-lived token exchange failed", longData)

    const userAccessToken: string = longData.access_token
    const expiresIn: number | undefined = longData.expires_in
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    // ✅ Fetch pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`,
    )
    const pagesData = await pagesRes.json()
    if (!pagesRes.ok) return sendError(res, 400, "Failed to fetch pages", pagesData)

    // ✅ Pick the first page (or you can let user choose later)
    const page = pagesData.data?.[0]
    if (!page) return sendError(res, 400, "No Facebook Pages found for this account")

    await prisma.connectedAccount.upsert({
      where: {
        userId_platform: {
          userId: userId as string,
          platform: "FACEBOOK",
        },
      },
      update: {
        accessToken: page.access_token,  // ✅ Page token (never expires)
        refreshToken: null,
        expiresAt,
        accountName: page.name,          // ✅ Page name
        accountId: page.id,              // ✅ Page ID
      },
      create: {
        userId: userId as string,
        platform: "FACEBOOK",
        accessToken: page.access_token,  // ✅ Page token
        refreshToken: null,
        expiresAt,
        accountName: page.name,          // ✅ Page name
        accountId: page.id,              // ✅ Page ID
      },
    })

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=facebook`)
  } catch (error) {
    console.error(error)
    sendError(res, 500, "Failed to connect Facebook", error)
  }
}

export const disconnectAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string
    const { platform } = req.params

    await prisma.connectedAccount.delete({
      where: {
        userId_platform: {
          userId,
          platform: platform.toUpperCase() as any,
        }
      }
    })

    res.status(200).json({ message: "Account disconnected" })
  } catch (error) {
    sendError(res, 500, "Internal server error", error)
  }
}