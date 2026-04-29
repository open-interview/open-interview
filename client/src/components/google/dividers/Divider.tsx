import React from 'react'
import WaveDivider from './WaveDivider'
import CurveDivider from './CurveDivider'
import ZigzagDivider from './ZigzagDivider'
import DotsDivider from './DotsDivider'
import GradientLine from './GradientLine'
import AbstractDivider from './AbstractDivider'

type DividerVariant = 'wave' | 'curve' | 'zigzag' | 'dots' | 'gradient' | 'abstract'

interface DividerProps {
  variant?: DividerVariant
  width?: string
  height?: number
  color?: string
  colors?: string[]
  position?: 'top' | 'bottom'
  animated?: boolean
  className?: string
}

const variantComponents = {
  wave: WaveDivider,
  curve: CurveDivider,
  zigzag: ZigzagDivider,
  dots: DotsDivider,
  gradient: GradientLine,
  abstract: AbstractDivider
}

export default function Divider({
  variant = 'wave',
  width,
  height,
  color,
  colors,
  position,
  animated = false,
  className = ''
}: DividerProps) {
  const Component = variantComponents[variant]

  const props: Record<string, unknown> = {
    width,
    position,
    animated,
    className
  }

  if (height !== undefined) props.height = height
  if (color !== undefined) props.color = color
  if (colors !== undefined) props.colors = colors

  return <Component {...props} />
}

export {
  WaveDivider,
  CurveDivider,
  ZigzagDivider,
  DotsDivider,
  GradientLine,
  AbstractDivider
}
