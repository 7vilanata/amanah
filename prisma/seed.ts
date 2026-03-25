import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

function createMariaDbAdapter() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL belum disetel.");
  }

  const parsedUrl = new URL(databaseUrl);

  return new PrismaMariaDb({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 3306),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.replace(/^\//, ""),
    allowPublicKeyRetrieval: parsedUrl.searchParams.get("allowPublicKeyRetrieval") === "true",
  });
}

const prisma = new PrismaClient({
  adapter: createMariaDbAdapter(),
});

async function main() {
  const ownerPasswordHash = await hash("Password123!", 10);
  const adminPasswordHash = await hash("Password123!", 10);
  const memberPasswordHash = await hash("Password123!", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@amanah.local" },
    update: {
      name: "Agency Owner",
      role: "OWNER",
      isActive: true,
      passwordHash: ownerPasswordHash,
    },
    create: {
      name: "Agency Owner",
      email: "owner@amanah.local",
      role: "OWNER",
      isActive: true,
      passwordHash: ownerPasswordHash,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@amanah.local" },
    update: {
      name: "Project Admin",
      role: "ADMIN",
      isActive: true,
      passwordHash: adminPasswordHash,
    },
    create: {
      name: "Project Admin",
      email: "admin@amanah.local",
      role: "ADMIN",
      isActive: true,
      passwordHash: adminPasswordHash,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@amanah.local" },
    update: {
      name: "Creative Member",
      role: "MEMBER",
      isActive: true,
      passwordHash: memberPasswordHash,
    },
    create: {
      name: "Creative Member",
      email: "member@amanah.local",
      role: "MEMBER",
      isActive: true,
      passwordHash: memberPasswordHash,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-launch-website" },
    update: {
      name: "Website Launch Q2",
      clientName: "PT Harmoni Niaga",
      description: "Project awal untuk menunjukkan alur kerja dashboard, task board, dan calendar.",
      status: "ACTIVE",
      startDate: new Date("2026-03-20"),
      dueDate: new Date("2026-04-08"),
      createdById: owner.id,
    },
    create: {
      id: "seed-project-launch-website",
      name: "Website Launch Q2",
      clientName: "PT Harmoni Niaga",
      description: "Project awal untuk menunjukkan alur kerja dashboard, task board, dan calendar.",
      status: "ACTIVE",
      startDate: new Date("2026-03-20"),
      dueDate: new Date("2026-04-08"),
      createdById: owner.id,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: member.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: member.id,
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-brand-guidelines" },
    update: {
      title: "Finalisasi brand guideline landing page",
      description: "Sinkronkan warna, headline, dan CTA dengan deck presentasi terbaru.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startDate: new Date("2026-03-24"),
      dueDate: new Date("2026-03-28"),
      assigneeId: member.id,
      projectId: project.id,
      createdById: admin.id,
    },
    create: {
      id: "seed-task-brand-guidelines",
      title: "Finalisasi brand guideline landing page",
      description: "Sinkronkan warna, headline, dan CTA dengan deck presentasi terbaru.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      startDate: new Date("2026-03-24"),
      dueDate: new Date("2026-03-28"),
      assigneeId: member.id,
      projectId: project.id,
      createdById: admin.id,
    },
  });

  await prisma.recurringTask.upsert({
    where: { id: "seed-recurring-daily-qa" },
    update: {
      title: "Review leads dan inquiry harian",
      description: "Cek inquiry baru, assign follow-up awal, dan update status prospek harian.",
      priority: "MEDIUM",
      frequency: "WEEKDAYS",
      interval: 1,
      startDate: new Date("2026-03-25"),
      endDate: new Date("2026-04-10"),
      isActive: true,
      projectId: project.id,
      defaultAssigneeId: member.id,
      createdById: admin.id,
    },
    create: {
      id: "seed-recurring-daily-qa",
      title: "Review leads dan inquiry harian",
      description: "Cek inquiry baru, assign follow-up awal, dan update status prospek harian.",
      priority: "MEDIUM",
      frequency: "WEEKDAYS",
      interval: 1,
      startDate: new Date("2026-03-25"),
      endDate: new Date("2026-04-10"),
      isActive: true,
      projectId: project.id,
      defaultAssigneeId: member.id,
      createdById: admin.id,
    },
  });

  console.log("Seed berhasil dibuat.");
  console.log("Owner:", "owner@amanah.local / Password123!");
  console.log("Admin:", "admin@amanah.local / Password123!");
  console.log("Member:", "member@amanah.local / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
