import { useEffect, useRef } from 'react'

let lastPointerPosition = null
let lastPointerTargetInteractive = false

export default function CursorFollower({ overlay = false }) {
  const cursorRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const finePointer = window.matchMedia('(pointer: fine)')
    const coarsePointer = window.matchMedia('(pointer: coarse)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!cursor || reducedMotion.matches) return undefined

    if (!finePointer.matches) {
      if (!overlay || !coarsePointer.matches) return undefined
      let tapTimeout
      const handleTouchPointerDown = (event) => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return
        const target = event.target instanceof Element ? event.target : null
        cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`
        cursor.classList.toggle('is-interactive', Boolean(target?.closest('a, button, [role="button"]')))
        cursor.classList.remove('is-visible', 'is-tap')
        void cursor.offsetWidth
        cursor.classList.add('is-visible', 'is-tap')
        window.clearTimeout(tapTimeout)
        tapTimeout = window.setTimeout(() => cursor.classList.remove('is-visible', 'is-tap'), 700)
      }

      document.addEventListener('pointerdown', handleTouchPointerDown, { passive: true })
      return () => {
        window.clearTimeout(tapTimeout)
        document.removeEventListener('pointerdown', handleTouchPointerDown)
      }
    }

    if (!overlay) document.body.classList.add('has-custom-cursor')
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let frameId = 0

    if (overlay && lastPointerPosition) {
      targetX = lastPointerPosition.x
      targetY = lastPointerPosition.y
      currentX = targetX
      currentY = targetY
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`
      cursor.classList.add('is-visible')
      cursor.classList.toggle('is-interactive', lastPointerTargetInteractive)
    }

    const animate = () => {
      currentX += (targetX - currentX) * 0.22
      currentY += (targetY - currentY) * 0.22
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        frameId = requestAnimationFrame(animate)
      } else {
        frameId = 0
      }
    }

    const handlePointerMove = (event) => {
      if (event.pointerType === 'touch') return
      targetX = event.clientX
      targetY = event.clientY
      lastPointerPosition = { x: targetX, y: targetY }
      cursor.classList.add('is-visible')
      if (!frameId) frameId = requestAnimationFrame(animate)
    }

    const handlePointerOver = (event) => {
      if (!(event.target instanceof Element)) return
      lastPointerTargetInteractive = Boolean(event.target.closest('a, button, [role="button"]'))
      cursor.classList.toggle('is-interactive', lastPointerTargetInteractive)
    }

    const handlePointerLeave = () => cursor.classList.remove('is-visible')

    document.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerover', handlePointerOver)
    document.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      if (!overlay) document.body.classList.remove('has-custom-cursor')
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('pointerleave', handlePointerLeave)
      cancelAnimationFrame(frameId)
    }
  }, [overlay])

  return <span ref={cursorRef} className={`custom-cursor${overlay ? ' custom-cursor-overlay' : ''}`} aria-hidden="true"><span className="custom-cursor__ring" /><span className="custom-cursor__core" /><span className="custom-cursor__label">VIEW</span></span>
}