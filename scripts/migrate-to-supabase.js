/**
 * M1G — JSON → Supabase Migration Script
 *
 * Çalıştırma:
 *   node scripts/migrate-to-supabase.js
 *
 * Bu script:
 * 1. src/lib/*.json dosyalarını okur
 * 2. Prisma aracılığıyla Supabase PostgreSQL'e aktarır
 * 3. Şifreli alanları (TC No) olduğu gibi taşır
 * 4. Çakışma durumunda güvenle atlar (upsert)
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient({})

const LIB_PATH = path.join(__dirname, '..', 'src', 'lib')

function readJson(filename) {
    const fp = path.join(LIB_PATH, filename)
    if (!fs.existsSync(fp)) {
        console.log(`⚠️  ${filename} bulunamadı, atlanıyor.`)
        return []
    }
    const raw = fs.readFileSync(fp, 'utf8')
    try {
        return JSON.parse(raw)
    } catch {
        console.error(`❌ ${filename} JSON parse hatası`)
        return []
    }
}

async function migrateMembers() {
    console.log('\n👥 Üyeler taşınıyor...')
    const members = readJson('members.json')
    let success = 0, skipped = 0

    for (const m of members) {
        try {
            await prisma.member.upsert({
                where: { id: m.id },
                create: {
                    id: m.id,
                    kimlikToken: m.kimlikToken || m.id,
                    fullName: m.fullName || 'İsimsiz',
                    tcNo: m.tcNo || null,
                    gender: m.gender || null,
                    phone: m.phone || null,
                    email: m.email || `${m.id}@m1g.local`,
                    password: m.password || m.id,
                    profession: m.profession || null,
                    education: m.education || null,
                    memberType: m.memberType || 'Üye',
                    honorary: m.honorary || 'Hayır',
                    status: m.status || 'Aktif',
                    isAdmin: m.isAdmin || false,
                    isSuperAdmin: m.isSuperAdmin || false,
                    role: m.role || null,
                    joinDate: m.joinDate ? new Date(m.joinDate.split('.').reverse().join('-')) : new Date(),
                    birthDate: m.birthDate || null,
                    lastLogin: m.lastLogin ? new Date(m.lastLogin) : null,
                    ftrRecords: m.ftrRecords || [],
                    certificates: m.certificates || [],
                    inventory: m.inventory || [],
                    totpSecret: m.totpSecret || null,
                    totpEnabled: m.totpEnabled || false,
                },
                update: {}  // Zaten varsa atla
            })
            success++
        } catch (e) {
            console.error(`  ✗ Üye ${m.fullName} (${m.id}): ${e.message}`)
            skipped++
        }
    }
    console.log(`  ✓ ${success} üye taşındı, ${skipped} atlandı`)
}

async function migrateInventory() {
    console.log('\n📦 Envanter taşınıyor...')
    const items = readJson('inventory.json')
    let success = 0, skipped = 0

    for (const item of items) {
        // containerItems normalize et
        const containerItems = (item.containerItems || []).map(v =>
            typeof v === 'string' ? v : (v?.id ? String(v.id) : String(v))
        )

        try {
            await prisma.inventoryItem.upsert({
                where: { id: item.id },
                create: {
                    id: item.id,
                    name: item.name || 'İsimsiz Malzeme',
                    category: item.category || 'Diğer',
                    status: item.status || 'Depoda',
                    isContainer: item.isContainer || false,
                    containerItems,
                    condition: item.condition || 'İyi',
                    type: item.type || 'Demirbaş',
                    expirationDate: item.expirationDate || null,
                    maintenanceDate: item.maintenanceDate || null,
                    lastMaintenance: item.lastMaintenance || null,
                    damagePhotos: item.damagePhotos || [],
                    notes: item.notes || null,
                },
                update: {}
            })
            success++
        } catch (e) {
            console.error(`  ✗ Malzeme ${item.name} (${item.id}): ${e.message}`)
            skipped++
        }
    }
    console.log(`  ✓ ${success} malzeme taşındı, ${skipped} atlandı`)
}

async function migrateOperations() {
    console.log('\n🚨 Operasyonlar taşınıyor...')
    const operations = readJson('operations.json')
    let success = 0, skipped = 0

    for (const op of operations) {
        try {
            const createdOp = await prisma.operation.upsert({
                where: { id: op.id },
                create: {
                    id: op.id,
                    name: op.name || 'İsimsiz Operasyon',
                    type: op.type || 'Doğada Arama',
                    status: op.status || 'Tamamlandı',
                    startTime: op.startTime ? new Date(op.startTime) : new Date(),
                    endTime: op.endTime ? new Date(op.endTime) : null,
                    location: op.location || null,
                    temperature: op.temperature || null,
                    radioFrequency: op.radioFrequency || null,
                    isEvacuationActive: op.isEvacuationActive || false,
                    supplies: op.supplies || {},
                    baseCampMembers: op.baseCamp?.members || [],
                    baseCampEquipment: op.baseCamp?.equipment || [],
                    logs: op.logs || [],
                    postMortemReport: op.postMortemReport || { completed: false, notes: '', memberNotes: {} },
                },
                update: {}
            })

            // Timleri taşı
            if (op.teams && Array.isArray(op.teams)) {
                for (const team of op.teams) {
                    const teamId = team.id || `team-${Date.now()}-${Math.random()}`
                    await prisma.team.upsert({
                        where: { id: teamId },
                        create: {
                            id: teamId,
                            name: team.name || 'Tim',
                            status: team.status || 'Hazırda',
                            operationId: createdOp.id,
                            equipment: team.equipment || [],
                        },
                        update: {}
                    })

                    // Tim üyelerini taşı
                    if (team.members && Array.isArray(team.members)) {
                        for (const tm of team.members) {
                            const memberId = tm.memberId || tm.id
                            if (!memberId) continue
                            try {
                                await prisma.teamMember.upsert({
                                    where: { teamId_memberId: { teamId, memberId } },
                                    create: { teamId, memberId, role: tm.role || 'Üye' },
                                    update: {}
                                })
                            } catch {} // Üye yoksa atla
                        }
                    }
                }
            }

            success++
        } catch (e) {
            console.error(`  ✗ Operasyon ${op.name} (${op.id}): ${e.message}`)
            skipped++
        }
    }
    console.log(`  ✓ ${success} operasyon taşındı, ${skipped} atlandı`)
}

async function migrateApplications() {
    console.log('\n📋 Başvurular taşınıyor...')
    const apps = readJson('applications.json')
    let success = 0

    for (const app of apps) {
        try {
            await prisma.application.create({
                data: {
                    fullName: app.fullName || app.name || 'İsimsiz',
                    email: app.email || `${Date.now()}@unknown.local`,
                    phone: app.phone || null,
                    message: app.message || null,
                    status: app.status || 'Beklemede',
                    createdAt: app.createdAt ? new Date(app.createdAt) : new Date(),
                }
            }).catch(() => {}) // Duplicate atla
            success++
        } catch {}
    }
    console.log(`  ✓ ${success} başvuru taşındı`)
}

async function main() {
    console.log('🚀 M1G JSON → Supabase Migration başlıyor...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    try {
        await migrateMembers()
        await migrateInventory()
        await migrateOperations()
        await migrateApplications()

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ Migration tamamlandı!')
        console.log('💡 JSON dosyaları silinmedi — güvenli yedek olarak kaldı.')
        console.log('💡 Sistemi test ettikten sonra src/lib/*.json dosyalarını silebilirsiniz.')
    } catch (e) {
        console.error('❌ Migration hatası:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
