require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dev.db');
const prisma = new PrismaClient({
  datasourceUrl: `file:${dbPath}`,
});

async function main() {
  console.log('🌱 Seeding database...');

  // --- Roles ---
  const roles = ['Super Admin', 'HR Admin', 'Manager', 'Employee'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
  }
  console.log('✅ Roles seeded');

  // --- Permissions ---
  const perms = [
    { code: 'employees.view', description: 'View employees' },
    { code: 'employees.manage', description: 'Create/edit/delete employees' },
    { code: 'leave.view', description: 'View leave requests' },
    { code: 'leave.manage', description: 'Approve/reject leave' },
    { code: 'leave.request', description: 'Submit leave requests' },
    { code: 'attendance.view', description: 'View attendance' },
    { code: 'attendance.manage', description: 'Manage attendance' },
    { code: 'payroll.view', description: 'View payroll' },
    { code: 'payroll.manage', description: 'Manage payroll' },
    { code: 'announcements.view', description: 'View announcements' },
    { code: 'announcements.manage', description: 'Create/delete announcements' },
    { code: 'settings.manage', description: 'Manage system settings' },
  ];
  for (const p of perms) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log('✅ Permissions seeded');

  // --- Role-Permission mappings ---
  const superAdmin = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  const hrAdmin = await prisma.role.findUnique({ where: { name: 'HR Admin' } });
  const manager = await prisma.role.findUnique({ where: { name: 'Manager' } });
  const employee = await prisma.role.findUnique({ where: { name: 'Employee' } });
  const allPerms = await prisma.permission.findMany();

  // Super Admin gets all permissions
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: p.id } },
      update: {},
      create: { roleId: superAdmin.id, permissionId: p.id },
    });
  }

  // HR Admin gets most permissions
  const hrPerms = allPerms.filter(p => !p.code.startsWith('settings'));
  for (const p of hrPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: hrAdmin.id, permissionId: p.id } },
      update: {},
      create: { roleId: hrAdmin.id, permissionId: p.id },
    });
  }

  // Manager gets view + leave management
  const mgrPerms = allPerms.filter(p =>
    p.code.includes('.view') || p.code === 'leave.manage' || p.code === 'leave.request'
  );
  for (const p of mgrPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: manager.id, permissionId: p.id } },
      update: {},
      create: { roleId: manager.id, permissionId: p.id },
    });
  }

  // Employee gets basic permissions
  const empPerms = allPerms.filter(p =>
    p.code === 'leave.request' || p.code === 'announcements.view' || p.code === 'attendance.view'
  );
  for (const p of empPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employee.id, permissionId: p.id } },
      update: {},
      create: { roleId: employee.id, permissionId: p.id },
    });
  }
  console.log('✅ Role-permissions seeded');

  // --- Employees ---
  const emp1 = await prisma.employee.upsert({
    where: { id: 1 },
    update: {},
    create: {
      empNo: 'EMP-001',
      firstName: 'Dennis',
      lastName: 'Sotto',
      email: 'sottodennis@gmail.com',
      phone: '+971 50 123 4567',
      department: 'Management',
      position: 'System Administrator',
      joinDate: '2024-01-15',
      status: 'Active',
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { id: 2 },
    update: {},
    create: {
      empNo: 'EMP-002',
      firstName: 'Sarah',
      lastName: 'Ahmed',
      email: 'employee@mabdc.org',
      phone: '+971 55 987 6543',
      department: 'Human Resources',
      position: 'HR Coordinator',
      joinDate: '2024-03-01',
      status: 'Active',
    },
  });

  const emp3 = await prisma.employee.upsert({
    where: { id: 3 },
    update: {},
    create: {
      empNo: 'EMP-003',
      firstName: 'Ahmed',
      lastName: 'Al Mansouri',
      email: 'ahmed.mansouri@company.ae',
      phone: '+971 52 111 2233',
      department: 'Engineering',
      position: 'Senior Developer',
      joinDate: '2024-02-10',
      status: 'Active',
    },
  });

  const emp4 = await prisma.employee.upsert({
    where: { id: 4 },
    update: {},
    create: {
      empNo: 'EMP-004',
      firstName: 'Fatima',
      lastName: 'Al Hashimi',
      email: 'fatima.hashimi@company.ae',
      phone: '+971 56 444 5566',
      department: 'Finance',
      position: 'Finance Manager',
      joinDate: '2023-11-20',
      status: 'Active',
    },
  });

  const emp5 = await prisma.employee.upsert({
    where: { id: 5 },
    update: {},
    create: {
      empNo: 'EMP-005',
      firstName: 'Mohammed',
      lastName: 'Khan',
      email: 'mohammed.khan@company.ae',
      phone: '+971 58 777 8899',
      department: 'Operations',
      position: 'Operations Lead',
      joinDate: '2024-04-05',
      status: 'Active',
    },
  });
  console.log('✅ Employees seeded');

  // --- Users ---
  const hash = await bcrypt.hash('Denskie123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'sottodennis@gmail.com' },
    update: {},
    create: {
      email: 'sottodennis@gmail.com',
      passwordHash: hash,
      displayName: 'Dennis Sotto',
      employeeId: emp1.id,
    },
  });

  const empUser = await prisma.user.upsert({
    where: { email: 'employee@mabdc.org' },
    update: {},
    create: {
      email: 'employee@mabdc.org',
      passwordHash: hash,
      displayName: 'Sarah Ahmed',
      employeeId: emp2.id,
    },
  });
  console.log('✅ Users seeded');

  // --- User-Role assignments ---
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdmin.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: empUser.id, roleId: employee.id } },
    update: {},
    create: { userId: empUser.id, roleId: employee.id },
  });
  console.log('✅ User-roles seeded');

  // --- Leave Types ---
  const leaveTypes = [
    { name: 'Annual Leave', code: 'AL', maxDays: 30, isPaid: 1 },
    { name: 'Sick Leave', code: 'SL', maxDays: 15, isPaid: 1 },
    { name: 'Maternity Leave', code: 'ML', maxDays: 60, isPaid: 1 },
    { name: 'Unpaid Leave', code: 'UL', maxDays: 30, isPaid: 0 },
    { name: 'Emergency Leave', code: 'EL', maxDays: 5, isPaid: 1 },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { id: leaveTypes.indexOf(lt) + 1 },
      update: {},
      create: lt,
    });
  }
  console.log('✅ Leave types seeded');

  // --- Sample Announcements ---
  await prisma.announcement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Welcome to MABDC HR Portal',
      body: 'We are excited to launch our new HR management system. All employees can now manage their leave requests, view attendance, and stay updated with company announcements through this portal.',
      priority: 'high',
    },
  });
  await prisma.announcement.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Q1 2026 Performance Reviews',
      body: 'Performance review cycle for Q1 2026 begins on March 1st. Please ensure all self-assessments are completed by March 15th.',
      priority: 'normal',
    },
  });
  console.log('✅ Announcements seeded');

  // --- Sample Attendance ---
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    await prisma.attendance.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        employeeId: emp2.id,
        date: dateStr,
        timeIn: '08:00',
        timeOut: i === 0 ? null : '17:00',
        totalHours: i === 0 ? null : 9,
        overtimeHours: i === 0 ? null : (i % 2 === 0 ? 1 : 0),
      },
    });
  }
  console.log('✅ Sample attendance seeded');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
