import { z } from 'zod'
import { prisma } from '../../../../shared/infra/database.js'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../../../../trpc/context.js'
import { createAuthService } from '../../application/services/auth.service.js'

const authService = createAuthService(prisma)

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(({ input }) => authService.login(input)),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      })
    )
    .mutation(({ input }) => authService.register(input)),

  getProfile: protectedProcedure.query(({ ctx }) => authService.getProfile(ctx.userId)),

  logout: protectedProcedure.mutation(() => ({ success: true })),
})
