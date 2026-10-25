import React from 'react'

export const GlassFilter = () => (
  <svg style={{ display: 'none' }} aria-hidden="true">
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
)

export const GlassEffect = ({
  children,
  className = '',
  style = {},
  appearance = 'light',
  href,
  target = '_blank',
  ...props
}) => {
  const isDark = appearance === 'dark'
  const glassStyle = {
    boxShadow: '0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)',
    transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
    ...style,
  }

  const content = (
    <div
      className={`relative flex overflow-hidden cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
      {...props}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        style={{
          borderRadius: 'inherit',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          filter: 'url(#glass-distortion)',
          isolation: 'isolate',
          pointerEvents: 'none',
        }}
      />
      <div
        className="absolute inset-0 z-10"
        style={{
          borderRadius: 'inherit',
          background: isDark ? 'rgba(20, 24, 32, 0.38)' : 'rgba(255, 255, 255, 0.25)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="absolute inset-0 z-20 overflow-hidden"
        style={{
          borderRadius: 'inherit',
          boxShadow: isDark
            ? 'inset 2px 2px 1px 0 rgba(255, 255, 255, 0.22), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.12)'
            : 'inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div className="relative z-30 w-full h-full flex items-center justify-center">{children}</div>
    </div>
  )

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  )
}

export const GlassDock = ({ icons = [], href }) => (
  <GlassEffect
    href={href}
    className="rounded-3xl p-3 hover:p-4 hover:rounded-4xl"
  >
    <div className="flex items-center justify-center gap-2 rounded-3xl p-3 py-0 px-0.5 overflow-hidden">
      {icons.map((icon, index) => (
        <img
          key={index}
          src={icon.src}
          alt={icon.alt}
          className="w-16 h-16 transition-all duration-700 hover:scale-110 cursor-pointer"
          style={{
            transformOrigin: 'center center',
            transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
          }}
          onClick={icon.onClick}
        />
      ))}
    </div>
  </GlassEffect>
)

export const GlassButton = ({ children, href, className = '', ...props }) => (
  <GlassEffect
    href={href}
    className={`rounded-3xl px-10 py-6 hover:px-11 hover:py-7 hover:rounded-4xl overflow-hidden ${className}`}
    {...props}
  >
    <div
      className="transition-all duration-700 hover:scale-95"
      style={{
        transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 2.2)',
      }}
    >
      {children}
    </div>
  </GlassEffect>
)

export const Component = () => (
  <div className="flex items-center justify-center">
    <GlassFilter />
    <GlassButton>
      <div className="text-xl text-white">
        <p>How can i help you today?</p>
      </div>
    </GlassButton>
  </div>
)

export default Component
