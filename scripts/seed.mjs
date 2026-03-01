import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Roles
    const roles = ['Super Admin', 'HR Admin', 'Manager', 'Employee'];
    for (const name of roles) {
        await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: name + ' role' } });
    }
    console.log('Roles done');

    // Permissions
    const perms = [
        { code: 'employees.view', description: 'View employees' },
        { code: 'employees.manage', description: 'Manage employees' },
        { code: 'leave.view', description: 'View leave' },
        { code: 'leave.manage', description: 'Manage leave' },
        { code: 'leave.request', description: 'Request leave' },
        { code: 'attendance.view', description: 'View attendance' },
        { code: 'attendance.manage', description: 'Manage attendance' },
        { code: 'payroll.view', description: 'View payroll' },
        { code: 'payroll.manage', description: 'Manage payroll' },
        { code: 'announcements.view', description: 'View announcements' },
        { code: 'announcements.manage', description: 'Manage announcements' },
        { code: 'settings.manage', description: 'Manage settings' },
    ];
    for (const p of perms) {
        await prisma.permission.upsert({ where: { code: p.code }, update: {}, create: p });
    }
    console.log('Permissions done');

    const superAdmin = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
    const hrAdmin = await prisma.role.findUnique({ where: { name: 'HR Admin' } });
    const manager = await prisma.role.findUnique({ where: { name: 'Manager' } });
    const employee = await prisma.role.findUnique({ where: { name: 'Employee' } });
    const allPerms = await prisma.permission.findMany();

    for (const p of allPerms) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: p.id } },
            update: {}, create: { roleId: superAdmin.id, permissionId: p.id },
        });
    }
    for (const p of allPerms.filter(p => !p.code.startsWith('settings'))) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: hrAdmin.id, permissionId: p.id } },
            update: {}, create: { roleId: hrAdmin.id, permissionId: p.id },
        });
    }
    for (const p of allPerms.filter(p => p.code.includes('.view') || p.code === 'leave.manage' || p.code === 'leave.request')) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: manager.id, permissionId: p.id } },
            update: {}, create: { roleId: manager.id, permissionId: p.id },
        });
    }
    for (const p of allPerms.filter(p => ['leave.request', 'announcements.view', 'attendance.view'].includes(p.code))) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: employee.id, permissionId: p.id } },
            update: {}, create: { roleId: employee.id, permissionId: p.id },
        });
    }
    console.log('Role-permissions done');

    // Departments
    const depts = ['Management', 'Human Resources', 'Engineering', 'Finance', 'Operations', 'Sales'];
    const deptRows = [];
    for (const name of depts) {
        deptRows.push(await prisma.department.upsert({ where: { name }, update: {}, create: { name, description: name + ' Department' } }));
    }
    console.log('Departments done');

    // Positions
    const posList = [
        { title: 'System Administrator', level: 'Senior' },
        { title: 'IT Helpdesk Intern', level: 'Intern' },
        { title: 'Accounting Assistant Intern', level: 'Intern' },
        { title: 'Health and Safety Officer Assistant Intern', level: 'Intern' },
        { title: 'Human Resource Assistant Intern', level: 'Intern' },
        { title: 'Safety Officer Assistant Intern', level: 'Intern' }
    ];
    const posRows = [];
    for (const p of posList) {
        posRows.push(await prisma.position.upsert({ where: { title: p.title }, update: {}, create: p }));
    }
    console.log('Positions done');

    // Shifts
    const shiftList = [
        { name: 'Standard Day', startTime: '09:00', endTime: '18:00', workDays: 'Mon,Tue,Wed,Thu,Fri' },
        { name: 'Morning Shift', startTime: '06:00', endTime: '14:00', workDays: 'Mon,Tue,Wed,Thu,Fri' },
        { name: 'Night Shift', startTime: '22:00', endTime: '06:00', workDays: 'Mon,Tue,Wed,Thu,Sun' },
    ];
    for (const s of shiftList) {
        await prisma.shift.upsert({ where: { name: s.name }, update: {}, create: s });
    }
    console.log('Shifts done');

    // Benefits
    const benefitList = [
        { name: 'Housing Allowance', type: 'Allowance', amount: 3000, description: 'Monthly housing allowance' },
        { name: 'Transport Allowance', type: 'Allowance', amount: 1500, description: 'Monthly transport allowance' },
        { name: 'Premium Health Insurance', type: 'Insurance', amount: null, description: 'Full family coverage' },
        { name: 'Late Penalty', type: 'Deduction', amount: 100, description: 'Deduction for late arrival without notice' },
    ];
    for (const b of benefitList) {
        await prisma.benefit.upsert({ where: { name: b.name }, update: {}, create: b });
    }
    console.log('Benefits done');

    const emp1 = await prisma.employee.upsert({ where: { id: 1 }, update: { departmentId: deptRows[0].id, positionId: posRows[0].id, basicSalary: 15000, bankName: 'Emirates NBD', iban: 'AE120260000000123456789', routingCode: 'ENBD1234' }, create: { empNo: 'EMP-001', firstName: 'Dennis', lastName: 'Sotto', email: 'sottodennis@gmail.com', phone: '+971 50 123 4567', departmentId: deptRows[0].id, positionId: posRows[0].id, joinDate: '2024-01-15', status: 'Active', basicSalary: 15000, bankName: 'Emirates NBD', iban: 'AE120260000000123456789', routingCode: 'ENBD1234' } });
    const emp2 = await prisma.employee.upsert({ where: { id: 2 }, update: { departmentId: deptRows[1].id, positionId: posRows[1].id, basicSalary: 8000, bankName: 'ADCB', iban: 'AE890330000000234567890', routingCode: 'ADCB890' }, create: { empNo: 'EMP-002', firstName: 'Sarah', lastName: 'Ahmed', email: 'employee@mabdc.org', phone: '+971 55 987 6543', departmentId: deptRows[1].id, positionId: posRows[1].id, joinDate: '2024-03-01', status: 'Active', basicSalary: 8000, bankName: 'ADCB', iban: 'AE890330000000234567890', routingCode: 'ADCB890' } });
    await prisma.employee.upsert({ where: { id: 3 }, update: { departmentId: deptRows[2].id, positionId: posRows[2].id, basicSalary: 12000, bankName: 'Dubai Islamic Bank', iban: 'AE450240000000345678901', routingCode: 'DIB450' }, create: { empNo: 'EMP-003', firstName: 'Ahmed', lastName: 'Al Mansouri', email: 'ahmed.mansouri@company.ae', phone: '+971 52 111 2233', departmentId: deptRows[2].id, positionId: posRows[2].id, joinDate: '2024-02-10', status: 'Active', basicSalary: 12000, bankName: 'Dubai Islamic Bank', iban: 'AE450240000000345678901', routingCode: 'DIB450' } });
    await prisma.employee.upsert({ where: { id: 4 }, update: { departmentId: deptRows[3].id, positionId: posRows[3].id, basicSalary: 9500, bankName: 'Mashreq', iban: 'AE670310000000456789012', routingCode: 'MSHQ670' }, create: { empNo: 'EMP-004', firstName: 'Fatima', lastName: 'Al Hashimi', email: 'fatima.hashimi@company.ae', phone: '+971 56 444 5566', departmentId: deptRows[3].id, positionId: posRows[3].id, joinDate: '2023-11-20', status: 'Active', basicSalary: 9500, bankName: 'Mashreq', iban: 'AE670310000000456789012', routingCode: 'MSHQ670' } });
    await prisma.employee.upsert({ where: { id: 5 }, update: { departmentId: deptRows[4].id, positionId: posRows[4].id, basicSalary: 11000, bankName: 'Rakbank', iban: 'AE230410000000567890123', routingCode: 'RAK230' }, create: { empNo: 'EMP-005', firstName: 'Mohammed', lastName: 'Khan', email: 'mohammed.khan@company.ae', phone: '+971 58 777 8899', departmentId: deptRows[4].id, positionId: posRows[4].id, joinDate: '2024-04-05', status: 'Active', basicSalary: 11000, bankName: 'Rakbank', iban: 'AE230410000000567890123', routingCode: 'RAK230' } });
    console.log('Employees done');

    const hash = await bcrypt.hash('Denskie123', 10);
    const adminUser = await prisma.user.upsert({ where: { email: 'sottodennis@gmail.com' }, update: {}, create: { email: 'sottodennis@gmail.com', passwordHash: hash, displayName: 'Dennis Sotto', employeeId: emp1.id } });
    const empUser = await prisma.user.upsert({ where: { email: 'employee@mabdc.org' }, update: {}, create: { email: 'employee@mabdc.org', passwordHash: hash, displayName: 'Sarah Ahmed', employeeId: emp2.id } });
    console.log('Users done');

    await prisma.userRole.upsert({ where: { userId_roleId: { userId: adminUser.id, roleId: superAdmin.id } }, update: {}, create: { userId: adminUser.id, roleId: superAdmin.id } });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: empUser.id, roleId: employee.id } }, update: {}, create: { userId: empUser.id, roleId: employee.id } });
    console.log('User-roles done');

    const lts = [
        { name: 'Annual Leave', code: 'AL', maxDays: 30, isPaid: 1 },
        { name: 'Sick Leave', code: 'SL', maxDays: 15, isPaid: 1 },
        { name: 'Maternity Leave', code: 'ML', maxDays: 60, isPaid: 1 },
        { name: 'Unpaid Leave', code: 'UL', maxDays: 30, isPaid: 0 },
        { name: 'Emergency Leave', code: 'EL', maxDays: 5, isPaid: 1 },
    ];
    for (let i = 0; i < lts.length; i++) {
        await prisma.leaveType.upsert({ where: { id: i + 1 }, update: {}, create: lts[i] });
    }
    console.log('Leave types done');

    await prisma.announcement.upsert({ where: { id: 1 }, update: {}, create: { title: 'Welcome to MABDC HR Portal', body: 'We are excited to launch our new HR management system. All employees can now manage their leave requests, view attendance, and stay updated with company announcements.', priority: 'high' } });
    await prisma.announcement.upsert({ where: { id: 2 }, update: {}, create: { title: 'Q1 2026 Performance Reviews', body: 'Performance review cycle for Q1 2026 begins on March 1st. Please ensure all self-assessments are completed by March 15th.', priority: 'normal' } });
    console.log('Announcements done');

    const today = new Date();
    for (let i = 0; i < 5; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        await prisma.attendance.upsert({ where: { id: i + 1 }, update: {}, create: { employeeId: emp2.id, date: dateStr, timeIn: '08:00', timeOut: i === 0 ? null : '17:00', totalHours: i === 0 ? null : 9, overtimeHours: i === 0 ? null : (i % 2 === 0 ? 1 : 0) } });
    }
    console.log('Attendance done');

    // Phase 4: Job Postings
    const jobPostings = [
        { title: 'Senior Developer', departmentId: deptRows[2].id, location: 'Dubai, UAE', type: 'Full-Time', status: 'Open', description: 'Looking for an experienced Next.js developer.' },
        { title: 'HR Coordinator', departmentId: deptRows[1].id, location: 'Abu Dhabi, UAE', type: 'Contract', status: 'Open', description: 'Assist with recruitment and employee relations.' },
        { title: 'Sales Executive', departmentId: deptRows[5].id, location: 'Dubai, UAE', type: 'Full-Time', status: 'Draft', description: 'Seeking a dynamic sales professional.' }
    ];
    for (const job of jobPostings) {
        // Checking by title as a simple unique-ish identifier, though we don't have a unique constraint
        const existing = await prisma.jobPosting.findFirst({ where: { title: job.title } });
        if (!existing) {
            await prisma.jobPosting.create({ data: job });
        }
    }
    console.log('Job Postings done');

    // Phase 4: Onboarding Tasks
    const onboardingTasks = [
        { title: 'Sign Employment Contract', description: 'Read and sign the standard HR employment agreement.', dayDue: 1 },
        { title: 'Setup IT Equipment', description: 'Collect laptop and setup company accounts.', dayDue: 2 },
        { title: 'Complete Safety Training', description: 'Mandatory workplace safety video and exam.', dayDue: 5 },
        { title: 'Meet with Department Head', description: 'Initial objective setting for the probationary period.', dayDue: 7 }
    ];
    for (const task of onboardingTasks) {
        const existing = await prisma.onboardingTask.findFirst({ where: { title: task.title } });
        if (!existing) {
            await prisma.onboardingTask.create({ data: task });
        }
    }
    console.log('Onboarding Tasks done');

    // Phase 6: Company Settings
    const companySettings = [
        { key: 'COMPANY_NAME', value: 'MABDC Innovations', description: 'The official name of the company.' },
        { key: 'DEFAULT_WORK_DAYS', value: 'Mon,Tue,Wed,Thu,Fri', description: 'Global default working days.' },
        { key: 'FISCAL_YEAR_START', value: 'January', description: 'Start month of the fiscal year.' },
        { key: 'CURRENCY', value: 'AED', description: 'Default currency for payroll and expenses.' },
        { key: 'REQUIRE_MANAGER_APPROVAL_LEAVE', value: 'true', description: 'Require line manager approval for leave requests.' }
    ];
    for (const setting of companySettings) {
        await prisma.companySetting.upsert({
            where: { key: setting.key },
            update: {},
            create: setting
        });
    }
    console.log('Company Settings done');

    console.log('Database seeded successfully!');
}

main().catch(e => { console.error('Seed error:', e); process.exit(1); }).finally(() => prisma.$disconnect());
