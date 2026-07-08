import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { config } from '../configs/config.js';

const CLOUDINARY_FOLDER = config.cloudinary.folder;
const CLOUDINARY_DEFAULT_AVATAR_FILENAME = config.cloudinary.defaultAvatar;
const CLOUDINARY_BASE_URL = config.cloudinary.baseUrl;

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true
});

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const getPublicIdFromUrl = (value) => {
  if (!value) return null;
  if (!isHttpUrl(value)) return value;

  try {
    const url = new URL(value);
    const marker = '/image/upload/';
    const index = url.pathname.indexOf(marker);
    if (index === -1) {
      return null;
    }

    let publicId = url.pathname.slice(index + marker.length);
    publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
    publicId = publicId.replace(/^v\d+\//, '');

    return publicId;
  } catch {
    return null;
  }
};

export const uploadImage = async (filePath, publicId) => {
  const uploadResult = await cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    folder: CLOUDINARY_FOLDER,
    overwrite: true,
    resource_type: 'image'
  });

  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Error eliminando archivo temporal después de la subida:', error);
  }

  return {
    public_id: uploadResult.public_id,
    secure_url: uploadResult.secure_url
  };
};

export const deleteImage = async (imageIdentifier) => {
  if (!imageIdentifier) return null;

  const publicId = getPublicIdFromUrl(imageIdentifier);
  if (!publicId) return null;

  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error('Error eliminando imagen en Cloudinary:', error);
    return null;
  }
};

export const getFullImageUrl = (imageIdentifier) => {
  if (!imageIdentifier) {
    return getDefaultAvatarUrl();
  }

  if (isHttpUrl(imageIdentifier)) {
    return imageIdentifier;
  }

  if (CLOUDINARY_BASE_URL) {
    return `${CLOUDINARY_BASE_URL}/${imageIdentifier}`;
  }

  return cloudinary.url(imageIdentifier, { secure: true });
};

export const getDefaultAvatarUrl = () => {
  if (!CLOUDINARY_DEFAULT_AVATAR_FILENAME) {
    return null;
  }

  return isHttpUrl(CLOUDINARY_DEFAULT_AVATAR_FILENAME)
    ? CLOUDINARY_DEFAULT_AVATAR_FILENAME
    : getFullImageUrl(CLOUDINARY_DEFAULT_AVATAR_FILENAME);
};
