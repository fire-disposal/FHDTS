import { z } from 'zod'
import {
  createTRPCRouter,
  handleTRPCError,
  protectedProcedure,
  publicProcedure,
} from '../../trpc/context.js'
import { AuthService } from './auth.service.js'

const createAuthService = () => new AuthService()

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const inputData = input as { email: string; password: string }
        return await createAuthService().login(inputData.email, inputData.password)
      } catch (error) {
        throw handleTRPCError(error)
      }
    }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const inputData = input as { email: string; password: string; name?: string }
        return await createAuthService().register(
          inputData.email,
          inputData.password,
          inputData.name
        )
      } catch (error) {
        throw handleTRPCError(error)
      }
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const context = ctx as { userId: string }
      return await createAuthService().getProfile(context.userId)
    } catch (error) {
      throw handleTRPCError(error)
    }
  }),

  logout: protectedProcedure.mutation(async () => {
    return { success: true }
  }),
})
