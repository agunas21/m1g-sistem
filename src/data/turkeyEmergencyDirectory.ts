export interface MuhtarContact {
  id: string;
  province: string;
  district: string;
  neighborhood: string; // Mahalle / Köy Adı
  muhtarName: string;
  phone: string;
  altPhone?: string;
  gatheringAreaNote?: string; // Afet Toplanma Alanı / Not
  updatedAt?: string;
}

export interface EmergencyInstitution {
  id: string;
  category: 'Ulusal Acil' | 'AFAD & Kriz Merkezi' | 'Belediye & İtfaiye' | 'Güvenlik & Sahil' | 'Sağlık & UMKE' | 'Altyapı (Gaz/Elektrik)' | 'Muhtarlık Koordinasyon';
  name: string;
  phone: string;
  altPhone?: string;
  description: string;
  priority: 'Kritik' | 'Yüksek' | 'Normal';
}

export interface ProvinceDirectoryItem {
  plate: string;
  name: string;
  areaCode: string;
  afadPhone: string;
  valilikPhone: string;
  belediyePhone: string;
  muhtarlikMasaPhone: string;
  districts: string[];
}

export const TURKEY_81_PROVINCES: ProvinceDirectoryItem[] = [
  {
    plate: '01', name: 'Adana', areaCode: '0322',
    afadPhone: '0322 227 28 50', valilikPhone: '0322 459 67 19', belediyePhone: '0322 455 35 00', muhtarlikMasaPhone: '0322 455 35 15',
    districts: ['Seyhan', 'Yüreğir', 'Çukurova', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu', 'Karataş', 'Karaisalı', 'Pozantı', 'Yumurtalık', 'Tufanbeyli', 'Feke', 'Aladağ', 'Saimbeyli']
  },
  {
    plate: '02', name: 'Adıyaman', areaCode: '0416',
    afadPhone: '0416 216 12 31', valilikPhone: '0416 216 10 01', belediyePhone: '0416 216 17 20', muhtarlikMasaPhone: '0416 216 17 25',
    districts: ['Merkez', 'Kahta', 'Besni', 'Gölbaşı', 'Gerger', 'Sincik', 'Çelikhan', 'Tut', 'Samsat']
  },
  {
    plate: '03', name: 'Afyonkarahisar', areaCode: '0272',
    afadPhone: '0272 213 79 13', valilikPhone: '0272 214 42 55', belediyePhone: '0272 214 42 25', muhtarlikMasaPhone: '0272 214 42 30',
    districts: ['Merkez', 'Sandıklı', 'Dinar', 'Bolvadin', 'Sinanpaşa', 'Emirdağ', 'Şuhut', 'Çay', 'İhsaniye', 'İscehisar', 'Sultandağı', 'Çobanlar', 'Dazkırı', 'Başmakçı', 'Hocalar', 'Bayat', 'Evciler', 'Kızılören']
  },
  {
    plate: '04', name: 'Ağrı', areaCode: '0472',
    afadPhone: '0472 215 12 43', valilikPhone: '0472 215 17 03', belediyePhone: '0472 215 11 94', muhtarlikMasaPhone: '0472 215 11 98',
    districts: ['Merkez', 'Patnos', 'Doğubayazıt', 'Diyadin', 'Eleşkirt', 'Tutak', 'Taşlıçay', 'Hamur']
  },
  {
    plate: '05', name: 'Amasya', areaCode: '0358',
    afadPhone: '0358 218 42 00', valilikPhone: '0358 218 80 00', belediyePhone: '0358 218 80 50', muhtarlikMasaPhone: '0358 218 80 55',
    districts: ['Merkez', 'Merzifon', 'Suluova', 'Taşova', 'Gümüşhacıköy', 'Göynücek', 'Hamamözü']
  },
  {
    plate: '06', name: 'Ankara', areaCode: '0312',
    afadPhone: '0312 252 59 79', valilikPhone: '0312 306 66 66', belediyePhone: '0312 507 10 00', muhtarlikMasaPhone: '0312 507 24 00',
    districts: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut', 'Sincan', 'Altındağ', 'Pursaklar', 'Gölbaşı', 'Polatlı', 'Çubuk', 'Kahramankazan', 'Beypazarı', 'Elmadağ', 'Şereflikoçhisar', 'Akyurt', 'Kızılcahamam', 'Haymana', 'Bala', 'Kalecik', 'Ayaş', 'Nallıhan', 'Çamlıdere', 'Güdül', 'Evren']
  },
  {
    plate: '07', name: 'Antalya', areaCode: '0242',
    afadPhone: '0242 227 28 54', valilikPhone: '0242 243 97 91', belediyePhone: '0242 249 50 00', muhtarlikMasaPhone: '0242 249 53 00',
    districts: ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya', 'Manavgat', 'Serik', 'Aksu', 'Döşemealtı', 'Kumluca', 'Kaş', 'Korkuteli', 'Gazipaşa', 'Finike', 'Kemer', 'Elmalı', 'Demre', 'Akseki', 'Gündoğmuş', 'İbradı']
  },
  {
    plate: '08', name: 'Artvin', areaCode: '0466',
    afadPhone: '0466 212 31 55', valilikPhone: '0466 212 10 05', belediyePhone: '0466 212 37 06', muhtarlikMasaPhone: '0466 212 37 10',
    districts: ['Merkez', 'Hopa', 'Borçka', 'Arhavi', 'Yusufeli', 'Şavşat', 'Kemalpaşa', 'Ardanuç', 'Murgul']
  },
  {
    plate: '09', name: 'Aydın', areaCode: '0256',
    afadPhone: '0256 212 93 66', valilikPhone: '0256 215 10 00', belediyePhone: '0256 444 40 09', muhtarlikMasaPhone: '0256 215 18 00',
    districts: ['Efeler', 'Nazilli', 'Söke', 'Kuşadası', 'Didim', 'Çine', 'İncirliova', 'Germencik', 'Bozdoğan', 'Köşk', 'Kuyucak', 'Koçarlı', 'Sultanhisar', 'Karacasu', 'Yenipazar', 'Buharkent', 'Karpuzlu']
  },
  {
    plate: '10', name: 'Balıkesir', areaCode: '0266',
    afadPhone: '0266 244 85 00', valilikPhone: '0266 245 13 00', belediyePhone: '0266 444 40 10', muhtarlikMasaPhone: '0266 239 15 10',
    districts: ['Altıeylül', 'Karesi', 'Edremit', 'Bandırma', 'Gönen', 'Ayvalık', 'Burhaniye', 'Bigadiç', 'Susurluk', 'Dursunbey', 'Sındırgı', 'İvrindi', 'Erdek', 'Havran', 'Kepsut', 'Manyas', 'Savaştepe', 'Balya', 'Gömeç', 'Marmara']
  },
  {
    plate: '11', name: 'Bilecik', areaCode: '0228',
    afadPhone: '0228 212 37 33', valilikPhone: '0228 212 10 02', belediyePhone: '0228 214 91 00', muhtarlikMasaPhone: '0228 214 91 15',
    districts: ['Merkez', 'Bozüyük', 'Osmaneli', 'Söğüt', 'Gölpazarı', 'Pazaryeri', 'İnhisar', 'Yenipazar']
  },
  {
    plate: '12', name: 'Bingöl', areaCode: '0426',
    afadPhone: '0426 213 36 05', valilikPhone: '0426 213 10 01', belediyePhone: '0426 213 12 13', muhtarlikMasaPhone: '0426 213 12 20',
    districts: ['Merkez', 'Genç', 'Solhan', 'Karlıova', 'Adaklı', 'Kiğı', 'Yedisu', 'Yayladere']
  },
  {
    plate: '13', name: 'Bitlis', areaCode: '0434',
    afadPhone: '0434 226 60 06', valilikPhone: '0434 228 63 00', belediyePhone: '0434 226 57 90', muhtarlikMasaPhone: '0434 226 57 95',
    districts: ['Merkez', 'Tatvan', 'Ahlat', 'Güroymak', 'Hizan', 'Mutki', 'Adilcevaz']
  },
  {
    plate: '14', name: 'Bolu', areaCode: '0374',
    afadPhone: '0374 215 76 00', valilikPhone: '0374 215 37 22', belediyePhone: '0374 444 26 58', muhtarlikMasaPhone: '0374 215 37 50',
    districts: ['Merkez', 'Gerede', 'Mudurnu', 'Göynük', 'Mengen', 'Yeniçağa', 'Dörtdivan', 'Seben', 'Kıbrıscık']
  },
  {
    plate: '15', name: 'Burdur', areaCode: '0248',
    afadPhone: '0248 233 34 00', valilikPhone: '0248 233 13 24', belediyePhone: '0248 233 53 90', muhtarlikMasaPhone: '0248 233 53 95',
    districts: ['Merkez', 'Bucak', 'Gölhisar', 'Yeşilova', 'Çavdır', 'Tefenni', 'Ağlasun', 'Karamanlı', 'Altınyayla', 'Çeltikçi', 'Kemer']
  },
  {
    plate: '16', name: 'Bursa', areaCode: '0224',
    afadPhone: '0224 216 00 10', valilikPhone: '0224 221 15 00', belediyePhone: '0224 444 16 00', muhtarlikMasaPhone: '0224 716 11 00',
    districts: ['Osmangazi', 'Yıldırım', 'Nilüfer', 'İnegöl', 'Gemlik', 'Mustafakemalpaşa', 'Mudanya', 'Gürsu', 'Kestel', 'Karacabey', 'Orhangazi', 'Yenişehir', 'İznik', 'Orhaneli', 'Keles', 'Büyükorhan', 'Harmancık']
  },
  {
    plate: '17', name: 'Çanakkale', areaCode: '0286',
    afadPhone: '0286 217 19 88', valilikPhone: '0286 217 16 15', belediyePhone: '0286 444 17 17', muhtarlikMasaPhone: '0286 217 10 79',
    districts: ['Merkez', 'Biga', 'Çan', 'Gelibolu', 'Ayvacık', 'Ezine', 'Yenice', 'Bayramiç', 'Lapseki', 'Gökçeada', 'Eceabat', 'Bozcaada']
  },
  {
    plate: '18', name: 'Çankırı', areaCode: '0376',
    afadPhone: '0376 213 13 62', valilikPhone: '0376 213 10 01', belediyePhone: '0376 212 14 00', muhtarlikMasaPhone: '0376 212 14 05',
    districts: ['Merkez', 'Çerkeş', 'Ilgaz', 'Orta', 'Şabanözü', 'Kurşunlu', 'Yapraklı', 'Kızılırmak', 'Atkaracalar', 'Eldivan', 'Korgun', 'Bayramören']
  },
  {
    plate: '19', name: 'Çorum', areaCode: '0364',
    afadPhone: '0364 213 84 60', valilikPhone: '0364 225 46 60', belediyePhone: '0364 225 08 10', muhtarlikMasaPhone: '0364 225 08 15',
    districts: ['Merkez', 'Sungurlu', 'Osmancık', 'İskilip', 'Alaca', 'Bayat', 'Mecitözü', 'Kargı', 'Ortaköy', 'Uğurludağ', 'Dodurga', 'Oğuzlar', 'Laçin', 'Boğazkale']
  },
  {
    plate: '20', name: 'Denizli', areaCode: '0258',
    afadPhone: '0258 263 60 32', valilikPhone: '0258 265 62 60', belediyePhone: '0258 280 20 20', muhtarlikMasaPhone: '0258 280 21 00',
    districts: ['Pamukkale', 'Merkezefendi', 'Çivril', 'Acıpayam', 'Tavas', 'Honaz', 'Sarayköy', 'Buldan', 'Kale', 'Çal', 'Çameli', 'Serinhisar', 'Bozkurt', 'Güney', 'Çardak', 'Bekilli', 'Babadağ', 'Beyağaç', 'Baklan']
  },
  {
    plate: '21', name: 'Diyarbakır', areaCode: '0412',
    afadPhone: '0412 326 11 56', valilikPhone: '0412 228 96 42', belediyePhone: '0412 229 48 80', muhtarlikMasaPhone: '0412 229 48 90',
    districts: ['Bağlar', 'Kayapınar', 'Yenişehir', 'Sur', 'Ergani', 'Bismil', 'Silvan', 'Çınar', 'Çermik', 'Dicle', 'Kulp', 'Hani', 'Lice', 'Eğil', 'Hazro', 'Kocaköy', 'Çüngüş']
  },
  {
    plate: '22', name: 'Edirne', areaCode: '0284',
    afadPhone: '0284 213 91 55', valilikPhone: '0284 214 91 35', belediyePhone: '0284 213 91 45', muhtarlikMasaPhone: '0284 213 91 50',
    districts: ['Merkez', 'Keşan', 'Uzunköprü', 'İpsala', 'Havsa', 'Meriç', 'Enez', 'Süloğlu', 'Lalapaşa']
  },
  {
    plate: '23', name: 'Elazığ', areaCode: '0424',
    afadPhone: '0424 247 22 44', valilikPhone: '0424 241 10 01', belediyePhone: '0424 248 47 00', muhtarlikMasaPhone: '0424 248 47 10',
    districts: ['Merkez', 'Kovancılar', 'Karakoçan', 'Palu', 'Arıcak', 'Baskil', 'Maden', 'Sivrice', 'Alacakaya', 'Keban', 'Ağın']
  },
  {
    plate: '24', name: 'Erzincan', areaCode: '0446',
    afadPhone: '0446 226 12 30', valilikPhone: '0446 214 33 06', belediyePhone: '0446 444 90 24', muhtarlikMasaPhone: '0446 214 14 14',
    districts: ['Merkez', 'Tercan', 'Üzümlü', 'Çayırlı', 'İliç', 'Kemah', 'Kemaliye', 'Otlukbeli', 'Refahiye']
  },
  {
    plate: '25', name: 'Erzurum', areaCode: '0442',
    afadPhone: '0442 329 03 31', valilikPhone: '0442 235 00 66', belediyePhone: '0442 344 10 00', muhtarlikMasaPhone: '0442 344 11 00',
    districts: ['Yakutiye', 'Palandöken', 'Aziziye', 'Horasan', 'Oltu', 'Pasinler', 'Karayazı', 'Hınıs', 'Tekman', 'Karaçoban', 'Aşkale', 'Şenkaya', 'Çat', 'Köprüköy', 'İspir', 'Tortum', 'Narman', 'Uzundere', 'Olur', 'Pazaryolu']
  },
  {
    plate: '26', name: 'Eskişehir', areaCode: '0222',
    afadPhone: '0222 227 57 90', valilikPhone: '0222 221 90 00', belediyePhone: '0222 211 55 00', muhtarlikMasaPhone: '0222 211 55 50',
    districts: ['Odunpazarı', 'Tepebaşı', 'Sivrihisar', 'Çifteler', 'Seyitgazi', 'Alpu', 'Mihalıççık', 'Mahmudiye', 'Beylikova', 'İnönü', 'Sarıcakaya', 'Günyüzü', 'Mihalgazi', 'Han']
  },
  {
    plate: '27', name: 'Gaziantep', areaCode: '0342',
    afadPhone: '0342 428 11 18', valilikPhone: '0342 230 89 90', belediyePhone: '0342 211 12 00', muhtarlikMasaPhone: '0342 211 12 50',
    districts: ['Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye', 'Nurdağı', 'Oğuzeli', 'Araban', 'Yavuzeli', 'Karkamış']
  },
  {
    plate: '28', name: 'Giresun', areaCode: '0454',
    afadPhone: '0454 215 26 00', valilikPhone: '0454 215 75 00', belediyePhone: '0454 444 40 28', muhtarlikMasaPhone: '0454 216 10 50',
    districts: ['Merkez', 'Bulancak', 'Espiye', 'Görele', 'Tirebolu', 'Dereli', 'Şebinkarahisar', 'Keşap', 'Yağlıdere', 'Piraziz', 'Eynesil', 'Alucra', 'Güce', 'Çamoluk', 'Çanakçı', 'Doğankent']
  },
  {
    plate: '29', name: 'Gümüşhane', areaCode: '0456',
    afadPhone: '0456 213 48 66', valilikPhone: '0456 213 15 00', belediyePhone: '0456 213 15 50', muhtarlikMasaPhone: '0456 213 15 55',
    districts: ['Merkez', 'Kelkit', 'Şiran', 'Kürtün', 'Torul', 'Köse']
  },
  {
    plate: '30', name: 'Hakkari', areaCode: '0438',
    afadPhone: '0438 211 32 45', valilikPhone: '0438 211 61 05', belediyePhone: '0438 211 60 22', muhtarlikMasaPhone: '0438 211 60 25',
    districts: ['Merkez', 'Yüksekova', 'Şemdinli', 'Çukurca', 'Derecik']
  },
  {
    plate: '31', name: 'Hatay', areaCode: '0326',
    afadPhone: '0326 233 54 10', valilikPhone: '0326 214 62 02', belediyePhone: '0326 444 12 06', muhtarlikMasaPhone: '0326 216 06 00',
    districts: ['Antakya', 'İskenderun', 'Defne', 'Dörtyol', 'Samandağ', 'Kırıkhan', 'Reyhanlı', 'Arsuz', 'Payas', 'Erzin', 'Altınözü', 'Hassa', 'Yayladağı', 'Belen', 'Kumlu']
  },
  {
    plate: '32', name: 'Isparta', areaCode: '0246',
    afadPhone: '0246 218 55 88', valilikPhone: '0246 211 60 00', belediyePhone: '0246 211 60 60', muhtarlikMasaPhone: '0246 211 60 70',
    districts: ['Merkez', 'Yalvaç', 'Eğirdir', 'Şarkikaraağaç', 'Gelendost', 'Keçiborlu', 'Senirkent', 'Sütçüler', 'Gönen', 'Uluborlu', 'Atabey', 'Aksu', 'Yenişarbademli']
  },
  {
    plate: '33', name: 'Mersin', areaCode: '0324',
    afadPhone: '0324 231 99 30', valilikPhone: '0324 238 37 20', belediyePhone: '0324 533 20 00', muhtarlikMasaPhone: '0324 533 21 00',
    districts: ['Tarsus', 'Toroslar', 'Yenişehir', 'Akdeniz', 'Mezitli', 'Erdemli', 'Silifke', 'Anamur', 'Mut', 'Bozyazı', 'Gülnar', 'Aydıncık', 'Çamlıyayla']
  },
  {
    plate: '34', name: 'İstanbul', areaCode: '0212',
    afadPhone: '0212 455 56 00', valilikPhone: '0212 455 59 00', belediyePhone: '0212 455 13 00', muhtarlikMasaPhone: '0212 455 15 00',
    districts: ['Esenyurt', 'Küçükçekmece', 'Bağcılar', 'Ümraniye', 'Pendik', 'Bahçelievler', 'Üsküdar', 'Sultangazi', 'Gaziosmanpaşa', 'Maltepe', 'Kartal', 'Esenler', 'Kadıköy', 'Kağıthane', 'Avcılar', 'Ataşehir', 'Fatih', 'Eyüpsultan', 'Sancaktepe', 'Başakşehir', 'Sarıyer', 'Sultanbeyli', 'Güngören', 'Beylikdüzü', 'Zeytinburnu', 'Bayrampaşa', 'Şişli', 'Beykoz', 'Arnavutköy', 'Tuzla', 'Çekmeköy', 'Beyoğlu', 'Büyükçekmece', 'Bakırköy', 'Beşiktaş', 'Silivri', 'Çatalca', 'Şile', 'Adalar']
  },
  {
    plate: '35', name: 'İzmir', areaCode: '0232',
    afadPhone: '0232 239 03 18', valilikPhone: '0232 455 82 82', belediyePhone: '0232 293 12 00', muhtarlikMasaPhone: '0232 293 30 00',
    districts: ['Buca', 'Karabağlar', 'Bornova', 'Karşıyaka', 'Konak', 'Bayraklı', 'Çiğli', 'Torbalı', 'Menemen', 'Gaziemir', 'Ödemiş', 'Kemalpaşa', 'Bergama', 'Aliağa', 'Menderes', 'Tire', 'Balçova', 'Narlıdere', 'Urla', 'Kiraz', 'Dikili', 'Çeşme', 'Bayındır', 'Seferihisar', 'Selçuk', 'Güzelbahçe', 'Foça', 'Kınık', 'Beydağ', 'Karaburun']
  },
  {
    plate: '36', name: 'Kars', areaCode: '0474',
    afadPhone: '0474 223 21 56', valilikPhone: '0474 212 25 25', belediyePhone: '0474 223 21 65', muhtarlikMasaPhone: '0474 223 21 70',
    districts: ['Merkez', 'Kağızman', 'Sarıkamış', 'Selim', 'Digor', 'Arpaçay', 'Akyaka', 'Susuz']
  },
  {
    plate: '37', name: 'Kastamonu', areaCode: '0366',
    afadPhone: '0366 214 97 82', valilikPhone: '0366 214 10 91', belediyePhone: '0366 214 10 48', muhtarlikMasaPhone: '0366 214 10 55',
    districts: ['Merkez', 'Tosya', 'Taşköprü', 'Cide', 'İnebolu', 'Araç', 'Devrekani', 'Bozkurt', 'Daday', 'Azdavay', 'Çatalzeytin', 'Küre', 'Doğanyurt', 'İhsangazi', 'Pınarbaşı', 'Şenpazar', 'Abana', 'Seydiler', 'Hanönü', 'Ağlı']
  },
  {
    plate: '38', name: 'Kayseri', areaCode: '0352',
    afadPhone: '0352 240 44 10', valilikPhone: '0352 222 85 11', belediyePhone: '0352 222 70 00', muhtarlikMasaPhone: '0352 222 70 50',
    districts: ['Melikgazi', 'Kocasinan', 'Talas', 'Develi', 'Yahyalı', 'Bünyan', 'İncesu', 'Pınarbaşı', 'Tomarza', 'Yeşilhisar', 'Sarıoğlan', 'Hacılar', 'Sarız', 'Akkışla', 'Felahiye', 'Özvatan']
  },
  {
    plate: '39', name: 'Kırklareli', areaCode: '0288',
    afadPhone: '0288 214 45 96', valilikPhone: '0288 214 10 01', belediyePhone: '0288 214 10 50', muhtarlikMasaPhone: '0288 214 10 55',
    districts: ['Merkez', 'Lüleburgaz', 'Babaeski', 'Vize', 'Pınarhisar', 'Demirköy', 'Pehlivanköy', 'Kofçaz']
  },
  {
    plate: '40', name: 'Kırşehir', areaCode: '0386',
    afadPhone: '0386 213 32 76', valilikPhone: '0386 213 10 01', belediyePhone: '0386 214 10 10', muhtarlikMasaPhone: '0386 214 10 15',
    districts: ['Merkez', 'Kaman', 'Mucur', 'Çiçekdağı', 'Akpınar', 'Boztepe', 'Akçakent']
  },
  {
    plate: '41', name: 'Kocaeli', areaCode: '0262',
    afadPhone: '0262 335 41 00', valilikPhone: '0262 300 50 00', belediyePhone: '0262 318 10 00', muhtarlikMasaPhone: '0262 318 15 00',
    districts: ['Gebze', 'İzmit', 'Darıca', 'Körfez', 'Gölcük', 'Derince', 'Çayırova', 'Kartepe', 'Başiskele', 'Karamürsel', 'Kandıra', 'Dilovası']
  },
  {
    plate: '42', name: 'Konya', areaCode: '0332',
    afadPhone: '0332 248 25 25', valilikPhone: '0332 310 20 00', belediyePhone: '0332 221 14 00', muhtarlikMasaPhone: '0332 221 14 50',
    districts: ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir', 'Çumra', 'Seydişehir', 'Ilgın', 'Cihanbeyli', 'Kulu', 'Karapınar', 'Kadınhanı', 'Sarayönü', 'Bozkır', 'Yunak', 'Doğanhisar', 'Hüyük', 'Altınekin', 'Hadim', 'Çeltik', 'Emirgazi', 'Tuzlukçu', 'Derebucak', 'Akören', 'Taşkent', 'Güneysınır', 'Ahırlı', 'Derbent', 'Halkapınar', 'Yalıhüyük']
  },
  {
    plate: '43', name: 'Kütahya', areaCode: '0274',
    afadPhone: '0274 223 63 36', valilikPhone: '0274 223 60 15', belediyePhone: '0274 223 70 16', muhtarlikMasaPhone: '0274 223 70 20',
    districts: ['Merkez', 'Tavşanlı', 'Simav', 'Gediz', 'Emet', 'Altıntaş', 'Domaniç', 'Hisarcık', 'Aslanapa', 'Çavdarhisar', 'Şaphane', 'Pazarlar', 'Dumlupınar']
  },
  {
    plate: '44', name: 'Malatya', areaCode: '0422',
    afadPhone: '0422 212 84 32', valilikPhone: '0422 324 55 09', belediyePhone: '0422 377 10 00', muhtarlikMasaPhone: '0422 377 11 00',
    districts: ['Yeşilyurt', 'Battalgazi', 'Doğanşehir', 'Akçadağ', 'Darende', 'Hekimhan', 'Pütürge', 'Yazıhan', 'Arapgir', 'Arguvan', 'Kuluncak', 'Kale', 'Doğanyol']
  },
  {
    plate: '45', name: 'Manisa', areaCode: '0236',
    afadPhone: '0236 231 46 39', valilikPhone: '0236 231 46 00', belediyePhone: '0236 231 45 80', muhtarlikMasaPhone: '0236 231 45 90',
    districts: ['Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli', 'Soma', 'Alaşehir', 'Saruhanlı', 'Kula', 'Kırkağaç', 'Demirci', 'Sarıgöl', 'Gördes', 'Selendi', 'Ahmetli', 'Gölmarmara', 'Köprübaşı']
  },
  {
    plate: '46', name: 'Kahramanmaraş', areaCode: '0344',
    afadPhone: '0344 221 49 69', valilikPhone: '0344 223 76 10', belediyePhone: '0344 228 46 00', muhtarlikMasaPhone: '0344 228 46 50',
    districts: ['Onikişubat', 'Dulkadiroğlu', 'Elbistan', 'Afşin', 'Türkoğlu', 'Pazarcık', 'Göksun', 'Andırın', 'Çağlayancerit', 'Nurhak', 'Ekinözü']
  },
  {
    plate: '47', name: 'Mardin', areaCode: '0482',
    afadPhone: '0482 212 37 49', valilikPhone: '0482 212 37 40', belediyePhone: '0482 212 19 68', muhtarlikMasaPhone: '0482 212 19 75',
    districts: ['Artuklu', 'Kızıltepe', 'Midyat', 'Nusaybin', 'Derik', 'Mazıdağı', 'Dargeçit', 'Savur', 'Yeşilli', 'Ömerli']
  },
  {
    plate: '48', name: 'Muğla', areaCode: '0252',
    afadPhone: '0252 214 14 23', valilikPhone: '0252 214 12 21', belediyePhone: '0252 444 48 01', muhtarlikMasaPhone: '0252 214 30 00',
    districts: ['Bodrum', 'Fethiye', 'Milas', 'Menteşe', 'Marmaris', 'Seydikemer', 'Ortaca', 'Yatağan', 'Dalaman', 'Köyceğiz', 'Ula', 'Datça', 'Kavaklıdere']
  },
  {
    plate: '49', name: 'Muş', areaCode: '0436',
    afadPhone: '0436 212 72 20', valilikPhone: '0436 212 10 01', belediyePhone: '0436 212 10 29', muhtarlikMasaPhone: '0436 212 10 35',
    districts: ['Merkez', 'Bulanık', 'Malazgirt', 'Varto', 'Hasköy', 'Korkut']
  },
  {
    plate: '50', name: 'Nevşehir', areaCode: '0384',
    afadPhone: '0384 213 94 25', valilikPhone: '0384 213 10 01', belediyePhone: '0384 213 12 40', muhtarlikMasaPhone: '0384 213 12 45',
    districts: ['Merkez', 'Ürgüp', 'Avanos', 'Gülşehir', 'Derinkuyu', 'Acıgöl', 'Kozaklı', 'Hacıbektaş']
  },
  {
    plate: '51', name: 'Niğde', areaCode: '0388',
    afadPhone: '0388 232 34 65', valilikPhone: '0388 232 10 01', belediyePhone: '0388 232 35 50', muhtarlikMasaPhone: '0388 232 35 55',
    districts: ['Merkez', 'Bor', 'Çiftlik', 'Ulukışla', 'Altunhisar', 'Çamardı']
  },
  {
    plate: '52', name: 'Ordu', areaCode: '0452',
    afadPhone: '0452 223 19 61', valilikPhone: '0452 223 15 00', belediyePhone: '0452 444 10 52', muhtarlikMasaPhone: '0452 225 00 52',
    districts: ['Altınordu', 'Ünye', 'Fatsa', 'Perşembe', 'Kumru', 'Korgan', 'Gölköy', 'Ulubey', 'Mesudiye', 'Aybastı', 'İkizce', 'Akkuş', 'Gürgentepe', 'Çatalpınar', 'Çaybaşı', 'Kabataş', 'Çamaş', 'Gülyalı', 'Kabadüz']
  },
  {
    plate: '53', name: 'Rize', areaCode: '0464',
    afadPhone: '0464 217 17 09', valilikPhone: '0464 213 04 33', belediyePhone: '0464 217 11 11', muhtarlikMasaPhone: '0464 217 11 20',
    districts: ['Merkez', 'Çayeli', 'Ardeşen', 'Pazar', 'Fındıklı', 'Güneysu', 'Kalkandere', 'İyidere', 'Derepazarı', 'Çamlıhemşin', 'İkizdere', 'Hemşin']
  },
  {
    plate: '54', name: 'Sakarya', areaCode: '0264',
    afadPhone: '0264 251 36 22', valilikPhone: '0264 251 33 55', belediyePhone: '0264 444 40 54', muhtarlikMasaPhone: '0264 289 30 00',
    districts: ['Adapazarı', 'Serdivan', 'Akyazı', 'Erenler', 'Hendek', 'Karasu', 'Geyve', 'Arifiye', 'Sapanca', 'Pamukova', 'Ferizli', 'Kaynarca', 'Kocaali', 'Söğütlü', 'Karapürçek', 'Taraklı']
  },
  {
    plate: '55', name: 'Samsun', areaCode: '0362',
    afadPhone: '0362 238 14 25', valilikPhone: '0362 431 64 78', belediyePhone: '0362 431 60 90', muhtarlikMasaPhone: '0362 431 61 00',
    districts: ['İlkadım', 'Atakum', 'Bafra', 'Çarşamba', 'Canik', 'Vezirköprü', 'Terme', 'Tekkeköy', 'Havza', 'Alaçam', '19 Mayıs', 'Ayvacık', 'Kavak', 'Salıpazarı', 'Asarcık', 'Ladik', 'Yakakent']
  },
  {
    plate: '56', name: 'Siirt', areaCode: '0484',
    afadPhone: '0484 223 11 88', valilikPhone: '0484 223 10 01', belediyePhone: '0484 223 22 90', muhtarlikMasaPhone: '0484 223 22 95',
    districts: ['Merkez', 'Kurtalan', 'Pervari', 'Baykan', 'Şirvan', 'Eruh', 'Tillo']
  },
  {
    plate: '57', name: 'Sinop', areaCode: '0368',
    afadPhone: '0368 271 57 90', valilikPhone: '0368 261 18 44', belediyePhone: '0368 261 18 40', muhtarlikMasaPhone: '0368 261 18 45',
    districts: ['Merkez', 'Boyabat', 'Gerze', 'Ayancık', 'Durağan', 'Türkeli', 'Erfelek', 'Dikmen', 'Saraydüzü']
  },
  {
    plate: '58', name: 'Sivas', areaCode: '0346',
    afadPhone: '0346 226 11 43', valilikPhone: '0346 223 93 66', belediyePhone: '0346 444 58 44', muhtarlikMasaPhone: '0346 221 01 10',
    districts: ['Merkez', 'Şarkışla', 'Yıldızeli', 'Suşehri', 'Gemerek', 'Zara', 'Kangal', 'Gürün', 'Divriği', 'Koyulhisar', 'Altınyayla', 'Hafik', 'Ulaş', 'İmranlı', 'Akıncılar', 'Gölova', 'Doğanşar']
  },
  {
    plate: '59', name: 'Tekirdağ', areaCode: '0282',
    afadPhone: '0282 261 20 82', valilikPhone: '0282 261 20 20', belediyePhone: '0282 259 59 59', muhtarlikMasaPhone: '0282 259 59 70',
    districts: ['Çorlu', 'Süleymanpaşa', 'Çerkezköy', 'Kapaklı', 'Ergene', 'Malkara', 'Saray', 'Hayrabolu', 'Şarköy', 'Muratlı', 'Marmaraereğlisi']
  },
  {
    plate: '60', name: 'Tokat', areaCode: '0356',
    afadPhone: '0356 214 50 96', valilikPhone: '0356 214 14 04', belediyePhone: '0356 214 22 20', muhtarlikMasaPhone: '0356 214 22 25',
    districts: ['Merkez', 'Erbaa', 'Turhal', 'Niksar', 'Zile', 'Reşadiye', 'Almus', 'Pazar', 'Başçiftlik', 'Yeşilyurt', 'Artova', 'Sulusaray']
  },
  {
    plate: '61', name: 'Trabzon', areaCode: '0462',
    afadPhone: '0462 321 15 00', valilikPhone: '0462 230 19 88', belediyePhone: '0462 224 61 61', muhtarlikMasaPhone: '0462 224 61 70',
    districts: ['Ortahisar', 'Akçaabat', 'Araklı', 'Of', 'Yomra', 'Arsin', 'Vakfıkebir', 'Sürmene', 'Maçka', 'Beşikdüzü', 'Çarşıbaşı', 'Tonya', 'Düzköy', 'Çaykara', 'Şalpazarı', 'Hayrat', 'Köprübaşı', 'Dernekpazarı']
  },
  {
    plate: '62', name: 'Tunceli', areaCode: '0428',
    afadPhone: '0428 212 17 20', valilikPhone: '0428 212 10 01', belediyePhone: '0428 212 10 73', muhtarlikMasaPhone: '0428 212 10 78',
    districts: ['Merkez', 'Pertek', 'Mazgirt', 'Çemişgezek', 'Hozat', 'Ovacık', 'Pülümür', 'Nazımiye']
  },
  {
    plate: '63', name: 'Şanlıurfa', areaCode: '0414',
    afadPhone: '0414 313 18 46', valilikPhone: '0414 318 70 00', belediyePhone: '0414 318 51 00', muhtarlikMasaPhone: '0414 318 51 50',
    districts: ['Eyyübiye', 'Haliliye', 'Karaköprü', 'Siverek', 'Viranşehir', 'Suruç', 'Akçakale', 'Birecik', 'Ceylanpınar', 'Bozova', 'Harran', 'Hilvan', 'Halfeti']
  },
  {
    plate: '64', name: 'Uşak', areaCode: '0276',
    afadPhone: '0276 227 56 38', valilikPhone: '0276 227 34 80', belediyePhone: '0276 227 10 10', muhtarlikMasaPhone: '0276 227 10 15',
    districts: ['Merkez', 'Banaz', 'Eşme', 'Sivaslı', 'Ulubey', 'Karahallı']
  },
  {
    plate: '65', name: 'Van', areaCode: '0432',
    afadPhone: '0432 216 25 14', valilikPhone: '0432 214 96 63', belediyePhone: '0432 216 99 10', muhtarlikMasaPhone: '0432 216 99 20',
    districts: ['İpekyolu', 'Erciş', 'Tuşba', 'Edremit', 'Özalp', 'Çaldıran', 'Başkale', 'Muradiye', 'Gürpınar', 'Gevaş', 'Çatak', 'Saray', 'Bahçesaray']
  },
  {
    plate: '66', name: 'Yozgat', areaCode: '0354',
    afadPhone: '0354 212 18 53', valilikPhone: '0354 212 10 01', belediyePhone: '0354 212 10 15', muhtarlikMasaPhone: '0354 212 10 20',
    districts: ['Merkez', 'Sorgun', 'Akdağmadeni', 'Yerköy', 'Boğazlıyan', 'Sarıkaya', 'Çekerek', 'Şefaatli', 'Saraykent', 'Çayıralan', 'Kadışehri', 'Aydıncık', 'Yenifakılı', 'Çandır']
  },
  {
    plate: '67', name: 'Zonguldak', areaCode: '0372',
    afadPhone: '0372 257 67 02', valilikPhone: '0372 253 45 25', belediyePhone: '0372 259 67 00', muhtarlikMasaPhone: '0372 259 67 10',
    districts: ['Ereğli', 'Merkez', 'Çaycuma', 'Devrek', 'Kozlu', 'Alaplı', 'Kilimli', 'Gökçebey']
  },
  {
    plate: '68', name: 'Aksaray', areaCode: '0382',
    afadPhone: '0382 215 11 45', valilikPhone: '0382 215 09 00', belediyePhone: '0382 213 54 92', muhtarlikMasaPhone: '0382 213 54 95',
    districts: ['Merkez', 'Ortaköy', 'Eskil', 'Gülağaç', 'Güzelyurt', 'Sultanhanı', 'Ağaçören', 'Sarıyahşi']
  },
  {
    plate: '69', name: 'Bayburt', areaCode: '0458',
    afadPhone: '0458 211 90 12', valilikPhone: '0458 211 61 00', belediyePhone: '0458 211 71 21', muhtarlikMasaPhone: '0458 211 71 25',
    districts: ['Merkez', 'Demirözü', 'Aydıntepe']
  },
  {
    plate: '70', name: 'Karaman', areaCode: '0338',
    afadPhone: '0338 214 91 50', valilikPhone: '0338 226 70 00', belediyePhone: '0338 226 40 00', muhtarlikMasaPhone: '0338 226 40 10',
    districts: ['Merkez', 'Ermenek', 'Sarıveliler', 'Ayrancı', 'Kazımkarabekir', 'Başyayla']
  },
  {
    plate: '71', name: 'Kırıkkale', areaCode: '0318',
    afadPhone: '0318 224 28 31', valilikPhone: '0318 224 25 25', belediyePhone: '0318 280 10 00', muhtarlikMasaPhone: '0318 280 10 15',
    districts: ['Merkez', 'Yahşihan', 'Keskin', 'Delice', 'Bahşılı', 'Sulakyurt', 'Balışeyh', 'Karakeçili', 'Çelebi']
  },
  {
    plate: '72', name: 'Batman', areaCode: '0488',
    afadPhone: '0488 213 96 63', valilikPhone: '0488 213 10 01', belediyePhone: '0488 213 27 59', muhtarlikMasaPhone: '0488 213 27 65',
    districts: ['Merkez', 'Kozluk', 'Beşiri', 'Sason', 'Gercüş', 'Hasankeyf']
  },
  {
    plate: '73', name: 'Şırnak', areaCode: '0486',
    afadPhone: '0486 216 14 70', valilikPhone: '0486 216 20 00', belediyePhone: '0486 216 14 08', muhtarlikMasaPhone: '0486 216 14 15',
    districts: ['Cizre', 'Silopi', 'Merkez', 'İdil', 'Uludere', 'Beytüşşebap', 'Güçlükonak']
  },
  {
    plate: '74', name: 'Bartın', areaCode: '0378',
    afadPhone: '0378 227 77 99', valilikPhone: '0378 227 40 00', belediyePhone: '0378 227 10 53', muhtarlikMasaPhone: '0378 227 10 58',
    districts: ['Merkez', 'Ulus', 'Amasra', 'Kurucaşile']
  },
  {
    plate: '75', name: 'Ardahan', areaCode: '0478',
    afadPhone: '0478 211 54 11', valilikPhone: '0478 211 30 01', belediyePhone: '0478 211 35 16', muhtarlikMasaPhone: '0478 211 35 20',
    districts: ['Merkez', 'Göle', 'Çıldır', 'Hanak', 'Posof', 'Damal']
  },
  {
    plate: '76', name: 'Iğdır', areaCode: '0476',
    afadPhone: '0476 227 66 25', valilikPhone: '0476 227 64 01', belediyePhone: '0476 227 65 55', muhtarlikMasaPhone: '0476 227 65 60',
    districts: ['Merkez', 'Tuzluca', 'Aralık', 'Karakoyunlu']
  },
  {
    plate: '77', name: 'Yalova', areaCode: '0226',
    afadPhone: '0226 813 84 44', valilikPhone: '0226 811 50 00', belediyePhone: '0226 811 50 50', muhtarlikMasaPhone: '0226 811 50 60',
    districts: ['Merkez', 'Çiftlikköy', 'Çınarcık', 'Altınova', 'Armutlu', 'Termal']
  },
  {
    plate: '78', name: 'Karabük', areaCode: '0370',
    afadPhone: '0370 424 14 25', valilikPhone: '0370 415 58 00', belediyePhone: '0370 413 18 70', muhtarlikMasaPhone: '0370 413 18 75',
    districts: ['Merkez', 'Safranbolu', 'Yenice', 'Eskipazar', 'Eflani', 'Ovacık']
  },
  {
    plate: '79', name: 'Kilis', areaCode: '0348',
    afadPhone: '0348 813 11 45', valilikPhone: '0348 813 13 05', belediyePhone: '0348 813 10 10', muhtarlikMasaPhone: '0348 813 10 15',
    districts: ['Merkez', 'Musabeyli', 'Elbeyli', 'Polateli']
  },
  {
    plate: '80', name: 'Osmaniye', areaCode: '0328',
    afadPhone: '0328 826 20 02', valilikPhone: '0328 826 15 00', belediyePhone: '0328 444 80 80', muhtarlikMasaPhone: '0328 814 11 11',
    districts: ['Merkez', 'Kadirli', 'Düziçi', 'Bahçe', 'Toprakkale', 'Sumbas', 'Hasanbeyli']
  },
  {
    plate: '81', name: 'Düzce', areaCode: '0380',
    afadPhone: '0380 512 10 38', valilikPhone: '0380 524 13 84', belediyePhone: '0380 524 22 44', muhtarlikMasaPhone: '0380 524 22 50',
    districts: ['Merkez', 'Akçakoca', 'Kaynaşlı', 'Gölyaka', 'Çilimli', 'Yığılca', 'Gümüşova', 'Cumayeri']
  }
];

// Varsayılan Örnek Saha Muhtarlık Rehberi (Offline Başlangıç Verisi - Kullanıcı Tarafından Eklenip Düzenlenebilir)
export const DEFAULT_MUHTAR_CONTACTS: MuhtarContact[] = [
  {
    id: 'muhtar-izmir-karsiyaka-bostanli',
    province: 'İzmir',
    district: 'Karşıyaka',
    neighborhood: 'Bostanlı Mahallesi',
    muhtarName: 'Bostanlı Mahalle Muhtarlığı (Nöbetçi)',
    phone: '0232 336 16 14',
    altPhone: '0232 369 75 00',
    gatheringAreaNote: 'Bostanlı Pazaryeri & Yasemin Kafe Yanı Afet Toplanma Alanı'
  },
  {
    id: 'muhtar-izmir-karsiyaka-bahcelievler',
    province: 'İzmir',
    district: 'Karşıyaka',
    neighborhood: 'Bahçelievler Mahallesi',
    muhtarName: 'Bahçelievler Mahalle Muhtarlığı',
    phone: '0232 368 41 18',
    altPhone: '0232 293 30 00',
    gatheringAreaNote: 'Ercan Gül Parkı & Yarbay Salih Bozok Parkı Toplanma Alanı'
  },
  {
    id: 'muhtar-izmir-bayrakli-mansuroglu',
    province: 'İzmir',
    district: 'Bayraklı',
    neighborhood: 'Mansuroğlu Mahallesi',
    muhtarName: 'Mansuroğlu Mahalle Muhtarlığı',
    phone: '0232 347 10 42',
    altPhone: '0232 477 20 00',
    gatheringAreaNote: 'Bayraklı 75. Yıl Parkı & Hasret Parkı Deprem Toplanma Alanı'
  },
  {
    id: 'muhtar-izmir-bornova-ergene',
    province: 'İzmir',
    district: 'Bornova',
    neighborhood: 'Ergene Mahallesi',
    muhtarName: 'Ergene Mahalle Muhtarlığı',
    phone: '0232 388 19 60',
    altPhone: '0232 999 29 29',
    gatheringAreaNote: 'Bornova Büyükpark & Aşık Veysel Rekreasyon Alanı'
  },
  {
    id: 'muhtar-istanbul-kadikoy-caferaga',
    province: 'İstanbul',
    district: 'Kadıköy',
    neighborhood: 'Caferağa Mahallesi',
    muhtarName: 'Caferağa Mahalle Muhtarlığı',
    phone: '0216 336 05 34',
    altPhone: '0216 542 50 00',
    gatheringAreaNote: 'Moda Sahili & Yoğurtçu Parkı Afet Toplanma Alanı'
  },
  {
    id: 'muhtar-ankara-cankaya-bahcelievler',
    province: 'Ankara',
    district: 'Çankaya',
    neighborhood: 'Bahçelievler Mahallesi',
    muhtarName: 'Bahçelievler Mahalle Muhtarlığı',
    phone: '0312 213 54 12',
    altPhone: '0312 458 89 00',
    gatheringAreaNote: 'Anıtpark & Milli Kütüphane Bahçesi Toplanma Alanı'
  }
];

function normalizeTurkish(str: string): string {
  return (str || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export function detectProvinceAndDistrict(locationText: string): {
  province: ProvinceDirectoryItem;
  district: string;
} {
  const normLoc = normalizeTurkish(locationText || '');

  // 1. Önce İl adını metinde ara
  for (const prov of TURKEY_81_PROVINCES) {
    const normProv = normalizeTurkish(prov.name);
    if (normLoc.includes(normProv)) {
      // İlçeyi de kontrol et
      for (const dist of prov.districts) {
        if (normLoc.includes(normalizeTurkish(dist))) {
          return { province: prov, district: dist };
        }
      }
      return { province: prov, district: prov.districts[0] || 'Merkez' };
    }
  }

  // 2. İl yazılmamış ama doğrudan İlçe yazılmışsa (örn: "Karşıyaka", "Bornova", "Elbistan")
  for (const prov of TURKEY_81_PROVINCES) {
    for (const dist of prov.districts) {
      if (dist !== 'Merkez' && normLoc.includes(normalizeTurkish(dist))) {
        return { province: prov, district: dist };
      }
    }
  }

  // 3. Varsayılan: İzmir / Karşıyaka (veya ilk il)
  const izmir = TURKEY_81_PROVINCES.find(p => p.plate === '35') || TURKEY_81_PROVINCES[0];
  return { province: izmir, district: izmir.districts[3] || izmir.districts[0] };
}

export function getInstitutionsForLocation(provinceName: string, districtName?: string): EmergencyInstitution[] {
  const prov = TURKEY_81_PROVINCES.find(
    p => normalizeTurkish(p.name) === normalizeTurkish(provinceName)
  ) || TURKEY_81_PROVINCES.find(p => p.plate === '35')!;

  const distLabel = districtName ? `${prov.name} / ${districtName}` : prov.name;

  return [
    {
      id: 'nat-112',
      category: 'Ulusal Acil',
      name: '112 Acil Çağrı Merkezi (AFAD / UMKE / İtfaiye / Polis / Jandarma)',
      phone: '112',
      description: 'Tüm acil müdahale, ambulans, JAK ve enkaz ihbarları için tek numara (GSM sinyali olmasa bile acil dolaşımla çalışır)',
      priority: 'Kritik'
    },
    {
      id: 'afad-il',
      category: 'AFAD & Kriz Merkezi',
      name: `${prov.name} AFAD İl Müdürlüğü (7/24 Afet Yönetim Merkezi)`,
      phone: prov.afadPhone,
      altPhone: '122',
      description: `${distLabel} bölgesi INSARAG / AFAD akreditasyon, sektör atama ve enkaz koordinasyon merkezi`,
      priority: 'Kritik'
    },
    {
      id: 'valilik-gamer',
      category: 'AFAD & Kriz Merkezi',
      name: `${prov.name} Valiliği GAMER & ${districtName || 'İlçe'} Kaymakamlık Kriz Masası`,
      phone: prov.valilikPhone,
      description: `${distLabel} Mülki İdare Kriz Merkezi, tahliye, barınma ve resmi görevlendirme onayı`,
      priority: 'Kritik'
    },
    {
      id: 'belediye-akom',
      category: 'Belediye & İtfaiye',
      name: `${prov.name} Belediyesi AKOM / İtfaiye Daire Başkanlığı & İş Makinesi Masası`,
      phone: prov.belediyePhone,
      altPhone: '153',
      description: `${distLabel} enkaz vinç, ekskavatör, aydınlatma kulesi ve itfaiye arama kurtarma desteği`,
      priority: 'Kritik'
    },
    {
      id: 'muhtarlik-masa',
      category: 'Muhtarlık Koordinasyon',
      name: `${prov.name} / ${districtName || 'Merkez'} Muhtarlık İşleri & Mahalle Muhtarları Masası`,
      phone: prov.muhtarlikMasaPhone,
      altPhone: prov.belediyePhone,
      description: `${distLabel} mahalle/köy muhtarlarına doğrudan erişim, bina/nüfus teyidi ve yerel rehberlik`,
      priority: 'Kritik'
    },
    {
      id: 'dogalgaz-187',
      category: 'Altyapı (Gaz/Elektrik)',
      name: `187 Doğalgaz Acil — ${prov.name} Enkaz Gaz Kesme Hattı`,
      phone: '187',
      description: 'Enkazda çalışma başlamadan önce ana vana gaz akışını kestirmek için acil ekip hattı',
      priority: 'Kritik'
    },
    {
      id: 'elektrik-186',
      category: 'Altyapı (Gaz/Elektrik)',
      name: `186 Elektrik Arıza — ${prov.name} Enkaz Enerji Kesme Hattı`,
      phone: '186',
      description: 'Yıkık bina ve su baskını sahasında kaçak akım / trafo enerjisini kestirme hattı',
      priority: 'Yüksek'
    },
    {
      id: 'su-185',
      category: 'Altyapı (Gaz/Elektrik)',
      name: `185 Su ve Kanalizasyon Arıza (${prov.name} İZSU/İSKİ/ASKİ)`,
      phone: '185',
      description: 'Enkaz altını su basması veya ana şebeke borusu patlamasında acil vana kapama hattı',
      priority: 'Yüksek'
    },
    {
      id: 'orman-177',
      category: 'Güvenlik & Sahil',
      name: '177 Orman Yangını & Doğa Arama İhbar Hattı (OGM)',
      phone: '177',
      description: 'Orman yangını, arazöz desteği ve dağ/orman içi arama kurtarma koordinasyonu',
      priority: 'Yüksek'
    },
    {
      id: 'sahil-158',
      category: 'Güvenlik & Sahil',
      name: '158 Sahil Güvenlik Komutanlığı (Deniz & Kıyı Arama Kurtarma)',
      phone: '158',
      description: 'Deniz, göl, kıyı şeridi kayıp arama ve helikopter/bot tahliye talebi',
      priority: 'Yüksek'
    },
    {
      id: 'kizilay-168',
      category: 'Sağlık & UMKE',
      name: `168 Türk Kızılayı (${prov.name} Afet Beslenme, Çadır & Kan Merkezi)`,
      phone: '168',
      description: 'Saha personeli ve afetzedeler için sıcak yemek, battaniye, çadır ve kan temini',
      priority: 'Normal'
    },
    {
      id: 'zehir-114',
      category: 'Sağlık & UMKE',
      name: '114 Ulusal Zehir Danışma Merkezi (KBRN / Kimyasal Sızıntı)',
      phone: '114',
      description: 'Enkazda tehlikeli madde, asbest, karbonmonoksit veya kimyasal maruziyet danışma hattı',
      priority: 'Normal'
    }
  ];
}

const OFFLINE_MUHTAR_STORAGE_KEY = 'm1g_offline_muhtar_directory_v1';

export function loadOfflineMuhtarDirectory(): MuhtarContact[] {
  if (typeof window === 'undefined') return DEFAULT_MUHTAR_CONTACTS;
  try {
    const raw = localStorage.getItem(OFFLINE_MUHTAR_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OFFLINE_MUHTAR_STORAGE_KEY, JSON.stringify(DEFAULT_MUHTAR_CONTACTS));
      return DEFAULT_MUHTAR_CONTACTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_MUHTAR_CONTACTS;
  } catch {
    return DEFAULT_MUHTAR_CONTACTS;
  }
}

export function saveOfflineMuhtarContact(contact: Omit<MuhtarContact, 'id'> & { id?: string }): MuhtarContact[] {
  const existing = loadOfflineMuhtarDirectory();
  const newItem: MuhtarContact = {
    ...contact,
    id: contact.id || `muhtar-${Date.now()}`,
    updatedAt: new Date().toLocaleString('tr-TR')
  };
  const updated = [newItem, ...existing.filter(c => c.id !== newItem.id)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(OFFLINE_MUHTAR_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  }
  return updated;
}

export function deleteOfflineMuhtarContact(id: string): MuhtarContact[] {
  const existing = loadOfflineMuhtarDirectory();
  const updated = existing.filter(c => c.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(OFFLINE_MUHTAR_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

