import { z } from 'zod'
import { prisma } from '../../../../shared/platform/database.js'
import { adminProcedure, createTRPCRouter, protectedProcedure } from '../../../../trpc/context.js'
import { ChangePasswordCommand } from '../../application/commands/change-password.command.js'
import { CreateUserCommand } from '../../application/commands/create-user.command.js'
import { DeleteUserCommand } from '../../application/commands/delete-user.command.js'
import { ResetPasswordCommand } from '../../application/commands/reset-password.command.js'
import { UpdateUserCommand } from '../../application/commands/update-user.command.js'
import { GetAllUsersQuery } from '../../application/queries/get-all-users.query.js'
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id.query.js'
import { GetUserProfileQuery } from '../../application/queries/get-profile.query.js'
import { PrismaUserAdapter } from '../prisma/user.prisma.js'

const users = new PrismaUserAdapter(prisma)

const getProfileQuery = new GetUserProfileQuery(users)
const getAllUsersQuery = new GetAllUsersQuery(users)
const getUserByIdQuery = new GetUserByIdQuery(users)
const createUserCommand = new CreateUserCommand(users)
const updateUserCommand = new UpdateUserCommand(users)
const deleteUserCommand = new DeleteUserCommand(users)
const changePasswordCommand = new ChangePasswordCommand(users)
const resetPasswordCommand = new ResetPasswordCommand(users)

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(({ ctx }) => getProfileQuery.execute(ctx.userId)),

  getAll: adminProcedure.query(() => getAllUsersQuery.execute()),

  getById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getUserByIdQuery.execute(input.userId)),

  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(['ADMIN', 'USER']),
        password: z.string().min(6),
        name: z.string().optional(),
      })
    )
    .mutation(({ input }) => createUserCommand.execute(input)),

  update: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        data: z.object({
          status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
          name: z.string().optional(),
          role: z.enum(['ADMIN', 'USER']).optional(),
        }),
      })
    )
    .mutation(({ input }) => updateUserCommand.execute(input.userId, input.data)),

  delete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input }) => deleteUserCommand.execute(input.userId)),

  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(({ input, ctx }) =>
      changePasswordCommand.execute(ctx.userId, input.oldPassword, input.newPassword)
    ),

  resetPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(({ input }) => resetPasswordCommand.execute(input.userId, input.newPassword)),
})
