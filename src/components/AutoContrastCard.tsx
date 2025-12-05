/**
 * AutoContrastCard 컴포넌트
 * 배경색에 따라 자동으로 텍스트 색상을 조절하는 카드 컴포넌트
 */

import { ReactNode, useMemo } from 'react'
import { getContrastColor, getContrastRatio } from '../utils/colorUtils'

interface AutoContrastCardProps {
  backgroundColor?: string
  children: ReactNode
  className?: string
  lightText?: string // 밝은 배경일 때 텍스트 색상 (기본: #000000)
  darkText?: string // 어두운 배경일 때 텍스트 색상 (기본: #ffffff)
  applyOverlay?: boolean // 대비 오버레이 적용 여부
  overlayOpacity?: number // 오버레이 투명도 (0-1)
  minContrastRatio?: number // 최소 대비 비율 (기본: 4.5, WCAG AA 기준)
}

const AutoContrastCard = ({
  backgroundColor,
  children,
  className = '',
  lightText = '#000000',
  darkText = '#ffffff',
  applyOverlay = false,
  overlayOpacity = 0.1,
  minContrastRatio = 4.5,
}: AutoContrastCardProps) => {
  // 텍스트 색상 자동 결정
  const textColor = useMemo(() => {
    if (!backgroundColor) return undefined
    return getContrastColor(backgroundColor, lightText, darkText)
  }, [backgroundColor, lightText, darkText])

  // 대비 비율 확인
  const contrastRatio = useMemo(() => {
    if (!backgroundColor || !textColor) return null
    return getContrastRatio(backgroundColor, textColor)
  }, [backgroundColor, textColor])

  // 오버레이 적용 여부 결정
  const shouldApplyOverlay = useMemo(() => {
    if (!applyOverlay || !backgroundColor || !textColor || !contrastRatio) return false
    // 대비 비율이 최소 기준보다 낮으면 오버레이 적용
    return contrastRatio < minContrastRatio
  }, [applyOverlay, backgroundColor, textColor, contrastRatio, minContrastRatio])

  // 스타일 계산
  const cardStyle = useMemo(() => {
    const style: React.CSSProperties = {}
    
    if (backgroundColor) {
      style.backgroundColor = backgroundColor
    }
    
    if (textColor) {
      style.color = textColor
    }

    return style
  }, [backgroundColor, textColor])

  // 오버레이 스타일
  const overlayStyle = useMemo(() => {
    if (!shouldApplyOverlay || !textColor) return undefined

    // 텍스트가 밝으면 어두운 오버레이, 어두우면 밝은 오버레이
    const isLightText = textColor === lightText
    const overlayColor = isLightText ? 'rgba(0, 0, 0, ' : 'rgba(255, 255, 255, '
    
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: overlayColor + overlayOpacity + ')',
      pointerEvents: 'none' as const,
      zIndex: 1,
    }
  }, [shouldApplyOverlay, textColor, lightText, overlayOpacity])

  return (
    <div
      className={`relative ${className}`}
      style={cardStyle}
    >
      {shouldApplyOverlay && overlayStyle && (
        <div style={overlayStyle} aria-hidden="true" />
      )}
      <div className={shouldApplyOverlay ? 'relative z-10' : ''}>
        {children}
      </div>
    </div>
  )
}

export default AutoContrastCard

