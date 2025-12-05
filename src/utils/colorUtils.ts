/**
 * 색상 유틸리티 함수
 * 배경색의 밝기를 계산하여 적절한 텍스트 색상을 결정
 */

/**
 * Hex 색상을 RGB로 변환
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // # 제거
  const cleanHex = hex.replace('#', '')
  
  // 3자리 hex를 6자리로 확장 (예: #fff -> #ffffff)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex

  if (fullHex.length !== 6) return null

  const r = parseInt(fullHex.substring(0, 2), 16)
  const g = parseInt(fullHex.substring(2, 4), 16)
  const b = parseInt(fullHex.substring(4, 6), 16)

  return { r, g, b }
}

/**
 * RGB 문자열을 파싱 (예: "rgb(255, 0, 0)" 또는 "rgba(255, 0, 0, 0.5)")
 */
function parseRgbString(rgbString: string): { r: number; g: number; b: number; a?: number } | null {
  const rgbMatch = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i)
  if (!rgbMatch) return null

  return {
    r: parseInt(rgbMatch[1], 10),
    g: parseInt(rgbMatch[2], 10),
    b: parseInt(rgbMatch[3], 10),
    a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : undefined,
  }
}

/**
 * 색상 문자열을 RGB로 변환 (hex, rgb, rgba 모두 지원)
 */
function parseColor(color: string): { r: number; g: number; b: number; a?: number } | null {
  if (!color || color.trim() === '') return null

  const trimmedColor = color.trim()

  // Hex 색상
  if (trimmedColor.startsWith('#')) {
    const rgb = hexToRgb(trimmedColor)
    return rgb ? { ...rgb } : null
  }

  // RGB/RGBA 문자열
  if (trimmedColor.startsWith('rgb')) {
    return parseRgbString(trimmedColor)
  }

  return null
}

/**
 * 상대 휘도(Relative Luminance) 계산
 * WCAG 2.1 기준에 따른 공식 사용
 * @param r Red 값 (0-255)
 * @param g Green 값 (0-255)
 * @param b Blue 값 (0-255)
 * @returns 상대 휘도 (0-1)
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  // 정규화 (0-1 범위로 변환)
  const normalize = (value: number) => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }

  const rNorm = normalize(r)
  const gNorm = normalize(g)
  const bNorm = normalize(b)

  // 상대 휘도 계산
  return 0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm
}

/**
 * 배경색의 밝기를 기반으로 적절한 텍스트 색상 결정
 * @param backgroundColor 배경색 (hex, rgb, rgba 형식)
 * @param lightText 밝은 배경일 때 사용할 텍스트 색상 (기본: #000000)
 * @param darkText 어두운 배경일 때 사용할 텍스트 색상 (기본: #ffffff)
 * @returns 텍스트 색상 (hex 형식)
 */
export function getContrastColor(
  backgroundColor: string,
  lightText: string = '#000000',
  darkText: string = '#ffffff'
): string {
  if (!backgroundColor || backgroundColor.trim() === '') {
    return darkText // 기본 배경(흰색)이면 어두운 텍스트
  }

  const rgb = parseColor(backgroundColor)
  if (!rgb) {
    return darkText // 파싱 실패 시 기본값
  }

  // 알파 채널이 있는 경우, 배경과 블렌딩된 색상 계산
  let finalR = rgb.r
  let finalG = rgb.g
  let finalB = rgb.b

  if (rgb.a !== undefined && rgb.a < 1) {
    // 반투명 배경의 경우, 흰색 배경과 블렌딩 가정
    const bgR = 255
    const bgG = 255
    const bgB = 255
    const alpha = rgb.a

    finalR = Math.round(rgb.r * alpha + bgR * (1 - alpha))
    finalG = Math.round(rgb.g * alpha + bgG * (1 - alpha))
    finalB = Math.round(rgb.b * alpha + bgB * (1 - alpha))
  }

  // 상대 휘도 계산
  const luminance = getRelativeLuminance(finalR, finalG, finalB)

  // 휘도가 0.5보다 크면 밝은 배경, 작으면 어두운 배경
  // WCAG 기준으로는 0.5를 기준으로 사용
  return luminance > 0.5 ? lightText : darkText
}

/**
 * 두 색상 간의 대비 비율 계산
 * @param color1 첫 번째 색상
 * @param color2 두 번째 색상
 * @returns 대비 비율 (1:1 ~ 21:1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = parseColor(color1)
  const rgb2 = parseColor(color2)

  if (!rgb1 || !rgb2) return 1

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 배경색이 너무 밝거나 어두운지 확인
 * @param backgroundColor 배경색
 * @param threshold 임계값 (기본: 0.3 ~ 0.7 범위 밖이면 경고)
 * @returns { tooLight: boolean, tooDark: boolean, luminance: number }
 */
export function checkBackgroundBrightness(
  backgroundColor: string,
  threshold: { min: number; max: number } = { min: 0.3, max: 0.7 }
): { tooLight: boolean; tooDark: boolean; luminance: number } {
  if (!backgroundColor || backgroundColor.trim() === '') {
    return { tooLight: false, tooDark: false, luminance: 1 }
  }

  const rgb = parseColor(backgroundColor)
  if (!rgb) {
    return { tooLight: false, tooDark: false, luminance: 0.5 }
  }

  // 알파 채널 처리
  let finalR = rgb.r
  let finalG = rgb.g
  let finalB = rgb.b

  if (rgb.a !== undefined && rgb.a < 1) {
    const bgR = 255
    const bgG = 255
    const bgB = 255
    const alpha = rgb.a

    finalR = Math.round(rgb.r * alpha + bgR * (1 - alpha))
    finalG = Math.round(rgb.g * alpha + bgG * (1 - alpha))
    finalB = Math.round(rgb.b * alpha + bgB * (1 - alpha))
  }

  const luminance = getRelativeLuminance(finalR, finalG, finalB)

  return {
    tooLight: luminance > threshold.max,
    tooDark: luminance < threshold.min,
    luminance,
  }
}

