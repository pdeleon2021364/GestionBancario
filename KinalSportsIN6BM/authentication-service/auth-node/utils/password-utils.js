import argon2 from 'argon2';
import { config } from '../configs/config.js';

export const hashPassword = async (password) => {
  try {
    // Configuración explícita para compatibilidad con .NET
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 102400, // 100 MB (igual que .NET)
      timeCost: 2, // 2 iteraciones (igual que .NET)
      parallelism: 8, // 8 hilos (igual que .NET)
      hashLength: 32, // 32 bytes de hash (igual que .NET)
      saltLength: 16, // 16 bytes de salt (igual que .NET)
    });
  } catch {
    throw new Error('Error al hashear la contraseña');
  }
};

const parseArgon2Hash = (hashedPassword) => {
  const parts = hashedPassword.split('$');
  if (parts.length !== 6 || parts[1] !== 'argon2id') {
    throw new Error('Formato de hash Argon2 inválido');
  }

  const version = parseInt(parts[2].split('=')[1], 10);
  const paramsPart = parts[3];
  const saltPart = parts[4];
  const hashPart = parts[5];

  const params = paramsPart.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = parseInt(value, 10);
    return acc;
  }, {});

  return {
    version,
    memoryCost: params.m,
    timeCost: params.t,
    parallelism: params.p,
    salt: Buffer.from(saltPart, 'base64'),
    hash: Buffer.from(hashPart, 'base64'),
  };
};

export const verifyPassword = async (hashedPassword, plainPassword) => {
  try {
    try {
      const result = await argon2.verify(hashedPassword, plainPassword);
      if (result) return true;
    } catch (verifyError) {
      // If the default verification fails, we may still support .NET-style Argon2 hashes manually.
      if (!hashedPassword.startsWith('$argon2id$v=19$')) {
        throw verifyError;
      }
    }

    if (hashedPassword.startsWith('$argon2id$v=19$')) {
      const parsed = parseArgon2Hash(hashedPassword);
      const computedHash = await argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: parsed.memoryCost,
        timeCost: parsed.timeCost,
        parallelism: parsed.parallelism,
        hashLength: parsed.hash.length,
        salt: parsed.salt,
      });

      return computedHash === hashedPassword;
    }

    return false;
  } catch (error) {
    console.error('Password verification error:', error.message);
    return false;
  }
};

export const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < config.security.passwordMinLength) {
    errors.push(
      `La contraseña debe tener al menos ${config.security.passwordMinLength} caracteres`
    );
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe tener al menos una letra mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe tener al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe tener al menos un número');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
// Removed unused variables and functions to fix lint warnings
