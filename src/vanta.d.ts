interface VantaNetConfig {
  el: HTMLElement
  mouseControls: boolean
  touchControls: boolean
  gyroControls: boolean
  minHeight: number
  minWidth: number
  scale: number
  scaleMobile: number
  [key: string]: unknown
}

interface VantaEffect {
  destroy: () => void
}

interface Window {
  VANTA?: {
    NET: (config: VantaNetConfig) => VantaEffect
  }
}