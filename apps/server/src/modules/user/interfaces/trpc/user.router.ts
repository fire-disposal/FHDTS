import { z } from 'zod'
import { prisma } from '../../../shared/infra/database'
import { adminProcedure, createTRPCRouter, protectedProcedure } from '../../../trpc/context'
import { createUserService } from '../application/services/user.service'

const userService = createUserService(prisma)

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(({ ctx }) => userService.getProfile(ctx.userId)),

  getAll: adminProcedure.query(() => userService.getAll()),

  getById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => userService.getById(input.userId)),

  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(['ADMIN', 'CAREGIVER', 'FAMILY']),
        password: z.string().min(6),
        name: z.string().optional(),
      })
    )
    .mutation(({ input }) => userService.create(input)),

  update: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        data: z.object({
          status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
          name: z.string().optional(),
          role: z.enum(['ADMIN', 'CAREGIVER', 'FAMILY']).optional(),
        }),
      })
    )
    .mutation(({ input }) => userService.update(input.userId, input.data)),

  delete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input }) => userService.delete(input.userId)),

  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(({ input, ctx }) =>
      userService.changePassword(ctx.userId, input.oldPassword, input.newPassword)
    ),

  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(({ input }) => userService.resetPassword(input.userId, input.newPassword)),
})
