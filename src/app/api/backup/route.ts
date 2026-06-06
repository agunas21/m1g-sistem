import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/crypto'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    const isCron = req.nextUrl.searchParams.get('cron') === 'true';

    // Allow access if it's super admin OR it's an automated cron job
    if (!isCron && (!actor || !actor.isSuperAdmin)) {
        return NextResponse.json({ error: 'Yalnızca Süper Admin yedek alabilir.' }, { status: 403 })
    }

    try {
        // Fetch all data
        const members = await prisma.member.findMany()
        const inventory = await prisma.inventoryItem.findMany()
        const operations = await prisma.operation.findMany()
        const teams = await prisma.team.findMany()
        const auditLogs = await prisma.auditLog.findMany()
        
        const backupData = {
            timestamp: new Date().toISOString(),
            data: {
                members,
                inventory,
                operations,
                teams,
                auditLogs
            }
        }

        const sendEmail = req.nextUrl.searchParams.get('sendEmail') === 'true'

        if (sendEmail || isCron) {
            const SMTP_USER = process.env.SMTP_USER
            const SMTP_PASS = process.env.SMTP_PASS

            if (!SMTP_USER || !SMTP_PASS) {
                if (isCron) return NextResponse.json({ error: 'SMTP ayarları eksik.' }, { status: 500 })
                return NextResponse.json(backupData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Disposition': `attachment; filename="m1g-backup-${Date.now()}.json"`
                    }
                })
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS
                }
            })

            const backupBuffer = Buffer.from(JSON.stringify(backupData, null, 2), 'utf-8')

            await transporter.sendMail({
                from: `"M1G Sistem" <${SMTP_USER}>`,
                to: 'm1garamakurtarma@gmail.com',
                subject: `M1G Sistem Yedeği - ${new Date().toLocaleDateString('tr-TR')}`,
                text: 'M1G Arama Kurtarma sisteminin güncel veritabanı yedeği ektedir.',
                attachments: [
                    {
                        filename: `m1g-backup-${Date.now()}.json`,
                        content: backupBuffer
                    }
                ]
            })

            return NextResponse.json({ success: true, message: 'Yedek e-posta adresine gönderildi.' })
        }

        // Return as downloadable file if not emailing
        return NextResponse.json(backupData, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="m1g-backup-${Date.now()}.json"`
            }
        })
    } catch (e: any) {
        console.error('Backup error:', e)
        return NextResponse.json({ error: 'Yedekleme sırasında hata oluştu: ' + (e.message || '') }, { status: 500 })
    }
}

// Restore Endpoint
export async function POST(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor || !actor.isSuperAdmin) {
        return NextResponse.json({ error: 'Yalnızca Süper Admin yedek yükleyebilir.' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const data = body.data

        if (!data) {
            return NextResponse.json({ error: 'Geçersiz yedek dosyası formatı.' }, { status: 400 })
        }

        // We use an interactive transaction to wipe and insert
        await prisma.$transaction(async (tx) => {
            // WIPE EXISTING DATA (Order matters due to foreign keys if they exist, but Prisma cascade usually handles it, or we delete children first)
            await tx.auditLog.deleteMany()
            await tx.team.deleteMany()
            await tx.operation.deleteMany()
            await tx.inventoryItem.deleteMany()
            await tx.member.deleteMany()

            // INSERT NEW DATA
            if (data.members?.length > 0) await tx.member.createMany({ data: data.members })
            if (data.inventory?.length > 0) await tx.inventoryItem.createMany({ data: data.inventory })
            if (data.operations?.length > 0) await tx.operation.createMany({ data: data.operations })
            if (data.teams?.length > 0) await tx.team.createMany({ data: data.teams })
            if (data.auditLogs?.length > 0) await tx.auditLog.createMany({ data: data.auditLogs })
        }, {
            maxWait: 10000,
            timeout: 20000
        })

        return NextResponse.json({ success: true, message: 'Yedek başarıyla yüklendi.' })

    } catch (e: any) {
        console.error('Restore error:', e)
        return NextResponse.json({ error: 'Yedek yüklenirken hata oluştu: ' + e.message }, { status: 500 })
    }
}
