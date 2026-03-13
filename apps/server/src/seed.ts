import { hashPassword } from './shared/infra/auth.js'
import { prisma } from './shared/infra/prisma.js'

async function seed() {
  console.log('Seeding database...')

  const adminPassword = await hashPassword('admin123')
  const userPassword = await hashPassword('user123')

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: '系统管理员',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })

  await prisma.user.upsert({
    where: { email: 'caregiver@example.com' },
    update: {},
    create: {
      email: 'caregiver@example.com',
      passwordHash: userPassword,
      name: '护理人员',
      role: 'CAREGIVER',
      status: 'ACTIVE',
    },
  })

  await prisma.user.upsert({
    where: { email: 'family@example.com' },
    update: {},
    create: {
      email: 'family@example.com',
      passwordHash: userPassword,
      name: '家属用户',
      role: 'FAMILY',
      status: 'ACTIVE',
    },
  })

  const caregiver = await prisma.user.findUnique({
    where: { email: 'caregiver@example.com' },
  })

  await prisma.patient.upsert({
    where: { id: 'patient-1' },
    update: {},
    create: {
      id: 'patient-1',
      name: '张三',
      dateOfBirth: new Date('1950-01-15'),
      gender: '男',
      phone: '13800138001',
      address: '北京市朝阳区 XX 小区 1-101',
      status: 'ACTIVE',
      caregivers: caregiver ? { connect: { id: caregiver.id } } : undefined,
    },
  })

  await prisma.patient.upsert({
    where: { id: 'patient-2' },
    update: {},
    create: {
      id: 'patient-2',
      name: '李四',
      dateOfBirth: new Date('1955-06-20'),
      gender: '女',
      phone: '13800138002',
      address: '北京市海淀区 XX 小区 2-202',
      status: 'ACTIVE',
    },
  })

  await prisma.observation.createMany({
    data: [
      {
        patientId: 'patient-1',
        code: 'blood-pressure',
        value: 120,
        unit: 'mmHg',
        note: '收缩压',
        timestamp: new Date(),
      },
      {
        patientId: 'patient-1',
        code: 'heart-rate',
        value: 72,
        unit: 'bpm',
        timestamp: new Date(),
      },
      {
        patientId: 'patient-1',
        code: 'blood-sugar',
        value: 5.6,
        unit: 'mmol/L',
        timestamp: new Date(),
      },
      {
        patientId: 'patient-2',
        code: 'blood-pressure',
        value: 135,
        unit: 'mmHg',
        note: '收缩压偏高',
        timestamp: new Date(),
      },
      {
        patientId: 'patient-2',
        code: 'heart-rate',
        value: 68,
        unit: 'bpm',
        timestamp: new Date(),
      },
    ],
  })

  await prisma.device.createMany({
    data: [
      {
        name: '血压计 A',
        type: 'blood-pressure-monitor',
        serialNumber: 'BP-2024-001',
        patientId: 'patient-1',
        status: 'ACTIVE',
        lastSeenAt: new Date(),
      },
      {
        name: '血糖仪 B',
        type: 'glucose-monitor',
        serialNumber: 'GM-2024-002',
        patientId: 'patient-1',
        status: 'ACTIVE',
        lastSeenAt: new Date(),
      },
    ],
  })

  console.log('✅ Seeding completed!')
  console.log('\n📋 Test accounts:')
  console.log('  Admin:    admin@example.com    / admin123')
  console.log('  Caregiver: caregiver@example.com / user123')
  console.log('  Family:   family@example.com   / user123')
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
