"use client";

import React from "react";
import { QRCodeSVG } from 'qrcode.react';

export const CARD_W = 320;
export const CARD_H = 510;

const borderText = "M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • ";
const leftBorderSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg width="14" height="510" xmlns="http://www.w3.org/2000/svg"><rect width="14" height="510" fill="#cb2027" /><text x="-255" y="10" transform="rotate(-90)" fill="white" font-size="8" font-weight="900" font-family="Inter, Arial, sans-serif" letter-spacing="1.5" text-anchor="middle" dominant-baseline="central">${borderText}</text></svg>`)}`;
const rightBorderSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg width="14" height="510" xmlns="http://www.w3.org/2000/svg"><rect width="14" height="510" fill="#cb2027" /><text x="255" y="-4" transform="rotate(90)" fill="white" font-size="8" font-weight="900" font-family="Inter, Arial, sans-serif" letter-spacing="1.5" text-anchor="middle" dominant-baseline="central">${borderText}</text></svg>`)}`;

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
        presidentPhone?: string; // Optional custom president phone
    };
    origin: string;
    isFront: boolean;
    scale?: number; // E.g., 0.6375 for toplu kimlik
    htmlId?: string; // E.g., card-inner-front-123
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

    const transformStyle = scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: "top left" } : {};

    return (
        <div
            id={htmlId}
            style={{ 
                width: CARD_W, height: CARD_H, position: "relative", flexShrink: 0, 
                backgroundColor: "#cb2027", fontFamily: "'Inter', sans-serif",
                boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.1), inset -4px -4px 10px rgba(255,255,255,0.5)",
                ...transformStyle
            }}
        >
            {/* Inner white background */}
            <div style={{ position: "absolute", top: 14, bottom: 14, left: 14, right: 14, backgroundColor: "#ffffff", zIndex: 1 }}></div>
            
            {/* Top border text */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, zIndex: 20, overflow: 'hidden', whiteSpace: 'nowrap', display: "flex", alignItems: "center" }}>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', paddingLeft: 4 }}>{borderText}</span>
            </div>
            
            {/* Bottom border text */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, zIndex: 20, overflow: 'hidden', whiteSpace: 'nowrap', display: "flex", alignItems: "center" }}>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', paddingLeft: 4 }}>{borderText}</span>
            </div>
            
            {/* Left border image */}
            <img src={leftBorderSvg} alt="" width={14} height={510} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 14, height: 510, zIndex: 20, display: 'block' }} />
            
            {/* Right border image */}
            <img src={rightBorderSvg} alt="" width={14} height={510} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 14, height: 510, zIndex: 20, display: 'block' }} />

            {isFront ? (
                <>
                    {/* Top text */}
            <div style={{ position: "absolute", top: 22, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>M1G ARAMA KURTARMA</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>DERNEĞİ</span>
            </div>

            {/* Logo - Circle */}
            <div style={{ position: "absolute", top: 82, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                <div style={{ width: 110, height: 110, borderRadius: 110, overflow: "hidden", border: "3px solid #111111", background: "white", boxShadow: "0 6px 16px rgba(0,0,0,0.15)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <img src="/m1g-logo.png" alt="Logo" style={{ width: "90%", height: "90%", objectFit: "contain" }} crossOrigin="anonymous" />
                </div>
            </div>

            {/* Photo Box */}
            <div style={{ position: "absolute", top: 205, left: "50%", transform: "translateX(-50%)", width: 105, height: 130, borderRadius: 12, border: "3px solid #111111", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, zIndex: 10, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: 6, overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {member.avatar ? (
                        <img src={member.avatar} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    ) : (
                        <span style={{ fontSize: 36, color: "#9ca3af", fontWeight: 800 }}>{fullName.charAt(0)}</span>
                    )}
                </div>
            </div>

            {/* Role Badge - Fixed centering */}
            {role !== "ÜYE" && role !== "GÖNÜLLÜ" && (
                <div style={{ position: "absolute", top: 350, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 20 }}>
                    <div style={{ backgroundColor: "#111111", padding: "6px 16px", borderRadius: 100, border: "2px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                        <span style={{ color: "#ffffff", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", lineHeight: 1 }}>
                            {role}
                        </span>
                    </div>
                </div>
            )}

                    {/* Member Name */}
                    <div style={{ position: "absolute", top: 380, left: 0, right: 0, textAlign: "center", padding: "0 15px", zIndex: 10 }}>
                        <span style={{ fontSize: fullName.length > 20 ? 17 : fullName.length > 15 ? 20 : 24, fontWeight: 900, color: "#111111", textTransform: "uppercase", letterSpacing: "0px", lineHeight: 1.1 }}>{fullName}</span>
                    </div>

                    {/* Blood Type & Emergency Contact */}
                    <div style={{ position: "absolute", bottom: 25, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e5e7eb", paddingBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 900, color: "#555", letterSpacing: "1px" }}>KAN GRUBU</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "#cb2027" }}>{bloodType}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 9, fontWeight: 900, color: "#555", letterSpacing: "0.5px" }}>YAKIN İLETİŞİM (ACİL DURUM)</span>
                            <span style={{ fontSize: 12, fontWeight: 900, color: "#111111", marginTop: 2 }}>{emContactName} <span style={{ color: "#cb2027", margin: "0 4px" }}>•</span> {emContactPhone}</span>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Top text */}
                    <div style={{ position: "absolute", top: 32, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>M1G ARAMA KURTARMA</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>DERNEĞİ</span>
                    </div>

                    {/* Info Text */}
                    <div style={{ position: "absolute", top: 95, left: 24, right: 24, textAlign: "center", zIndex: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#555", lineHeight: 1.6 }}>
                            Bu kimlik kartı, M1G Arama ve Kurtarma Derneği'ne aittir ve başkasına devredilemez.
                        </p>
                    </div>

                    {/* QR Code in Center */}
                    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                        <div style={{ background: "white", padding: 10, borderRadius: 16, border: "2px solid #111111", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" }}>
                            <QRCodeSVG value={cardUrl} size={130} level="H" fgColor="#000000" />
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#111", marginTop: 8 }}>QR KODU OKUTUN</span>
                    </div>

                    {/* Found/Lost Contact Info */}
                    <div style={{ position: "absolute", bottom: 30, left: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: "#f3f4f6", border: "2px solid #e5e7eb", padding: "16px", borderRadius: "16px", zIndex: 10 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: "#555", textTransform: "uppercase" }}>KAYBOLDUĞUNDA ARANACAK NUMARA</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: "#cb2027", marginTop: 6 }}>YÖNETİM KURULU BAŞKANI</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: "#111111", marginTop: 2 }}>{member.presidentPhone || "0(544) 727-6075"}</span>
                    </div>
                </>
            )}
        </div>
    );
}
