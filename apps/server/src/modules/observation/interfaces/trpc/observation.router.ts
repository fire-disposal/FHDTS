import { z } from 'zod'
import { prisma } from '../../../shared/infra/database'
import { createTRPCRouter, protectedProcedure } from '../../../trpc/context'
import { createObservationService } from '../application/services/observation.service'

const observationService = createObservationService(prisma)

export const observationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(() => observationService.getAll()),

  create: protectedProcedure
    .input(
      z.object({
        value: z.number(),
        code: z.string(),
        patientId: z.string(),
        unit: z.string(),
        note: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => observationService.create(input, ctx.userId)),

  getByPatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(({ input, ctx }) => observationService.getByPatient(input.patientId, ctx.userId)),
})
