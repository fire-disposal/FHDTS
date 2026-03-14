import { authRouter } from '../modules/auth/interfaces/trpc/auth.router.js'
import { observationRouter } from '../modules/observation/interfaces/trpc/observation.router.js'
import { patientRouter } from '../modules/patient/interfaces/trpc/patient.router.js'
import { userRouter } from '../modules/user/interfaces/trpc/user.router.js'
import { createTRPCRouter } from '../trpc/context.js'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  patient: patientRouter,
  observation: observationRouter,
})

export type AppRouter = typeof appRouter
