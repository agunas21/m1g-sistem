"use client";

import React from "react";
import { QRCodeSVG } from 'qrcode.react';

export const CARD_W = 320;
export const CARD_H = 510;

// Her şey mutlak piksel - html2canvas ile tam uyumlu
// KART: 320x510px, İÇ BEYAZ ALAN: left:14 right:14 top:14 bottom:14 -> 292x482

export interface KimlikCardProps {
    member: {
        id: string;
        fullName?: string;
        name?: string;
        avatar?: string;
        bloodType?: string;
        emergencyContact?: string;
        role?: string;
        memberType?: string;
        honorary?: string;
        presidentPhone?: string;
    };
    origin: string;
    isFront: boolean;
    scale?: number;
    htmlId?: string;
}

export default function KimlikCard({ member, origin, isFront, scale = 1, htmlId }: KimlikCardProps) {
    const cardUrl = `${origin}/kimlik/${member.id}`;

    const getRole = (m: any) => {
        if (m.role && m.role !== "Üye" && m.role !== "Gönüllü" && m.role !== "ÜYE" && m.role !== "GÖNÜLLÜ") return m.role.toUpperCase();
        if (m.honorary === "Evet" || m.honorary === "EVET") return "ONUR ÜYESİ";
        if (m.memberType === "Üye" || m.memberType === "Asil Üye" || m.memberType === "ASİL ÜYE" || m.role === "Üye" || m.role === "ÜYE") return "ÜYE";
        if (m.memberType && m.memberType !== "Gönüllü" && m.memberType !== "GÖNÜLLÜ") return m.memberType.toUpperCase();
        return "GÖNÜLLÜ";
    };

    const role = getRole(member);
    const fullName = member.fullName || member.name || "İSİMSİZ";
    const bloodType = member.bloodType || "Belirtilmemiş";

    let emContactName = "—";
    let emContactPhone = "—";
    if (member.emergencyContact) {
        const parts = member.emergencyContact.split('-');
        if (parts.length > 1) {
            emContactName = parts[0].trim();
            emContactPhone = parts.slice(1).join('-').trim();
        } else {
            emContactName = member.emergencyContact;
        }
    }

    const nameFontSize = fullName.length > 20 ? 17 : fullName.length > 15 ? 20 : 24;

    // Yan bantlar için tekrar eden metin - arka arkaya yeterince
    const repeatText = "M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • ";

    const transformStyle = scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: "top left" } : {};

    return (
        <div
            id={htmlId}
            style={{
                width: CARD_W,
                height: CARD_H,
                position: "relative",
                flexShrink: 0,
                backgroundColor: "#ffffff",
                fontFamily: "'Inter', sans-serif",
                overflow: "hidden",
                ...transformStyle
            }}
        >
            {/* ===== KIRMIZI BANTLAR (4 taraf) ===== */}

            {/* Üst bant */}
            <div style={{
                position: "absolute", top: 0, left: 0, width: 320, height: 14,
                backgroundColor: "#cb2027", zIndex: 10, overflow: "hidden"
            }}>
                <span style={{
                    position: "absolute", top: 0, left: 0,
                    color: "#ffffff", fontSize: 7, fontWeight: "900",
                    letterSpacing: "1.5px", lineHeight: "14px",
                    whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif"
                }}>{repeatText}</span>
            </div>

            {/* Alt bant */}
            <div style={{
                position: "absolute", bottom: 0, left: 0, width: 320, height: 14,
                backgroundColor: "#cb2027", zIndex: 10, overflow: "hidden"
            }}>
                <span style={{
                    position: "absolute", top: 0, left: 0,
                    color: "#ffffff", fontSize: 7, fontWeight: "900",
                    letterSpacing: "1.5px", lineHeight: "14px",
                    whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif"
                }}>{repeatText}</span>
            </div>

            {/* Sol bant - SVG ile döndürülmüş yazı */}
            <svg
                width={14}
                height={510}
                style={{ position: "absolute", top: 0, left: 0, zIndex: 10 }}
            >
                <rect width={14} height={510} fill="#cb2027" />
                <text
                    x={-496}
                    y={7}
                    transform="rotate(-90)"
                    fill="white"
                    fontSize={7}
                    fontWeight="900"
                    fontFamily="'Inter', sans-serif"
                    letterSpacing={1.5}
                    dominantBaseline="central"
                >
                    {repeatText}
                </text>
            </svg>

            {/* Sağ bant - SVG ile döndürülmüş yazı */}
            <svg
                width={14}
                height={510}
                style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}
            >
                <rect width={14} height={510} fill="#cb2027" />
                <text
                    x={10}
                    y={-7}
                    transform="rotate(90)"
                    fill="white"
                    fontSize={7}
                    fontWeight="900"
                    fontFamily="'Inter', sans-serif"
                    letterSpacing={1.5}
                    dominantBaseline="central"
                >
                    {repeatText}
                </text>
            </svg>

            {/* ===== İÇ ALAN ===== */}

            {isFront ? (
                <>
                    {/* ÜST BAŞLIK - piksel hassasiyetli */}
                    {/* "M1G ARAMA KURTARMA" - x merkezi = 160, y=28 */}
                    <div style={{
                        position: "absolute", top: 18, left: 14, right: 14,
                        textAlign: "center", zIndex: 5
                    }}>
                        <div style={{
                            fontSize: 22, fontWeight: "900", color: "#111111",
                            lineHeight: "26px", fontFamily: "'Inter', sans-serif",
                            letterSpacing: "0px"
                        }}>
                            M1G ARAMA KURTARMA
                        </div>
                        <div style={{
                            fontSize: 22, fontWeight: "900", color: "#111111",
                            lineHeight: "26px", fontFamily: "'Inter', sans-serif",
                            letterSpacing: "0px"
                        }}>
                            DERNEĞİ
                        </div>
                    </div>

                    {/* LOGO - Doğrudan img, border yok */}
                    {/* top:14 + 4 boşluk + 2 satır başlık 52px = 70 civarı */}
                    <div style={{
                        position: "absolute",
                        top: 76,
                        left: 102,   /* (320-116)/2 = 102 */
                        width: 116,
                        height: 116,
                        zIndex: 5
                    }}>
                        <img
                            src="/m1g-logo.png"
                            alt="Logo"
                            width={116}
                            height={116}
                            style={{ display: "block", width: 116, height: 116, objectFit: "contain" }}
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* FOTOĞRAF KUTUSU */}
                    {/* top: 76+116+10 = 202 */}
                    {/* Sol kenar: (320-109)/2 = 105.5 -> 106 */}
                    <div style={{
                        position: "absolute",
                        top: 202,
                        left: 106,
                        width: 108,
                        height: 132,
                        zIndex: 5
                    }}>
                        {/* Dış siyah çerçeve */}
                        <div style={{
                            position: "absolute",
                            top: 0, left: 0,
                            width: 108, height: 132,
                            border: "3px solid #111111",
                            borderRadius: 12,
                            backgroundColor: "#f3f4f6",
                            overflow: "hidden",
                            boxSizing: "border-box"
                        }}>
                            {member.avatar ? (
                                <img
                                    src={member.avatar}
                                    alt="Foto"
                                    width={102}
                                    height={126}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div style={{
                                    width: "100%", height: "100%",
                                    display: "flex", alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    <span style={{ fontSize: 36, color: "#9ca3af", fontWeight: "800" }}>
                                        {fullName.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ROL ROZET (sadece Üye/Gönüllü olmayanlara) */}
                    {/* top: 202+132+12 = 346 */}
                    {role !== "ÜYE" && role !== "GÖNÜLLÜ" && (
                        <div style={{
                            position: "absolute",
                            top: 346,
                            left: 14,
                            right: 14,
                            textAlign: "center",
                            zIndex: 5
                        }}>
                            <div style={{
                                display: "inline-block",
                                backgroundColor: "#111111",
                                borderRadius: 50,
                                border: "2px solid #ffffff",
                                paddingLeft: 16,
                                paddingRight: 16,
                                height: 26,
                                boxSizing: "border-box",
                                boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                            }}>
                                <span style={{
                                    color: "#ffffff",
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    fontFamily: "'Inter', sans-serif",
                                    lineHeight: "22px",
                                    display: "inline-block",
                                    verticalAlign: "top",
                                    textTransform: "uppercase"
                                }}>
                                    {role}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ÜYE ADI */}
                    {/* top: 346+32 = 378 */}
                    <div style={{
                        position: "absolute",
                        top: 378,
                        left: 14,
                        right: 14,
                        textAlign: "center",
                        zIndex: 5
                    }}>
                        <span style={{
                            fontSize: nameFontSize,
                            fontWeight: "900",
                            color: "#111111",
                            textTransform: "uppercase",
                            fontFamily: "'Inter', sans-serif",
                            lineHeight: "1.1",
                            letterSpacing: "0px"
                        }}>
                            {fullName}
                        </span>
                    </div>

                    {/* KAN GRUBU SATIRI */}
                    {/* bottom: 14+56 = 70 -> top: 510-70 = 440 */}
                    <div style={{
                        position: "absolute",
                        top: 430,
                        left: 24,
                        right: 24,
                        zIndex: 5
                    }}>
                        {/* Ayraç çizgi */}
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            backgroundColor: "#e5e7eb"
                        }} />
                        {/* KAN GRUBU etiketi */}
                        <span style={{
                            position: "absolute",
                            top: 6,
                            left: 0,
                            fontSize: 11,
                            fontWeight: "900",
                            color: "#555555",
                            letterSpacing: "1px",
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            KAN GRUBU
                        </span>
                        {/* Kan grubu değeri */}
                        <span style={{
                            position: "absolute",
                            top: 4,
                            right: 0,
                            fontSize: 16,
                            fontWeight: "900",
                            color: "#cb2027",
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            {bloodType}
                        </span>
                    </div>

                    {/* ACİL İLETİŞİM */}
                    {/* bottom: 14+8 = 22 -> top: 510-22-32 = ~456 */}
                    <div style={{
                        position: "absolute",
                        top: 456,
                        left: 24,
                        right: 24,
                        zIndex: 5
                    }}>
                        <div style={{
                            fontSize: 9,
                            fontWeight: "900",
                            color: "#555555",
                            letterSpacing: "0.5px",
                            fontFamily: "'Inter', sans-serif",
                            lineHeight: "14px"
                        }}>
                            YAKIN İLETİŞİM (ACİL DURUM)
                        </div>
                        <div style={{
                            fontSize: 12,
                            fontWeight: "900",
                            color: "#111111",
                            fontFamily: "'Inter', sans-serif",
                            lineHeight: "18px",
                            marginTop: 2
                        }}>
                            {emContactName}
                            <span style={{ color: "#cb2027", marginLeft: 4, marginRight: 4 }}>•</span>
                            {emContactPhone}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* ARKA YÜZ */}

                    {/* Başlık */}
                    <div style={{
                        position: "absolute", top: 24, left: 14, right: 14,
                        textAlign: "center", zIndex: 5
                    }}>
                        <div style={{
                            fontSize: 20, fontWeight: "900", color: "#111111",
                            lineHeight: "24px", fontFamily: "'Inter', sans-serif"
                        }}>
                            M1G ARAMA KURTARMA
                        </div>
                        <div style={{
                            fontSize: 20, fontWeight: "900", color: "#111111",
                            lineHeight: "24px", fontFamily: "'Inter', sans-serif"
                        }}>
                            DERNEĞİ
                        </div>
                    </div>

                    {/* Açıklama metni */}
                    <div style={{
                        position: "absolute", top: 90, left: 24, right: 24,
                        textAlign: "center", zIndex: 5
                    }}>
                        <span style={{
                            fontSize: 11, fontWeight: "700", color: "#555555",
                            lineHeight: "18px", fontFamily: "'Inter', sans-serif"
                        }}>
                            Bu kimlik kartı, M1G Arama ve Kurtarma Derneği'ne aittir ve başkasına devredilemez.
                        </span>
                    </div>

                    {/* QR Kodu */}
                    <div style={{
                        position: "absolute",
                        top: 148,
                        left: 79,   /* (320-162)/2 = 79 */
                        width: 162,
                        zIndex: 5
                    }}>
                        <div style={{
                            backgroundColor: "#ffffff",
                            padding: 10,
                            border: "2px solid #111111",
                            borderRadius: 12,
                            display: "inline-block"
                        }}>
                            <QRCodeSVG value={cardUrl} size={130} level="H" fgColor="#000000" />
                        </div>
                        <div style={{
                            textAlign: "center",
                            fontSize: 9,
                            fontWeight: "700",
                            color: "#111111",
                            marginTop: 8,
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            QR KODU OKUTUN
                        </div>
                    </div>

                    {/* Kaybolunca aranacak kutu */}
                    <div style={{
                        position: "absolute",
                        bottom: 24,
                        left: 24,
                        right: 24,
                        backgroundColor: "#f3f4f6",
                        border: "2px solid #e5e7eb",
                        borderRadius: 12,
                        padding: "14px 16px",
                        textAlign: "center",
                        zIndex: 5
                    }}>
                        <div style={{
                            fontSize: 9, fontWeight: "900", color: "#555555",
                            textTransform: "uppercase",
                            fontFamily: "'Inter', sans-serif",
                            letterSpacing: "0.5px"
                        }}>
                            KAYBOLDUĞUNDA ARANACAK NUMARA
                        </div>
                        <div style={{
                            fontSize: 9, fontWeight: "900", color: "#cb2027",
                            marginTop: 6,
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            YÖNETİM KURULU BAŞKANI
                        </div>
                        <div style={{
                            fontSize: 18, fontWeight: "900", color: "#111111",
                            marginTop: 2,
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            {member.presidentPhone || "0(544) 727-6075"}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
