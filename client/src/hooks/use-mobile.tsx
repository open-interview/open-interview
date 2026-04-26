import * as React from "react"

const MOBILE_BREAKPOINT = 768

const getIsMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

const isMobileInitial = getIsMobile()

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(isMobileInitial)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(getIsMobile())
    }
    mql.addEventListener("change", onChange)
    setIsMobile(getIsMobile())
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
