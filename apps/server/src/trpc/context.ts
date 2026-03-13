import { initTRPC, TRPCError } from '@trpc/server'
import { verifyToken } from '../shared/infra/auth.js'
import { prisma } from '../shared/infra/database.js'

interface TRPCContext {
  userId?: string
  email?: string
  role?: string
}

interface AuthenticatedContext {
  userId: string
  email: string
  role: string
}

export type { TRPCContext, AuthenticatedContext }

export const createTRPCContext = async ({ req }: { req: Request }): Promise<TRPCContext> => {
  const authHeader = req.headers.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const payload = verifyToken(token)

    if (payload) {
      return { userId: payload.userId, email: payload.email }
    }
  }

  return {}
}

const t = initTRPC.context<TRPCContext>().create()

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async opts => {
  const { ctx } = opts

  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' })
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { role: true, status: true },
  })

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found' })
  }

  if (user.status !== 'ACTIVE') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is not active' })
  }

  return opts.next({
    ctx: {
      userId: ctx.userId,
      email: ctx.email!,
      role: user.role,
    },
  })
})

export const adminProcedure = t.procedure.use(async opts => {
  const { ctx } = opts

  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' })
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { role: true, status: true },
  })

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found' })
  }

  if (user.status !== 'ACTIVE') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is not active' })
  }

  if (user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }

  return opts.next({
    ctx: {
      userId: ctx.userId,
      email: ctx.email!,
      role: user.role,
    },
  })
})

export function handleTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error
  }

  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      return new TRPCError({ code: 'NOT_FOUND', message: error.message })
    }
    if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
      return new TRPCError({ code: 'UNAUTHORIZED', message: error.message })
    }
    if (error.message.includes('Admin access required') || error.message.includes('Forbidden')) {
      return new TRPCError({ code: 'FORBIDDEN', message: error.message })
    }
  }

  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' })
}
