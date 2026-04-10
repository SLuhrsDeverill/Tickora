import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { getRedis } from '../../config/redis';
import { AppError } from '../../middlewares/error.middleware';
import { LoginDto } from './auth.dto';

const JWT_SECRET = process.env['JWT_SECRET'] || 'secret';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'refresh_secret';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export class AuthService {
  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

    // Store refresh token in Redis
    const redis = getRedis();
    await redis.setex(`refresh:${user.id}`, REFRESH_TOKEN_TTL, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        position: user.position,
        avatar: user.avatar,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: { userId: string; email: string; role: string };

    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as typeof payload;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const redis = getRedis();
    const storedToken = await redis.get(`refresh:${payload.userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new AppError('Refresh token revoked', 401);
    }

    const newPayload = { userId: payload.userId, email: payload.email, role: payload.role };
    const accessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return { accessToken };
  }

  async logout(userId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`refresh:${userId}`);
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}

export const authService = new AuthService();
