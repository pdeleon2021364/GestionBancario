import { getDefaultAvatarUrl, getFullImageUrl } from '../services/cloudinary.service.js';

export const buildUserResponse = (user) => {
  const profilePicture = user.profilePicture
    ? getFullImageUrl(user.profilePicture)
    : getDefaultAvatarUrl();

  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    profilePicture,
    rol: user.rol,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};
