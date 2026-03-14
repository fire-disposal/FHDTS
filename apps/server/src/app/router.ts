import { authRouter } from '../modules/auth/adapters/trpc/auth.router.js'
import { userRouter } from '../modules/user/adapters/trpc/user.router.js'
import { createTRPCRouter } from '../trpc/context.js'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
