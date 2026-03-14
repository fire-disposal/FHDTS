import { z } from 'zod'
import { prisma } from '../../../shared/infra/database'
import { adminProcedure, createTRPCRouter, protectedProcedure } from '../../../trpc/context'
import { createPatientService } from '../application/services/patient.service'

const patientService = createPatientService(prisma)

export const patientRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          take: z.number().optional(),
          skip: z.number().optional(),
          search: z.string().optional(),
          status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
        })
        .optional()
    )
    .query(({ input }) =>
      patientService.getAll(input?.take, input?.skip, input?.search, input?.status)
    ),

  getById: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(({ input }) => patientService.getById(input.patientId)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        dateOfBirth: z.date().optional(),
        gender: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        caregiverIds: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => patientService.create(input)),

  update: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        data: z.object({
          status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
          name: z.string().optional(),
          dateOfBirth: z.date().optional(),
          gender: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          caregiverIds: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(({ input }) => patientService.update(input.patientId, input.data)),

  delete: adminProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(({ input }) => patientService.delete(input.patientId)),

  assignCaregiver: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        caregiverId: z.string(),
      })
    )
    .mutation(({ input }) => patientService.assignCaregiver(input.patientId, input.caregiverId)),

  removeCaregiver: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        caregiverId: z.string(),
      })
    )
    .mutation(({ input }) => patientService.removeCaregiver(input.patientId, input.caregiverId)),
})
