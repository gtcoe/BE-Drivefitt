module.exports = {
  dev: {
    BUCKET_PUBLIC_URL: process.env.BUCKET_PUBLIC_URL,
    BUCKET_PUBLIC: process.env.BUCKET_PUBLIC,
    BUCKET: process.env.BUCKET,
    REGION: process.env.REGION,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
  },
  prod: {
    BUCKET_PUBLIC_URL: process.env.BUCKET_PUBLIC_URL,
    BUCKET_PUBLIC: process.env.BUCKET_PUBLIC,
    BUCKET: process.env.BUCKET,
    REGION: process.env.REGION,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
  },
};
