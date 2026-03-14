import { z } from 'zod'
import { prisma } from '../../../../shared/platform/database.js'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../../../../trpc/context.js'
import { LoginCommand } from '../../application/commands/login.command.js'
import { RegisterCommand } from '../../application/commands/register.command.js'
import { GetAuthProfileQuery } from '../../application/queries/get-profile.query.js'
import { PrismaAuthUserAdapter } from '../prisma/auth-user.prisma.js'

const authUsers = new PrismaAuthUserAdapter(prisma)
const loginCommand = new LoginCommand(authUsers)
const registerCommand = new RegisterCommand(authUsers)
const profileQuery = new GetAuthProfileQuery(authUsers)

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(({ input }) => loginCommand.execute(input)),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      })
    )
    .mutation(({ input }) => registerCommand.execute(input)),

  getProfile: protectedProcedure.query(({ ctx }) => profileQuery.execute(ctx.userId)),

  logout: protectedProcedure.mutation(() => ({ success: true })),
})
