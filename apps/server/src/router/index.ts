import { authRouter } from '../modules/auth/auth.router.js'
import { observationRouter } from '../modules/observation/observation.router.js'
import { patientRouter } from '../modules/patient/patient.router.js'
import { userRouter } from '../modules/user/user.router.js'
import { createTRPCRouter } from '../trpc/context.js'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  patient: patientRouter,
  observation: observationRouter,
})

export type AppRouter = typeof appRouter
