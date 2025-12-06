// src/services/s3Service.js
import { s3Client } from '../../config/s3Config.js';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/* -----------------------------------------------------------
   Helper: Convert S3 Readable Stream → Buffer
----------------------------------------------------------- */
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

/* -----------------------------------------------------------
   PUT OBJECT — upload file (Buffer or Base64 string)
----------------------------------------------------------- */
export const putFile = async (
  bucket,
  key,
  data,
  contentType = 'application/octet-stream'
) => {
  const body = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');

  return await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
};

/* -----------------------------------------------------------
   GET OBJECT — returns { base64, buffer }
----------------------------------------------------------- */
export const getFile = async (bucket, key) => {
  const res = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const buffer = await streamToBuffer(res.Body);

  return {
    buffer,
    base64: buffer.toString('base64'),
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
};

/* -----------------------------------------------------------
   DELETE OBJECT
----------------------------------------------------------- */
export const deleteFile = async (bucket, key) => {
  return await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
};

/* -----------------------------------------------------------
   LIST OBJECTS (optional helper)
----------------------------------------------------------- */
export const listFiles = async (bucket, prefix = '') => {
  const res = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    })
  );

  return res.Contents || [];
};
