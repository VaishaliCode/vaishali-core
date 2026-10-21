import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, MeshDistortMaterial, Sparkles, Stars, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { systems } from './systemsState'

const CHAMPAGNE = new THREE.Color('#d6b77e')
const PLASMA = new THREE.Color('#7cc7ff')
const CORE_RADIUS = 0.85

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smooth = (a, b, v) => Math.min(Math.max((v - a) / (b - a), 0), 1)

// Cell 0 sits at the top, the rest go clockwise around the core.
const angleFor = (i, n) => Math.PI / 2 - (i / n) * Math.PI * 2

// Grows the custom cursor ring when hovering a 3D cell (same look as hovering a button).
const setCursorHover = (on) => document.querySelector('.cursor-ring')?.classList.toggle('is-hover', on)

/* ---------- Layout: wide screens get a wide ellipse, phones a tall one ---------- */
function useLayout() {
  const { size } = useThree()
  return useMemo(() => {
    const portrait = size.width / size.height < 0.8
    return portrait
      ? { rx: 1.75, ry: 3.2, dock: 1.6, camZ: 16, shiftX: 0, shiftY: -0.9 }
      : { rx: 4.2, ry: 2.55, dock: 2.0, camZ: 11, shiftX: 1.4, shiftY: 0 } // scene sits left of the skills panel
  }, [size.width, size.height])
}

/* ---------- The reactor core in the middle ---------- */
function Core() {
  const mesh = useRef()
  const mat = useRef()
  useFrame((state) => {
    const { power, surge } = systems
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * (1.2 + power * 2.5)) * 0.03 * (0.4 + power)
    mesh.current.scale.setScalar(pulse * (0.82 + power * 0.18 + surge * 0.25))
    mat.current.emissiveIntensity = 0.25 + power * 0.8 + surge * 2.2
    mat.current.distort = 0.18 + power * 0.22 + surge * 0.3
    mat.current.emissive.copy(CHAMPAGNE).lerp(PLASMA, power * 0.45)
  })
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[CORE_RADIUS, 64, 64]} />
      <MeshDistortMaterial ref={mat} color="#1a1712" emissive="#d6b77e" metalness={0.6} roughness={0.25}
        speed={2} distort={0.2} toneMapped={false} />
    </mesh>
  )
}

/* ---------- Gyroscope rings around the core, faster as power rises ---------- */
const GYRO = [
  { r: 1.18, tilt: [1.2, 0, 0.3], speed: 0.35 },
  { r: 1.32, tilt: [0.4, 1.1, 0], speed: -0.25 },
  { r: 1.46, tilt: [-0.7, 0.5, 0.9], speed: 0.18 },
]
function Gyros() {
  const refs = useRef([])
  useFrame((_, delta) => {
    refs.current.forEach((m, i) => {
      if (m) m.rotation.z += delta * GYRO[i].speed * (1 + systems.power * 3 + systems.surge * 6)
    })
  })
  return GYRO.map((g, i) => (
    <group key={i} rotation={g.tilt}>
      <mesh ref={(el) => (refs.current[i] = el)}>
        <torusGeometry args={[g.r, 0.012, 10, 180]} />
        <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  ))
}

/* ---------- Docking ring + one slot per cell ---------- */
function DockRing({ count, cellStates, layout }) {
  const ring = useRef()
  useFrame(() => {
    ring.current.material.emissiveIntensity = 0.1 + systems.power * 0.9 + systems.surge * 2
  })
  return (
    <group>
      <mesh ref={ring}>
        <torusGeometry args={[layout.dock, 0.01, 8, 240]} />
        <meshStandardMaterial color="#9c7f4a" emissive="#d6b77e" metalness={1} roughness={0.3} toneMapped={false} />
      </mesh>
      {cellStates.map((state, i) => (
        <Slot key={i} index={i} count={count} state={state} layout={layout} />
      ))}
    </group>
  )
}

function Slot({ index, count, state, layout }) {
  const slot = useRef()
  const beam = useRef()
  const a = angleFor(index, count)
  const beamLength = layout.dock - CORE_RADIUS - 0.25
  const beamMid = CORE_RADIUS + 0.1 + beamLength / 2

  useFrame((st) => {
    const lit = smooth(0.85, 1, state.dock)
    slot.current.material.emissive.copy(CHAMPAGNE).lerp(PLASMA, lit)
    slot.current.material.emissiveIntensity = 0.3 + lit * 2.5
    beam.current.material.opacity = lit * (0.55 + Math.sin(st.clock.elapsedTime * 6 + index) * 0.25)
    beam.current.scale.x = 0.6 + lit * 0.4 + systems.surge * 1.5
  })

  return (
    <group>
      <mesh ref={slot} position={[Math.cos(a) * layout.dock, Math.sin(a) * layout.dock, 0]}>
        <torusGeometry args={[0.34, 0.012, 8, 64]} />
        <meshStandardMaterial color="#2a2d36" emissive="#d6b77e" toneMapped={false} />
      </mesh>
      {/* energy beam from the slot to the core, visible once docked */}
      <mesh ref={beam} position={[Math.cos(a) * beamMid, Math.sin(a) * beamMid, 0]} rotation-z={a - Math.PI / 2}>
        <cylinderGeometry args={[0.018, 0.018, beamLength, 8]} />
        <meshBasicMaterial color="#7cc7ff" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ---------- A power cell: flies from the outer orbit into its slot ---------- */
function Cell({ index, count, state, label, code, layout, onDock }) {
  const outer = useRef()
  const spin = useRef()
  const glow = useRef()
  const labelRef = useRef()
  const a = angleFor(index, count)

  const from = useMemo(() => new THREE.Vector3(Math.cos(a) * layout.rx, Math.sin(a) * layout.ry, 0), [a, layout])
  const to = useMemo(() => new THREE.Vector3(Math.cos(a) * layout.dock, Math.sin(a) * layout.dock, 0), [a, layout])

  useFrame((st, delta) => {
    const t = st.clock.elapsedTime
    const d = easeInOut(state.dock)
    state.hoverEase += (state.hover - state.hoverEase) * Math.min(1, delta * 8)
    const h = state.hoverEase

    // position: orbit → slot, arcing towards the camera mid-flight
    outer.current.position.lerpVectors(from, to, d)
    outer.current.position.y += Math.sin(t * 1.3 + index) * 0.09 * (1 - d)
    outer.current.position.z = Math.sin(d * Math.PI) * 1.4

    // undocked cells slowly spin, docked ones lock in place
    spin.current.rotation.y = t * 0.7 * (1 - d) + d * Math.PI * 2
    outer.current.scale.setScalar(1 + h * 0.18 * (1 - d) - d * 0.2)

    // energy: champagne idle → plasma when docked
    glow.current.material.emissive.copy(CHAMPAGNE).lerp(PLASMA, d)
    glow.current.material.emissiveIntensity = 0.6 + h * 1.6 + d * 2.2 + systems.surge * 3

    if (labelRef.current) labelRef.current.style.opacity = String(1 - smooth(0, 0.5, state.dock))
  })

  const hover = (on) => (e) => {
    e.stopPropagation()
    state.hover = on ? 1 : 0
    setCursorHover(on)
  }

  return (
    <group ref={outer}>
      <group rotation-z={a - Math.PI / 2}>
        <group ref={spin}>
          {/* glass shell */}
          <mesh>
            <capsuleGeometry args={[0.2, 0.62, 8, 24]} />
            <meshStandardMaterial color="#2a2d36" metalness={0.9} roughness={0.2} transparent opacity={0.5} />
          </mesh>
          {/* glowing core of the cell */}
          <mesh ref={glow}>
            <capsuleGeometry args={[0.1, 0.5, 6, 16]} />
            <meshStandardMaterial color="#111" emissive="#d6b77e" toneMapped={false} />
          </mesh>
          {/* gold bands */}
          {[-0.33, 0.33].map((y) => (
            <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.215, 0.02, 8, 48]} />
              <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.18} />
            </mesh>
          ))}
        </group>
      </group>

      {/* invisible, larger hit area so the cell is easy to click */}
      <mesh onPointerOver={hover(true)} onPointerOut={hover(false)}
        onClick={(e) => { e.stopPropagation(); onDock(index) }}>
        <sphereGeometry args={[0.62, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Html center position={[0, -0.78, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={labelRef} className="cell-label">
          <span className="mono">{code}</span>
          <strong>{label}</strong>
        </div>
      </Html>
    </group>
  )
}

/* ---------- Camera: gentle mouse parallax, push-in on surge ---------- */
function CameraRig({ layout }) {
  const base = useRef(new THREE.Vector3(0, 0, layout.camZ + 3))
  useFrame((state) => {
    const targetZ = layout.camZ - systems.surge * 1.3
    base.current.x += (state.pointer.x * 0.7 - base.current.x) * 0.04
    base.current.y += (state.pointer.y * 0.45 - base.current.y) * 0.04
    base.current.z += (targetZ - base.current.z) * 0.03
    state.camera.position.set(base.current.x + layout.shiftX, base.current.y + layout.shiftY, base.current.z)
    state.camera.lookAt(layout.shiftX, layout.shiftY, 0)
  })
  return null
}

function Effects() {
  const bloom = useRef()
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.7 + systems.power * 0.7 + systems.surge * 2.2
  })
  return (
    <EffectComposer multisampling={4}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.25} intensity={0.7} radius={0.8} />
      <Vignette eskil={false} offset={0.2} darkness={0.85} />
    </EffectComposer>
  )
}

function Stage({ groups, cellStates, labels, onDock }) {
  const layout = useLayout()
  return (
    <>
      <Core />
      <Gyros />
      <DockRing count={groups.length} cellStates={cellStates} layout={layout} />
      {groups.map((g, i) => (
        <Cell key={g.category} index={i} count={groups.length} state={cellStates[i]}
          label={labels[g.category] ?? g.category} code={`Cell ${String(i + 1).padStart(2, '0')}`}
          layout={layout} onDock={onDock} />
      ))}
      <CameraRig layout={layout} />
    </>
  )
}

export default function SystemsScene({ groups, cellStates, labels, onDock }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => setCursorHover(false)}
    >
      <color attach="background" args={['#050507']} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 6, 4]} intensity={1.1} color="#e8d3a8" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#e8d3a8" position={[0, 5, -6]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#7cc7ff" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <Stars radius={60} depth={40} count={2500} factor={3} saturation={0} fade speed={0.5} />
      <Sparkles count={60} scale={11} size={2} speed={0.35} color="#d6b77e" opacity={0.5} />

      <Stage groups={groups} cellStates={cellStates} labels={labels} onDock={onDock} />
      <Effects />
    </Canvas>
  )
}