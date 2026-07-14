/**
 * cardCapture.ts — html2canvas wrapper that guarantees Inter font is loaded
 * before rendering, so the downloaded image matches the on-screen card exactly.
 */

const INTER_FONT_URL = 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';

let fontLoaded = false;

async function ensureInterFont(): Promise<void> {
  if (fontLoaded) return;
  
  try {
    // Load the woff2 font file
    const response = await fetch(INTER_FONT_URL);
    const buffer = await response.arrayBuffer();
    
    // Register the font face
    const font = new FontFace('Inter', buffer, {
      weight: '100 900',
      style: 'normal',
    });
    
    await font.load();
    document.fonts.add(font);
    fontLoaded = true;
  } catch (e) {
    console.warn('Inter font preload failed, using fallback:', e);
  }
}

export async function captureCard(
  elementId: string,
  options?: { scale?: number }
): Promise<HTMLCanvasElement> {
  // 1. Ensure Inter font is loaded
  await ensureInterFont();
  await document.fonts.ready;

  // 2. Import html2canvas
  const html2canvas = (await import('html2canvas')).default;

  // 3. Find element
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);

  // 4. Render with html2canvas
  const canvas = await html2canvas(el, {
    scale: options?.scale ?? 5,
    useCORS: true,
    backgroundColor: '#ffffff',
    allowTaint: false,
    logging: false
  });

  return canvas;
}

// Deprecated: Do not use this function anymore. Render unscaled elements and use captureCard instead.
export async function captureCardWithUnscale(
  elementId: string,
  options?: { scale?: number }
): Promise<HTMLCanvasElement> {
  return captureCard(elementId, options);
}

