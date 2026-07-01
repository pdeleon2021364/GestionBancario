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

export const verifyPassword = async (hashedPassword, plainPassword) => {
  try {
    // Primero intentar verificación directa con argon2 (formato Node.js nativo)
    try {
      const result = await argon2.verify(hashedPassword, plainPassword);
      if (result) return true;
    } catch {
      // Continue to manual verification
    }

    // Si es un hash de .NET, usar verificación manual
    if (hashedPassword.startsWith('$argon2id$v=19$')) {
      // Minimal stub: always return false (not implemented)
      // Replace with real .NET Argon2 hash verification if needed
      return false;
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
