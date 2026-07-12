import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const inventoryItems = [
    // KURTARMA
    { name: "Yangın Tüpü (9kg)", category: "Kurtarma", count: 8 },
    { name: "Merdiven (16.5kg)", category: "Kurtarma", count: 1 },
    { name: "Balyoz", category: "Kurtarma", count: 2 },
    { name: "Kazma", category: "Kurtarma", count: 2 },
    { name: "Travma Tahtası", category: "Kurtarma", count: 3 },
    { name: "Kaşık Sedye", category: "Kurtarma", count: 1 },
    { name: "Yumuşak Sedye", category: "Kurtarma", count: 2 },
    { name: "İlkyardım Çantası", category: "Kurtarma", count: 2 },
    { name: "Benzinli Beton kesici", category: "Kurtarma", count: 1 },
    { name: "Asur 15kg Kırıcı (17kg)", category: "Kurtarma", count: 1, notes: "Seri No: 2305012745" },
    { name: "MacAlister Kırıcı (17kg)", category: "Kurtarma", count: 1 },
    { name: "Glialef Seti (21kg)", category: "Kurtarma", count: 1 },
    { name: "Şarjlı Matkap", category: "Kurtarma", count: 1 },
    { name: "Dekupaj Testere", category: "Kurtarma", count: 1 },
    { name: "Daire Testere", category: "Kurtarma", count: 1 },
    { name: "Kırıcı Delici", category: "Kurtarma", count: 1 },
    { name: "Somun Sıkma", category: "Kurtarma", count: 1 },
    { name: "Hidrolik Demir Keski (5kg)", category: "Kurtarma", count: 1 },
    { name: "Tilki Kuyruğu Bosh (4kg)", category: "Kurtarma", count: 1 },
    { name: "Bosh Hilti (5.5kg)", category: "Kurtarma", count: 1 },
    { name: "Küçük Demir Kesme Makası (3kg)", category: "Kurtarma", count: 1 },
    { name: "Büyük Demir Kesme Makası (5.5kg)", category: "Kurtarma", count: 1 },
    { name: "Beton Kesme (13kg)", category: "Kurtarma", count: 1 },
    { name: "Hitachi Kırıcı (9.5kg)", category: "Kurtarma", count: 1 },
    { name: "Dewalt Avuç İçi Taşlama", category: "Kurtarma", count: 1 },
    { name: "Emniyet Kemeri", category: "Kurtarma", count: 1 },
    
    // LOJİSTİK
    { name: "Delineatör", category: "Lojistik", count: 14 },
    { name: "Koni", category: "Lojistik", count: 6 },
    { name: "Sahra Çadırı", category: "Lojistik", count: 7 },
    { name: "Gazebo", category: "Lojistik", count: 1 },
    { name: "Büyük Kürek", category: "Lojistik", count: 7 },
    { name: "Küçük Kürek", category: "Lojistik", count: 6 },
    { name: "Tırmık", category: "Lojistik", count: 6 },
    { name: "Masa", category: "Lojistik", count: 5 },
    { name: "Yakıt Çantası (20lt)", category: "Lojistik", count: 5 },
    { name: "Tuvalet Çadırı", category: "Lojistik", count: 2 },
    { name: "Kamp Tuvalet", category: "Lojistik", count: 2 },
    { name: "Aydınlatma Projektör", category: "Lojistik", count: 3 },
    { name: "Plastik Kova", category: "Lojistik", count: 7 },
    { name: "Takoz", category: "Lojistik", count: 20 },
    { name: "Güvenlik Şeridi", category: "Lojistik", count: 1 },
    { name: "Sprey Boya", category: "Lojistik", count: 1 },
    { name: "Jeneratör", category: "Lojistik", count: 3 },
    { name: "Uzatma Kablosu", category: "Lojistik", count: 5 },

    // ARAMA
    { name: "Termal Kamera", category: "Arama", count: 1 },
    { name: "Gaz Dedektörü", category: "Arama", count: 1 },
    { name: "GPS", category: "Arama", count: 1 },
];

async function main() {
    console.log("Starting to seed inventory...");
    let addedCount = 0;
    
    for (const item of inventoryItems) {
        for (let i = 0; i < item.count; i++) {
            const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
            await prisma.inventoryItem.create({
                data: {
                    id: shortId,
                    name: item.count > 1 ? `${item.name} #${i + 1}` : item.name,
                    category: item.category,
                    status: "Depoda",
                    type: "Demirbaş",
                    condition: "İyi",
                    notes: item.notes || ""
                }
            });
            addedCount++;
        }
        console.log(`Added ${item.count} of ${item.name}`);
    }
    
    console.log(`Successfully added ${addedCount} total items to inventory.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
