const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ops = await prisma.operation.findMany({ take: 1 });
  if (ops.length > 0) {
    const id = ops[0].id;
    console.log("TESTING WITH ID:", id);
    const res = await fetch(`http://localhost:3000/api/operations/${id}/generate-reports`, { method: 'POST' });
    console.log("STATUS:", res.status);
    console.log("BODY:", await res.text());
  } else {
    console.log("NO OPS");
  }
}

main().finally(() => prisma.$disconnect());
