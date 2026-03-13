import { z } from 'zod'
import { adminProcedure, createTRPCRouter, protectedProcedure } from '../../trpc/context.js'
import { UserService } from './user.service.js'

const createUserService = () => new UserService()

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'CAREGIVER', 'FAMILY']),
})

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'CAREGIVER', 'FAMILY']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const context = ctx as { userId: string }
    return createUserService().getProfile(context.userId)
  }),

  getAll: adminProcedure.query(async ({ ctx }) => {
    const context = ctx as { userId: string }
    return createUserService().getAllUsers(context.userId)
  }),

  getById: adminProcedure.input(z.object({ userId: z.string() })).query(async ({ ctx, input }) => {
    const context = ctx as { userId: string }
    const inputData = input as { userId: string }
    return createUserService().getUserById(context.userId, inputData.userId)
  }),

  create: adminProcedure.input(createUserSchema).mutation(async ({ ctx, input }) => {
    const context = ctx as { userId: string }
    const inputData = input as {
      email: string
      password: string
      name?: string
      role: 'ADMIN' | 'CAREGIVER' | 'FAMILY'
    }
    return createUserService().createUser(context.userId, inputData)
  }),

  update: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        data: updateUserSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string }
      const inputData = input as {
        userId: string
        data: {
          name?: string
          role?: 'ADMIN' | 'CAREGIVER' | 'FAMILY'
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
        }
      }
      return createUserService().updateUser(context.userId, inputData.userId, inputData.data)
    }),

  delete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string }
      const inputData = input as { userId: string }
      return createUserService().deleteUser(context.userId, inputData.userId)
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string }
      const inputData = input as { oldPassword: string; newPassword: string }
      return createUserService().changePassword(
        context.userId,
        inputData.oldPassword,
        inputData.newPassword
      )
    }),

  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const context = ctx as { userId: string }
      const inputData = input as { userId: string; newPassword: string }
      return createUserService().resetPassword(
        context.userId,
        inputData.userId,
        inputData.newPassword
      )
    }),
})
