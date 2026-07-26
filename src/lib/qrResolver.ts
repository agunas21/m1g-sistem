/**
 * Universal QR Code Parser for M1G Arama Kurtarma System
 * 
 * Handles any scanned QR input format seamlessly:
 * 1. Full URLs: "https://m1g.org.tr/kimlik/TOK-12345" -> "TOK-12345"
 * 2. Full URLs: "https://m1g.org.tr/envanter/EQ-001" -> "EQ-001"
 * 3. Query Param URLs: "https://m1g.org.tr/api/inventory?id=EQ-001" -> "EQ-001"
 * 4. JSON Strings: '{"id":"EQ-001"}' -> "EQ-001"
 * 5. Raw Tokens / Barcodes: "EQ-001", "8691234567890", "TOK-12345"
 */

export interface ParsedQRResult {
    raw: string;
    cleanCode: string;
    type: "MEMBER" | "EQUIPMENT" | "UNKNOWN";
}

export function parseQRString(scannedText: string): ParsedQRResult {
    if (!scannedText || typeof scannedText !== "string") {
        return { raw: "", cleanCode: "", type: "UNKNOWN" };
    }

    const trimmed = scannedText.trim();

    // Case 1: JSON String
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
            const parsed = JSON.parse(trimmed);
            const code = parsed.id || parsed.code || parsed.token || parsed.barcode || trimmed;
            const type = parsed.type === "MEMBER" || code.startsWith("TOK-") || code.startsWith("MBR-") ? "MEMBER" : "EQUIPMENT";
            return { raw: trimmed, cleanCode: String(code).trim(), type };
        } catch {}
    }

    // Case 2: URL String
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("m1g.org.tr") || trimmed.includes("/")) {
        try {
            // Check for query parameters first
            const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
            const queryId = urlObj.searchParams.get("id") || urlObj.searchParams.get("token") || urlObj.searchParams.get("code");
            
            if (queryId) {
                const type = trimmed.includes("/kimlik/") || queryId.startsWith("TOK-") ? "MEMBER" : "EQUIPMENT";
                return { raw: trimmed, cleanCode: queryId.trim(), type };
            }

            // Extract last path segment
            const pathSegments = urlObj.pathname.split("/").filter(Boolean);
            if (pathSegments.length > 0) {
                const lastSegment = decodeURIComponent(pathSegments[pathSegments.length - 1]).trim();
                const isMemberPath = urlObj.pathname.includes("/kimlik/") || urlObj.pathname.includes("/member/");
                const isEquipPath = urlObj.pathname.includes("/envanter/") || urlObj.pathname.includes("/inventory/") || urlObj.pathname.includes("/depo/");
                
                const type = isMemberPath || lastSegment.startsWith("TOK-") ? "MEMBER" : isEquipPath ? "EQUIPMENT" : "UNKNOWN";
                return { raw: trimmed, cleanCode: lastSegment, type };
            }
        } catch (e) {
            // Fallback for custom path strings not parseable by URL constructor
            const parts = trimmed.split("/");
            const lastPart = parts[parts.length - 1].split("?")[0].trim();
            const type = trimmed.includes("kimlik") || lastPart.startsWith("TOK-") ? "MEMBER" : "EQUIPMENT";
            return { raw: trimmed, cleanCode: lastPart, type };
        }
    }

    // Case 3: Raw token / Barcode / ID
    const isMember = trimmed.startsWith("TOK-") || trimmed.startsWith("MBR-");
    return {
        raw: trimmed,
        cleanCode: trimmed,
        type: isMember ? "MEMBER" : "EQUIPMENT"
    };
}
