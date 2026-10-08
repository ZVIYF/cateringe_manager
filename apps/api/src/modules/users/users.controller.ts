import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { UserSchemas, ListQuery } from '@catering/shared';
import { duplicate, notFound } from '../../lib/errors';

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, q } = req.query as unknown as typeof ListQuery._type;

    // Build the query where clause if q is provided
    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' } // Simple sorting for now
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users.map((u) => UserSchemas.UserPublic.parse(u)),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = req.body as typeof UserSchemas.CreateUserBody._type;
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (existing) {
      return next(duplicate('אימייל כבר קיים במערכת', 'email'));
    }

    const passwordHash = await bcrypt.hash('Passw0rd!', 10);
    const user = await prisma.user.create({
      data: { ...data, passwordHash, active: true }
    });

    res.status(201).json({ data: UserSchemas.UserPublic.parse(user) });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const data = req.body as typeof UserSchemas.UpdateUserBody._type;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return next(notFound('משתמש לא נמצא'));
    }

    const updated = await prisma.user.update({
      where: { id },
      data
    });

    res.json({ data: UserSchemas.UserPublic.parse(updated) });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      return next(notFound('משתמש לא נמצא'));
    }

    const resetToken = 'dummy-reset-token-' + Date.now();
    await prisma.user.update({
      where: { id },
      data: {
        resetToken,
        resetTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    console.log(`[Mock Email] Password reset link for ${user.email}: http://localhost:5173/reset-password?token=${resetToken}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
