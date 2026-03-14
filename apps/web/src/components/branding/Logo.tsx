type LogoVariant = 'full' | 'compact' | 'symbol'
type LogoSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<LogoSize, number> = {
  sm: 28,
  md: 40,
  lg: 54,
}

const colorPresets = {
  light: {
    text: '#0f172a',
    secondaryText: '#475569',
    shadow: 'rgba(15, 23, 42, 0.35)',
    gradient: 'linear-gradient(135deg, #0ea5e9, #312e81)',
  },
  dark: {
    text: '#f8fafc',
    secondaryText: '#e2e8f0',
    shadow: 'rgba(15, 23, 42, 0.7)',
    gradient: 'linear-gradient(145deg, #14b8a6, #0ea5e9 60%, #312e81)',
  },
} as const

export type LogoProps = {
  variant?: LogoVariant
  size?: LogoSize
  color?: keyof typeof colorPresets
  className?: string
}

export function Logo({ variant = 'full', size = 'md', color = 'light', className }: LogoProps) {
  const diameter = sizeMap[size]
  const { text, secondaryText, shadow, gradient } = colorPresets[color]

  const containerStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: variant === 'symbol' ? 0 : 8,
    fontFamily: '"Space Grotesk", "Sora", "PingFang SC", sans-serif',
    letterSpacing: 0.04,
  }

  const symbolStyles = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 5,
    backgroundImage: gradient,
    boxShadow: `0 18px 30px ${shadow}`,
    position: 'relative' as const,
    overflow: 'hidden',
  }

  const stripeStyles = {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: '40%',
    height: '50%',
    background: 'rgba(255, 255, 255, 0.65)',
    borderRadius: '0 0 0 18px',
  }

  const highlightStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '50%',
    height: '55%',
    borderRadius: '18px',
    background: 'rgba(255, 255, 255, 0.35)',
  }

  const textStyles = {
    color: text,
    lineHeight: 1.1,
  }

  const taglineStyles = {
    fontSize: 12,
    color: secondaryText,
    letterSpacing: 0.84,
    textTransform: 'uppercase' as const,
    marginTop: 4,
  }

  return (
    <div className={className} style={containerStyles}>
      <div style={symbolStyles}>
        <div style={highlightStyles} />
        <div style={stripeStyles} />
      </div>
      {variant !== 'symbol' && (
        <div style={textStyles}>
          <div style={{ fontSize: size === 'lg' ? 26 : 22, fontWeight: 600 }}>NovaDT</div>
          {variant === 'full' && <p style={taglineStyles}>Digital twin ops</p>}
        </div>
      )}
    </div>
  )
}

Logo.displayName = 'Logo'
