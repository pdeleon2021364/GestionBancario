import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockUploadImage = jest.fn().mockResolvedValue({
  public_id: 'test-image-id',
  secure_url: 'https://example.com/test-image-id.png'
});
const mockDeleteImage = jest.fn().mockResolvedValue({ result: 'ok' });
const mockGetDefaultAvatarUrl = jest.fn(() => 'https://example.com/default-avatar.png');
const mockGetFullImageUrl = jest.fn((value) => (value.startsWith('http') ? value : `https://example.com/${value}.png`));

jest.unstable_mockModule('../src/services/cloudinary.service.js', () => ({
  uploadImage: mockUploadImage,
  deleteImage: mockDeleteImage,
  getDefaultAvatarUrl: mockGetDefaultAvatarUrl,
  getFullImageUrl: mockGetFullImageUrl
}));

process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.CLOUDINARY_DEFAULT_AVATAR_FILENAME = 'https://example.com/default-avatar.png';
process.env.UPLOAD_PATH = './uploads-test';

const { createApp } = await import('../configs/app.js');
const { sequelize } = await import('../configs/db.js');

let app;

beforeAll(async () => {
  app = await createApp();
});

afterAll(async () => {
  await mongoose.connection.close();
  await sequelize.close();
});

describe('User profile endpoints', () => {
  test('register without profile receives default avatar', async () => {
    const response = await request(app)
      .post('/gestionbanco/v1/auth/register')
      .field('nombre', 'Test User')
      .field('email', 'testuser@example.com')
      .field('password', 'Password123');

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user).toHaveProperty('profilePicture', 'https://example.com/default-avatar.png');
    expect(response.body.user).toHaveProperty('email', 'testuser@example.com');
  });

  test('register with profile file uploads and returns Cloudinary URL', async () => {
    const response = await request(app)
      .post('/gestionbanco/v1/auth/register')
      .field('nombre', 'File User')
      .field('email', 'fileuser@example.com')
      .field('password', 'Password123')
      .attach('profilePicture', path.join(__dirname, 'fixtures', 'avatar.png'));

    expect(response.status).toBe(201);
    expect(mockUploadImage).toHaveBeenCalled();
    expect(response.body.success).toBe(true);
    expect(response.body.user.profilePicture).toBe('https://example.com/test-image-id.png');
  });

  test('update profile deletes previous Cloudinary image when replacing it', async () => {
    const registerResponse = await request(app)
      .post('/gestionbanco/v1/auth/register')
      .field('nombre', 'Update User')
      .field('email', 'updateuser@example.com')
      .field('password', 'Password123')
      .attach('profilePicture', path.join(__dirname, 'fixtures', 'avatar.png'));

    const userId = registerResponse.body.user.id;
    const token = jwt.sign({ sub: userId, role: 'USER_ROLE' }, process.env.JWT_SECRET, { expiresIn: '2h' });

    const updateResponse = await request(app)
      .put('/gestionbanco/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .field('profilePictureUrl', 'https://example.com/new-image.png');

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);
    expect(mockDeleteImage).toHaveBeenCalledWith('test-image-id');
    expect(updateResponse.body.user.profilePicture).toBe('https://example.com/new-image.png');
  });
});
