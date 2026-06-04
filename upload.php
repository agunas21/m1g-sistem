<?php
/**
 * M1G Arama Kurtarma Derneği — Harici Yükleme Karşılayıcı
 * 
 * Bu scripti cPanel/PHP sunucunuzda ana dizine (public_html/upload.php) veya
 * uygun gördüğünüz bir klasöre yükleyin. Aynı dizinde "uploads" klasörü
 * otomatik oluşturulacaktır. (Eğer oluşturulamazsa chmod 755 veya 777 ile 
 * uploads/ klasörünü manuel açmanız gerekebilir.)
 */

// CORS ayarları: Sadece belirlediğiniz Vercel domaininizden gelen isteklere veya her yere izin verebilirsiniz
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Güvenlik (Token Kontrolü)
// UPLOAD_SECRET_TOKEN değerini belirleyin (Bunu .env dosyasına da yazacağız)
$secretToken = 'super_gizli_token_123'; // LÜTFEN BUNU KENDİNİZE GÖRE DEĞİŞTİRİN

$headers = apache_request_headers();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if ($authHeader !== 'Bearer ' . $secretToken) {
    http_response_code(401);
    echo json_encode(['error' => 'Yetkisiz erişim. Token hatalı veya eksik.']);
    exit;
}

// 2. Dosya Kontrolü
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Dosya alınamadı veya yükleme hatası.']);
    exit;
}

// 3. Dosyayı Kaydetme
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'uploads/ dizini oluşturulamadı. İzinleri kontrol edin.']);
        exit;
    }
}

$fileTmpPath = $_FILES['file']['tmp_name'];
$fileName = $_FILES['file']['name'];
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Sadece görsellere ve ofis/pdf belgelerine izin ver
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];
if (!in_array($fileExtension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz dosya türü. Sadece görsel ve PDF/Doc kabul edilir.']);
    exit;
}

// Boyut sınırı (10 MB = 10 * 1024 * 1024 bayt)
$maxFileSize = 10 * 1024 * 1024;
if ($_FILES['file']['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Dosya boyutu 10MB sınırını aşıyor.']);
    exit;
}

// Benzersiz isim oluştur
$newFileName = uniqid('m1g_', true) . '.' . $fileExtension;
$destPath = $uploadDir . $newFileName;

if (move_uploaded_file($fileTmpPath, $destPath)) {
    // Protokol (HTTP/HTTPS) ve domain belirleme
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    
    // Eğer proxy/cloudflare arkasındaysa HTTP_X_FORWARDED_PROTO kullanılabilir
    if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
        $protocol = 'https';
    }

    $domain = $_SERVER['HTTP_HOST'];
    $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
    $scriptDir = $scriptDir === '/' ? '' : $scriptDir;
    
    // Oluşan tam URL
    $fileUrl = $protocol . '://' . $domain . $scriptDir . '/uploads/' . $newFileName;
    
    http_response_code(200);
    echo json_encode(['success' => true, 'url' => $fileUrl]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Sunucu dosya taşıma hatası. Klasör izinlerini kontrol edin.']);
}
?>
