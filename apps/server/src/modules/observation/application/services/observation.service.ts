import type { prisma } from '../../../shared/infra/database'
import { Service } from '../../../shared/kernel/base'
import { UnauthorizedError } from '../../../shared/kernel/errors'

interface CreateObservationInput {
  value: number
  code: string
  patientId: string
  unit: string
  note?: string
}

interface ObservationResponse {
  id: string
  patientId: string
  code: string
  value: number
  unit: string
  note?: string
  createdBy: string
}

export class ObservationService extends Service {
  private async verifyPatientAccess(patientId: string, userId: string): Promise<boolean> {
    // 检查当前用户是否是管理员或与患者有关联的护理人员
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return false
    }

    if (user.role === 'ADMIN') {
      return true
    }

    // 检查用户是否是患者的护理人员
    const connection = await this.db.patient.findFirst({
      where: {
        id: patientId,
        caregivers: {
          some: {
            id: userId,
          },
        },
      },
    })

    return !!connection
  }

  async getAll(): Promise<never[]> {
    // 返回空数组作为占位符，直到实现完整功能
    return []
  }

  async create(input: CreateObservationInput, userId: string): Promise<ObservationResponse> {
    // 验证用户是否有权为该患者添加观察数据
    const hasAccess = await this.verifyPatientAccess(input.patientId, userId) // 实际的角色信息需要从上下文传递

    if (!hasAccess) {
      throw new UnauthorizedError('You do not have access to this patient')
    }

    const observation = await this.db.observation.create({
      data: {
        value: input.value,
        code: input.code,
        unit: input.unit,
        note: input.note,
        patient: {
          connect: { id: input.patientId },
        },
        // 这里应该保存创建者的引用，但schema中没有此字段
      },
      select: {
        id: true,
        patientId: true,
        code: true,
        value: true,
        unit: true,
        note: true,
      },
    })

    return {
      ...observation,
      createdBy: userId, // 使用传入的userId作为创建者
      id: observation.id,
    }
  }

  async getByPatient(patientId: string, userId: string): Promise<never[]> {
    // 验证用户是否有权访问该患者的观察数据
    const hasAccess = await this.verifyPatientAccess(patientId, userId) // 实际的角色信息需要从上下文传递

    if (!hasAccess) {
      throw new UnauthorizedError('You do not have access to this patient')
    }

    // 返回空数组作为占位符，直到实现完整功能
    return []
  }
}

export function createObservationService(db: typeof prisma) {
  return new ObservationService(db)
}
