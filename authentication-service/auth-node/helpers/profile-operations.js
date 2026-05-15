import crypto from 'crypto';
import path from 'path';
import { findUserById, updateUserProfileData, updateUserProfilePicture, resetUserProfilePicture } from './user-db.js';
import { buildUserResponse } from '../utils/user-helpers.js';
import { uploadImage } from './cloudinary-service.js';
import { config } from '../configs/config.js';

export const getUserProfileHelper = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return buildUserResponse(user);
};

export const updateUserProfileHelper = async (userId, profileData) => {
  const updatedUser = await updateUserProfileData(userId, profileData);
  return buildUserResponse(updatedUser);
};

export const updateUserProfilePictureHelper = async (userId, file) => {
  if (!file) {
    const err = new Error('No se subió ninguna imagen');
    err.status = 400;
    throw err;
  }

  const ext = path.extname(file.originalname);
  const randomHex = crypto.randomBytes(6).toString('hex');
  const cloudinaryFileName = `profile-${randomHex}${ext}`;
  const uploadedFilename = await uploadImage(file.path, cloudinaryFileName);

  const updatedUser = await updateUserProfilePicture(userId, uploadedFilename);
  return buildUserResponse(updatedUser);
};

export const deleteUserProfilePictureHelper = async (userId) => {
  const updatedUser = await resetUserProfilePicture(userId);
  return buildUserResponse(updatedUser);
};
