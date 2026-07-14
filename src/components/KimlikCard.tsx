"use client";

import React from "react";
import { QRCodeSVG } from 'qrcode.react';

export const CARD_W = 320;
export const CARD_H = 510;
const BAND = 14;

const borderText = "M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • ";

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

    const transformStyle = scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: "top left" } : {};

    return (
        <div
            id={htmlId}
            style={{ 
                width: CARD_W, height: CARD_H, position: "relative", flexShrink: 0, 
                backgroundColor: "#cb2027", fontFamily: "'Inter', sans-serif",
                boxSizing: "border-box",
                overflow: "hidden",
                ...transformStyle
            }}
        >
            {/* Inner white background */}
            <div style={{ position: "absolute", top: BAND, bottom: BAND, left: BAND, right: BAND, backgroundColor: "#ffffff", zIndex: 1 }}></div>
            
            {/* Top border text */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: CARD_W, height: BAND, backgroundColor: "#cb2027", zIndex: 20, overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'left' }}>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', paddingLeft: 4, lineHeight: `${BAND}px` }}>{borderText}</span>
            </div>
            
            {/* Bottom border text */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: CARD_W, height: BAND, backgroundColor: "#cb2027", zIndex: 20, overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'left' }}>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', paddingLeft: 4, lineHeight: `${BAND}px` }}>{borderText}</span>
            </div>
            
            {/* Left border text - NO SVG, WRITING MODE */}
            <div style={{ position: 'absolute', top: BAND, left: 0, width: BAND, height: CARD_H - (BAND * 2), backgroundColor: "#cb2027", zIndex: 20, overflow: 'hidden', color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", textAlign: "left", lineHeight: `${BAND}px`, whiteSpace: "nowrap" }}>
                <span style={{ paddingTop: 4 }}>{borderText}</span>
            </div>
            
            {/* Right border text - NO SVG, WRITING MODE */}
            <div style={{ position: 'absolute', top: BAND, right: 0, width: BAND, height: CARD_H - (BAND * 2), backgroundColor: "#cb2027", zIndex: 20, overflow: 'hidden', color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', writingMode: "vertical-rl", textOrientation: "mixed", textAlign: "left", lineHeight: `${BAND}px`, whiteSpace: "nowrap" }}>
                <span style={{ paddingTop: 4 }}>{borderText}</span>
            </div>

            {isFront ? (
                <>
                    {/* Top text - ABSOLUTE ALIGN, NO FLEX */}
                    <div style={{ position: "absolute", top: 22, left: 0, width: CARD_W, textAlign: "center", zIndex: 10 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: "24px" }}>M1G ARAMA KURTARMA</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: "24px" }}>DERNEĞİ</div>
                    </div>

                    {/* Logo - NO OVERFLOW CLIPPING, MANUAL MATH */}
                    {/* 320 / 2 = 160. 110 width -> 160 - 55 = 105 left */}
                    <div style={{ position: "absolute", top: 82, left: 105, width: 110, height: 110, borderRadius: 55, border: "3px solid #111111", background: "white", boxShadow: "0 6px 16px rgba(0,0,0,0.15)", textAlign: "center", lineHeight: "104px", zIndex: 10, boxSizing: "border-box" }}>
                        <img src="/m1g-logo.png" alt="Logo" crossOrigin="anonymous" style={{ width: 94, height: 94, borderRadius: 47, objectFit: "contain", verticalAlign: "middle", display: "inline-block" }} />
                    </div>

                    {/* Photo Box - NO OVERFLOW CLIPPING */}
                    {/* 320 / 2 = 160. 105 width -> 160 - 52.5 = 107.5 left */}
                    <div style={{ position: "absolute", top: 205, left: 107.5, width: 105, height: 130, borderRadius: 12, border: "3px solid #111111", background: "#ffffff", textAlign: "center", lineHeight: "124px", zIndex: 10, boxShadow: "0 6px 16px rgba(0,0,0,0.15)", boxSizing: "border-box" }}>
                        {member.avatar ? (
                            <img src={member.avatar} alt="Foto" crossOrigin="anonymous" style={{ width: 99, height: 124, borderRadius: 9, objectFit: "cover", verticalAlign: "middle", display: "inline-block", backgroundColor: "#f3f4f6" }} />
                        ) : (
                            <div style={{ display: "inline-block", verticalAlign: "middle", width: 99, height: 124, borderRadius: 9, background: "#f3f4f6", lineHeight: "124px" }}>
                                <span style={{ fontSize: 36, color: "#9ca3af", fontWeight: 800 }}>{fullName.charAt(0)}</span>
                            </div>
                        )}
                    </div>

                    {/* Role Badge - LINE-HEIGHT TRICK */}
                    {role !== "ÜYE" && role !== "GÖNÜLLÜ" && (
                        <div style={{ position: "absolute", top: 350, left: 60, width: 200, height: 26, backgroundColor: "#111111", borderRadius: 13, border: "2px solid #ffffff", textAlign: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.3)", zIndex: 20, boxSizing: "border-box", lineHeight: "22px" }}>
                            <span style={{ color: "#ffffff", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
                                {role}
                            </span>
                        </div>
                    )}

                    {/* Member Name */}
                    <div style={{ position: "absolute", top: 385, left: 15, width: 290, textAlign: "center", zIndex: 10 }}>
                        <span style={{ fontSize: fullName.length > 20 ? 17 : fullName.length > 15 ? 20 : 24, fontWeight: 900, color: "#111111", textTransform: "uppercase", letterSpacing: "0px", lineHeight: "26px" }}>{fullName}</span>
                    </div>

                    {/* Blood Type & Emergency Contact - FLOAT INSTEAD OF FLEX */}
                    <div style={{ position: "absolute", bottom: 25, left: 24, width: 272, zIndex: 10 }}>
                        <div style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: 6, marginBottom: 8, height: 20 }}>
                            <span style={{ float: "left", fontSize: 11, fontWeight: 900, color: "#555", letterSpacing: "1px", lineHeight: "20px" }}>KAN GRUBU</span>
                            <span style={{ float: "right", fontSize: 16, fontWeight: 900, color: "#cb2027", lineHeight: "20px" }}>{bloodType}</span>
                        </div>
                        <div style={{ clear: "both" }}>
                            <div style={{ fontSize: 9, fontWeight: 900, color: "#555", letterSpacing: "0.5px", lineHeight: "12px" }}>YAKIN İLETİŞİM (ACİL DURUM)</div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#111111", marginTop: 2, lineHeight: "14px" }}>{emContactName} <span style={{ color: "#cb2027", margin: "0 4px" }}>•</span> {emContactPhone}</div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Top text - ABSOLUTE ALIGN, NO FLEX */}
                    <div style={{ position: "absolute", top: 32, left: 0, width: CARD_W, textAlign: "center", zIndex: 10 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: "22px" }}>M1G ARAMA KURTARMA</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: "22px" }}>DERNEĞİ</div>
                    </div>

                    {/* Info Text */}
                    <div style={{ position: "absolute", top: 95, left: 24, width: 272, textAlign: "center", zIndex: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#555", lineHeight: "16px", margin: 0 }}>
                            Bu kimlik kartı, M1G Arama ve Kurtarma Derneği'ne aittir ve başkasına devredilemez.
                        </p>
                    </div>

                    {/* QR Code in Center - FLOAT/MARGIN MATH INSTEAD OF FLEX */}
                    {/* 320 / 2 = 160. QR Box is 130 + 20(padding) + 4(border) = 154 width. Left = 160 - 77 = 83 */}
                    <div style={{ position: "absolute", top: 150, left: 83, width: 154, zIndex: 10, textAlign: "center" }}>
                        <div style={{ width: 154, height: 154, background: "white", padding: 10, borderRadius: 16, border: "2px solid #111111", boxShadow: "0 6px 16px rgba(0,0,0,0.1)", boxSizing: "border-box" }}>
                            <QRCodeSVG value={cardUrl} size={130} level="H" fgColor="#000000" />
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#111", marginTop: 8, lineHeight: "12px" }}>QR KODU OKUTUN</div>
                    </div>

                    {/* Found/Lost Contact Info - ABSOLUTE ALIGN */}
                    <div style={{ position: "absolute", bottom: 30, left: 24, width: 272, textAlign: "center", backgroundColor: "#f3f4f6", border: "2px solid #e5e7eb", padding: "16px", borderRadius: "16px", zIndex: 10, boxSizing: "border-box" }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: "#555", textTransform: "uppercase", lineHeight: "12px" }}>KAYBOLDUĞUNDA ARANACAK NUMARA</div>
                        <div style={{ fontSize: 9, fontWeight: 900, color: "#cb2027", marginTop: 6, lineHeight: "12px" }}>YÖNETİM KURULU BAŞKANI</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#111111", marginTop: 2, lineHeight: "20px" }}>{member.presidentPhone || "0(544) 727-6075"}</div>
                    </div>
                </>
            )}
        </div>
    );
}
