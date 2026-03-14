import { hashPassword } from './shared/platform/auth.js'
import { prisma } from './shared/platform/database.js'

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
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userPassword,
      name: '普通用户',
      role: 'USER',
      status: 'ACTIVE',
    },
  })

  console.log('✅ Seeding completed!')
  console.log('\n📋 Test accounts:')
  console.log('  Admin:  admin@example.com  / admin123')
  console.log('  User:   user@example.com   / user123')
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
