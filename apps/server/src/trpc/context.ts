import { TRPCError, initTRPC } from '@trpc/server'
import SuperJSON from 'superjson'
import { verifyToken } from '../shared/platform/auth.js'
import { prisma } from '../shared/platform/database.js'

interface TRPCContext {
  userId?: string
  email?: string
}

interface AuthenticatedContext {
  userId: string
  email: string
  role: 'ADMIN' | 'USER'
}

export type { AuthenticatedContext, TRPCContext }

export async function createTRPCContext(opts: {
  req: { headers: Record<string, string | string[] | undefined> }
}): Promise<TRPCContext> {
  const rawAuthHeader = opts.req.headers.authorization
  const authHeader = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload) {
      return { userId: payload.userId, email: payload.email }
    }
  }

  return {}
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: SuperJSON,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

const requireAuth = t.middleware(async opts => {
  const { ctx } = opts

  if (!ctx.userId || !ctx.email) {
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
      email: ctx.email,
      role: user.role,
    } as AuthenticatedContext,
  })
})

export const protectedProcedure = t.procedure.use(requireAuth)

export const adminProcedure = protectedProcedure.use(async opts => {
  if (opts.ctx.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }

  return opts.next()
})
