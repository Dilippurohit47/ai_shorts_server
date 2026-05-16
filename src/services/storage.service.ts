import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createReadStream, createWriteStream } from "fs"
import { pipeline } from "stream/promises"
import { r2, R2_BUCKET } from "../lib/r2"

export const storage = {
  async uploadFile(localPath: string, key: string, contentType?: string) {
    const upload = new Upload({
      client: r2,
      params: {
        Bucket: R2_BUCKET,
        Key: key,
        Body: createReadStream(localPath),
        ContentType: contentType,
      },
    })
    await upload.done()
    return key
  },

  async downloadFile(key: string, localPath: string) {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
    )
    await pipeline(
      res.Body as NodeJS.ReadableStream,
      createWriteStream(localPath)
    )
    return localPath
  },

  async exists(key: string): Promise<boolean> {
    try {
      await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
      return true
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw err
    }
  },

  async deleteFile(key: string) {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
  },

  async getPresignedUrl(key: string, expiresInSeconds = 3600) {
    return getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { expiresIn: expiresInSeconds }
    )
  },
}