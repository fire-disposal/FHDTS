import { z } from 'zod'
import { adminProcedure, createTRPCRouter, protectedProcedure } from '../../trpc/context.js'
import { PatientService } from './patient.service.js'

const createPatientService = () => new PatientService()

const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  caregiverIds: z.array(z.string()).optional(),
})

const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  caregiverIds: z.array(z.string()).optional(),
})

export const patientRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        skip: z.number().optional().default(0),
        take: z.number().optional().default(20),
        status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: import('@prisma/client').Role }
      const inputData = input as {
        skip?: number
        take?: number
        status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
        search?: string
      }
      return createPatientService().getAllPatients(
        context.userId,
        context.role,
        inputData.skip ?? 0,
        inputData.take ?? 20,
        { status: inputData.status, search: inputData.search }
      )
    }),

  getById: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: import('@prisma/client').Role }
      const inputData = input as { patientId: string }
      return createPatientService().getPatientById(
        context.userId,
        context.role,
        inputData.patientId
      )
    }),

  create: protectedProcedure.input(createPatientSchema).mutation(async ({ ctx, input }) => {
    const context = ctx as { userId: string; role: import('@prisma/client').Role }
    return createPatientService().createPatient(context.userId, context.role, input as any)
  }),

  update: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        data: updatePatientSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: import('@prisma/client').Role }
      const inputData = input as {
        patientId: string
        data: {
          name?: string
          dateOfBirth?: Date
          gender?: string
          phone?: string
          address?: string
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
          caregiverIds?: string[]
        }
      }
      return createPatientService().updatePatient(
        context.userId,
        context.role,
        inputData.patientId,
        inputData.data
      )
    }),

  delete: adminProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: import('@prisma/client').Role }
      const inputData = input as { patientId: string }
      return createPatientService().deletePatient(context.userId, context.role, inputData.patientId)
    }),

  assignCaregiver: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        caregiverId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: import('@prisma/client').Role }
      const inputData = input as { patientId: string; caregiverId: string }
      return createPatientService().assignCaregiver(
        context.userId,
        context.role,
        inputData.patientId,
        inputData.caregiverId
      )
    }),

  removeCaregiver: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        caregiverId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string; role: import('@prisma/client').Role }
      const inputData = input as { patientId: string; caregiverId: string }
      return createPatientService().removeCaregiver(
        context.userId,
        context.role,
        inputData.patientId,
        inputData.caregiverId
      )
    }),
})
