const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.member.findMany().then(members => {
    const counts = {};
    members.forEach(m => {
        if (m.tcNo) {
            counts[m.tcNo] = (counts[m.tcNo] || 0) + 1;
        }
    });
    const dups = Object.entries(counts).filter(([tc, c]) => c > 1);
    
    if (dups.length === 0) {
        console.log('Hiç kopya TC bulunamadı.');
    } else {
        console.log('Aynı TC ile birden fazla kayıt var:');
        dups.forEach(([tc, c]) => {
            console.log(`TC: ${tc} -> ${c} kişi. Bunlar:`);
            members.filter(m => m.tcNo === tc).forEach(m => {
                console.log(` - ID: ${m.id}, İsim: ${m.fullName}`);
            });
        });
    }
}).finally(() => prisma.$disconnect());
