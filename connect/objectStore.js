
// import { createRequire } from "module";
// require('dotenv').config();

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
    S3Client, 
    S3ServiceException, 
    GetObjectCommand, 
    HeadObjectCommand, 
    CopyObjectCommand, 
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWSKEY,
        secretAccessKey: process.env.AWSSECRET
    }
});
import * as minio from 'minio'
var minioClient = null;
if (process.env.MINIOKEY && process.env.MINIOKEY != "" && process.env.MINIOENDPOINT && process.env.MINIOENDPOINT != "") {
   
        minioClient = new minio.Client({
        endPoint: process.env.MINIOENDPOINT,
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIOKEY,
        secretKey: process.env.MINIOSECRET
    });
}

///////////////////////// OBJECT STORE (S3, Minio, etc) OPS BELOW - TODO - fix minio, garage maybe?
export async function ReturnPresignedUrl(bucket, key, time) {
    
    if (minioClient) {
        return minioClient.presignedGetObject(bucket, key, time);
    } else {
        // return s3.getSignedUrl('getObject', {Bucket: bucket, Key: key, Expires: time}); //returns a promise if called in async function?
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          });
        return await getSignedUrl(s3, command, {expiresIn : time});
        // return url;
    } 
}

export async function ReturnPresignedUrlPut(bucket, key, time) {
    
    if (minioClient) {
        return minioClient.presignedPutObject(bucket, key, time);
    } else {
        // return s3.getSignedUrl('getObject', {Bucket: bucket, Key: key, Expires: time}); //returns a promise if called in async function?
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
          });
        return await getSignedUrl(s3, command, {expiresIn : time});
        // return url;
    } 
}

export async function DeleteObjects(bucket, objectKeys) { //s3.headObject == minio.statObject
    if (minioClient) {
                //todo!
    } else {

        const command = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: objectKeys,
        });
        
        try {
            const response = await s3.send(command);
            // await s3.waitUntilObjectNotExists(
            //     { Bucket: bucket, Key: key },
            //   );
            console.log("delete objects resp: " + response );
            return response;
            // return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                console.log("File does not exist: " + key);
                return "not found";
                // return false;
            }
            console.error(`Error checking file existence: ${error}`);
            return error;
            // return false;
        }
    }
}

export async function DeleteObject(bucket, key) { //s3.headObject == minio.statObject
    if (minioClient) {
                //todo!
    } else {

        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        
        try {
            await s3.send(command);
            await s3.waitUntilObjectNotExists(
                { Bucket: bucket, Key: key },
              );
            console.log("File deleted: " + JSON.stringify(data));
            return "deleted";
            // return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                console.log("File does not exist: " + key);
                return "not found";
                // return false;
            }
            console.error(`Error checking file existence: ${error}`);
            return error;
            // return false;
        }
    }
}

export async function ReturnObjectExists(bucket, key) { //s3.headObject == minio.statObject
    if (minioClient) {
                //todo!
    } else {

        const command = new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        
        try {
            let data = await s3.send(command);
            console.log("File exists: " + JSON.stringify(data));
            return { exists: true, error: null };
            // return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                console.log("File does not exist: " + key);
                return { exists: false, error: null };
                // return false;
            }
            console.error(`Error checking file existence: ${error}`);
            return { exists: false, error };
            // return false;
        }
    }
}

export async function ReturnObjectMetadata(bucket, key) { //s3.headObject == minio.statObject
    if (minioClient) {
                //todo!
    } else {

        const command = new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        });
    
        try {
            let data = await s3.send(command);
            console.log("File exists:" + data);
            // return { exists: true, error: null };
            return data;
        } catch (error) {
            if (error.name === 'NotFound') {
                console.log("File does not exist: "  + key);
                // return { exists: false, error: null };
                return error;
            }
            console.error(`Error checking file existence: ${error}`);
            // return { exists: false, error };
            return error;
        }
      
    }
}
export async function ListObjects(bucket, prefix) {
    try {
    
      const response = await s3.send(
        new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 1000000,
            Prefix: prefix
          }),
      );
      return await response;
    } catch (caught) {
        if (caught instanceof NoSuchKey) {
          console.error(
            `Error from S3 listing objects from "${bucket}". no such bucket exists.`,
          );
          return "error";
        } else if (caught instanceof S3ServiceException) {
          console.error(
            `Error from S3 while getting object from ${bucket}.  ${caught.name}: ${caught.message}`,
          );
          return "error";
        } else {
          throw caught;
        //   return caught;
        }
      }
}
export async function GetObject(bucket, key) {

    try {
        const response = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );
        // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
        const str = await response.Body.transformToString();
        // console.log(str);
        return str;
      } catch (caught) {
        if (caught instanceof NoSuchKey) {
          console.error(
            `Error from S3 while getting object "${key}" from "${bucket}". No such key exists.`,
          );
          return "error";
        } else if (caught instanceof S3ServiceException) {
          console.error(
            `Error from S3 while getting object from ${bucket}.  ${caught.name}: ${caught.message}`,
          );
          return "error";
        } else {
          throw caught;
        //   return caught;
        }
      }

}
export async function PutObject(bucket, key, body) {

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      });
    
      try {
        const response = await s3.send(command);
        console.log(response);
        return response;
      } catch (caught) {
        if (
          caught instanceof S3ServiceException &&
          caught.name === "EntityTooLarge"
        ) {
          console.error(chalk.red(
            `Error from S3 while uploading object to ${key}. \
    The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
    or the multipart upload API (5TB max).`,
          ));
          
        } else if (caught instanceof S3ServiceException) {
          console.error(chalk.red(
            `Error from S3 while uploading object to ${key}.  ${caught.name}: ${caught.message}`,
          ));
        } else {
          throw caught;
        }
        return caught;
      }

}
export async function CopyObject(targetBucket, copySource, key) {
    if (minioClient) {

    } else {
      
        const command = new CopyObjectCommand({
            Bucket: targetBucket,
            CopySource: copySource,
            Key: key
        });
        try {
            let data = await s3.send(command);

            return data;
        } catch (error) {
            if (error.name === 'NotFound') {
                console.log(chalk.magenta(`File does not exist: ${key}`));
                // return { exists: false, error: null };
                return error;
            }
            console.error(chalk.red(`Error copying: ${error}`));
            // return { exists: false, error };
            return error;
        }
    }
} 

