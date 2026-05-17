import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3006,
  jwtSecret: process.env.JWT_SECRET || 'changeme',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'gestionbancario/profiles',
    baseUrl: process.env.CLOUDINARY_BASE_URL,
    defaultAvatar: process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME
  },
  db: {
    dialect: process.env.DB_DIALECT || 'postgres',
    name: process.env.DB_NAME || 'gestionbanco',
    user: process.env.DB_USER || 'admin',
    pass: process.env.DB_PASS || 'admin123',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    storage: process.env.DB_STORAGE || './database.sqlite'
  }
};
