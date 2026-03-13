import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../../trpc/context.js'
import { ObservationService } from './observation.service.js'

const createObservationService = () => new ObservationService()

const createObservationSchema = z.object({
  patientId: z.string(),
  code: z.string(),
  value: z.number(),
  unit: z.string(),
  note: z.string().optional(),
})

export const observationRouter = createTRPCRouter({
  getLatest: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: string }
      return createObservationService().getLatestObservations(
        context.userId,
        context.role,
        input.limit ?? 10
      )
    }),

  getByPatientId: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: string }
      const inputData = input as { patientId: string; limit?: number }
      return createObservationService().getByPatientId(
        context.userId,
        context.role,
        inputData.patientId,
        inputData.limit ?? 20
      )
    }),

  create: protectedProcedure.input(createObservationSchema).mutation(async ({ ctx, input }) => {
    const context = ctx as { userId: string }
    const inputData = input as {
      patientId: string
      code: string
      value: number
      unit: string
      note?: string
    }
    return createObservationService().create(context.userId, inputData)
  }),

  getStats: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        code: z.string(),
        days: z.number().optional().default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: string }
      const inputData = input as {
        patientId: string
        code: string
        days?: number
      }
      return createObservationService().getStats(
        context.userId,
        context.role,
        inputData.patientId,
        inputData.code,
        inputData.days ?? 7
      )
    }),
})
