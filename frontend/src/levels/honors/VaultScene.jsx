import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Line, Sparkles, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { vault } from './vaultState'

const CHAMPAGNE = new THREE.Color('#d6b77e')
const PLASMA = new THREE.Color('#7cc7ff')
const STEEL = new THREE.Color('#2a2d36')

const RING = 4.2 // radius of the capsule carousel
const CORE_Y = 3.3 // height of the vault heart above the carousel
const FLOOR = -1.75 // the platform the capsules float over
const R = 0.55 // capsule radius
const H = 0.7 // straight wall height of each capsule half
const SPLIT = 0.6 // how far each half slides away when a capsule opens
const LIFT = 0.35 // how far an open capsule rises
const BOLTS = 6 // lock bolts around the seam

// Grows the custom cursor ring when hovering a capsule (same look as hovering a button).
export const setCursorHover = (on) => document.querySelector('.cursor-ring')?.classList.toggle('is-hover', on)

// Half a capsule (straight wall + dome) spun around the Y axis. One geometry shared by every half.
const HALF_SHELL = (() => {
  const pts = [new THREE.Vector2(R, 0), new THREE.Vector2(R, H)]
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2)
    pts.push(new THREE.Vector2(Math.cos(a) * R, H + Math.sin(a) * R))
  }
  return new THREE.LatheGeometry(pts, 64)
})()

/* ---------- One half of a capsule: dark chrome shell + gold trim ---------- */
function Shell({ shellRef, flip = false }) {
  return (
    <group ref={shellRef}>
      <group rotation-x={flip ? Math.PI : 0}>
        <mesh geometry={HALF_SHELL}>
          <meshStandardMaterial color="#1b1d23" metalness={1} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {[H * 0.55, 0.04].map((y, i) => (
          <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
            <torusGeometry args={[R + 0.005, i === 0 ? 0.016 : 0.01, 8, 64]} />
            <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.2} emissive="#9c7f4a" emissiveIntensity={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------- The certificate medallion that waits inside each capsule ---------- */
function Medallion({ medalRef, matRef }) {
  return (
    <group ref={medalRef} scale={0.001}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.42, 0.42, 0.06, 64]} />
        <meshStandardMaterial ref={matRef} color="#d6b77e" metalness={1} roughness={0.18}
          emissive="#d6b77e" emissiveIntensity={0.2} />
      </mesh>
      {[0.034, -0.034].map((z) => (
        <group key={z} position-z={z}>
          <mesh>
            <torusGeometry args={[0.3, 0.01, 8, 64]} />
            <meshBasicMaterial color="#fff4dc" toneMapped={false} />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.12, 0]} />
            <meshBasicMaterial color="#7cc7ff" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- A vault capsule: sealed shell, spinning seal ring, lock bolts, medallion ---------- */
function Capsule({ index, count, state, focused, onSelect, onUnseal }) {
  const body = useRef()
  const top = useRef()
  const bottom = useRef()
  const sealSpin = useRef()
  const seal = useRef()
  const bolts = useRef([])
  const medal = useRef()
  const medalMat = useRef()
  const pad = useRef()
  const hovered = useRef(false)
  const hover = useRef(0)
  const focusEase = useRef(0)

  const angle = (index / count) * Math.PI * 2
  const position = [Math.sin(angle) * RING, 0, Math.cos(angle) * RING]

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    const open = state.open
    const unseal = focused ? vault.unseal : 0
    const busy = Math.sin(unseal * Math.PI) // 0 → 1 → 0 while the locks release
    const retract = Math.max(unseal, open)
    const front = Math.cos(angle + vault.turn) * 0.5 + 0.5 // 1 = facing the camera
    const k = Math.min(1, dt * 8)
    hover.current += ((hovered.current ? 1 : 0) - hover.current) * k
    focusEase.current += ((focused ? 1 : 0) - focusEase.current) * k

    body.current.position.y = Math.sin(t * 0.9 + index * 1.7) * 0.06 + hover.current * 0.1 + open * LIFT
    body.current.scale.setScalar(0.8 + front * 0.2)

    // the two halves slide apart
    top.current.position.y = open * SPLIT
    bottom.current.position.y = -open * SPLIT

    // seal ring: plasma while locked, champagne halo once open
    sealSpin.current.rotation.y += dt * (0.25 + busy * 8)
    seal.current.material.color.copy(PLASMA).lerp(CHAMPAGNE, open)
    seal.current.material.opacity = Math.min(1, 0.45 + busy * 0.55 + hover.current * 0.2 + focusEase.current * 0.2)
    seal.current.scale.setScalar(1 + open * 0.45 + busy * 0.06)

    // bolts slide outward and shrink away
    bolts.current.forEach((bolt, i) => {
      if (!bolt) return
      const a = (i / BOLTS) * Math.PI * 2
      const r = R + 0.05 + retract * 0.3
      bolt.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
      bolt.scale.setScalar(Math.max(0.001, 1 - retract))
    })

    // medallion grows out of the opening and turns slowly
    medal.current.scale.setScalar(Math.max(0.001, open ** 1.5) * 1.1)
    medal.current.rotation.y = t * 0.7 + index
    medalMat.current.emissiveIntensity = 0.2 + open * 0.9 + vault.surge * 1.2

    // floor pad lights up under the selected capsule
    pad.current.material.color.copy(STEEL).lerp(CHAMPAGNE, Math.max(focusEase.current, open * 0.5))
    pad.current.material.opacity = 0.5 + focusEase.current * (0.35 + Math.sin(t * 3) * 0.15)
  })

  return (
    <group position={position}>
      <mesh ref={pad} position-y={FLOOR + 0.1} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.8, 0.012, 8, 96]} />
        <meshBasicMaterial color="#2a2d36" transparent toneMapped={false} />
      </mesh>

      <group ref={body}>
        <Shell shellRef={top} />
        <Shell shellRef={bottom} flip />

        <group ref={sealSpin}>
          <mesh ref={seal} rotation-x={Math.PI / 2}>
            <torusGeometry args={[R + 0.03, 0.02, 10, 96]} />
            <meshBasicMaterial color="#7cc7ff" transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {Array.from({ length: BOLTS }, (_, i) => (
            <mesh key={i} ref={(m) => (bolts.current[i] = m)} rotation-y={-(i / BOLTS) * Math.PI * 2}>
              <boxGeometry args={[0.12, 0.08, 0.09]} />
              <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.25} />
            </mesh>
          ))}
        </group>

        <Medallion medalRef={medal} matRef={medalMat} />
      </group>

      {/* invisible hit area: easier to click than the thin shell */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          hovered.current = true
          setCursorHover(true)
        }}
        onPointerOut={() => {
          hovered.current = false
          setCursorHover(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (focused) onUnseal()
          else onSelect(index)
        }}
      >
        <cylinderGeometry args={[R * 1.35, R * 1.35, (H + R) * 2 + 0.5, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}

/* ---------- Energy beam from an open capsule up to the vault heart ---------- */
function Beam({ index, count, state }) {
  const line = useRef()
  const points = useMemo(() => {
    const a = (index / count) * Math.PI * 2
    return [[Math.sin(a) * RING, H + R + LIFT + SPLIT, Math.cos(a) * RING], [0, CORE_Y, 0]]
  }, [index, count])

  useFrame((_, dt) => {
    const m = line.current?.material
    if (!m) return
    m.opacity = state.open * (0.55 + vault.surge * 0.4)
    m.dashOffset -= dt * 0.9
  })

  return (
    <Line ref={line} points={points} color="#d6b77e" lineWidth={1.2} dashed dashSize={0.22} gapSize={0.14}
      transparent opacity={0} toneMapped={false} />
  )
}

/* ---------- The ring of capsules; GSAP turns it via vault.turn ---------- */
function Carousel({ capsules, focus, onSelect, onUnseal }) {
  const ring = useRef()
  useFrame(() => {
    ring.current.rotation.y = vault.turn
  })
  return (
    <group ref={ring}>
      {capsules.map((state, i) => (
        <group key={i}>
          <Capsule index={i} count={capsules.length} state={state} focused={i === focus}
            onSelect={onSelect} onUnseal={onUnseal} />
          <Beam index={i} count={capsules.length} state={state} />
        </group>
      ))}
    </group>
  )
}

/* ---------- Vault heart: grows brighter with every capsule opened ---------- */
function VaultHeart() {
  const group = useRef()
  const core = useRef()
  const wire = useRef()
  const rings = useRef([])
  const light = useRef()

  useFrame((s, dt) => {
    const { energy, surge } = vault
    const t = s.clock.elapsedTime
    const speed = 0.25 + energy * 0.8 + surge * 2
    group.current.position.y = CORE_Y + Math.sin(t * 0.6) * 0.08

    core.current.rotation.y += dt * speed
    core.current.rotation.x += dt * speed * 0.4
    core.current.scale.setScalar(0.55 + energy * 0.45 + surge * 0.2)
    core.current.material.emissiveIntensity = 0.15 + energy * 1.3 + surge * 2.5

    wire.current.rotation.y -= dt * speed * 0.6
    wire.current.material.opacity = 0.12 + energy * 0.35 + surge * 0.3

    rings.current.forEach((r, i) => {
      r.rotation.x += dt * speed * (0.3 + i * 0.25)
      r.rotation.y += dt * speed * (0.5 - i * 0.15)
    })
    light.current.intensity = 3 + energy * 25 + surge * 30
  })

  return (
    <group ref={group}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#15171d" emissive="#d6b77e" emissiveIntensity={0.15}
          metalness={0.9} roughness={0.25} flatShading toneMapped={false} />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial wireframe color="#7cc7ff" transparent opacity={0.15} toneMapped={false} />
      </mesh>
      {[0.82, 0.92, 1.02].map((r, i) => (
        <mesh key={r} ref={(m) => (rings.current[i] = m)}>
          <torusGeometry args={[r, 0.008, 8, 128]} />
          <meshStandardMaterial color="#d6b77e" emissive="#d6b77e" emissiveIntensity={0.35} metalness={1} roughness={0.2} />
        </mesh>
      ))}
      <pointLight ref={light} color="#e8d3a8" intensity={3} distance={14} />
    </group>
  )
}

/* ---------- Platform: dark metal disc, gold track, light column under the heart ---------- */
function Platform() {
  const column = useRef()
  const track = useRef()
  useFrame(() => {
    const { energy, surge } = vault
    column.current.material.opacity = 0.025 + energy * 0.06 + surge * 0.08
    track.current.material.opacity = 0.15 + energy * 0.6 + surge * 0.25
  })
  const columnHeight = CORE_Y - FLOOR
  return (
    <group>
      <group position-y={FLOOR}>
        <mesh>
          <cylinderGeometry args={[6.4, 6.7, 0.14, 128]} />
          <meshStandardMaterial color="#0b0c10" metalness={0.85} roughness={0.4} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.075}>
          <ringGeometry args={[RING - 0.012, RING + 0.012, 160]} />
          <meshBasicMaterial color="#9c7f4a" toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.075}>
          <ringGeometry args={[6.08, 6.1, 160]} />
          <meshBasicMaterial color="#2a2d36" toneMapped={false} />
        </mesh>
        <mesh ref={track} rotation-x={-Math.PI / 2} position-y={0.08}>
          <ringGeometry args={[1.98, 2.02, 128]} />
          <meshBasicMaterial color="#7cc7ff" transparent opacity={0.15} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={column} position-y={FLOOR + columnHeight / 2}>
        <cylinderGeometry args={[0.35, 1.2, columnHeight, 48, 1, true]} />
        <meshBasicMaterial color="#d6b77e" transparent opacity={0.03} side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- Camera: keeps the vault clear of the plaque panel on any screen ---------- */
function CameraRig() {
  const { size } = useThree()
  const base = useRef(new THREE.Vector3(0, 0, 12))
  useFrame((state) => {
    const aspect = size.width / size.height
    const wide = size.width > 1000
    const z = (wide ? 12 : THREE.MathUtils.clamp(12.6 / aspect, 12, 24)) - vault.surge * 0.8
    const visH = 2 * z * Math.tan(THREE.MathUtils.degToRad(22.5))
    const shiftX = wide ? visH * aspect * 0.18 : 0 // wide: vault sits left of the panel
    const shiftY = wide ? 0 : -visH * 0.2 // narrow: vault sits above the panel

    base.current.x += (state.pointer.x * 0.7 - base.current.x) * 0.04
    base.current.y += (state.pointer.y * 0.4 - base.current.y) * 0.04
    base.current.z += (z - base.current.z) * 0.05
    state.camera.position.set(base.current.x + shiftX, base.current.y + 2.2 + shiftY, base.current.z)
    state.camera.lookAt(shiftX, 0.6 + shiftY, 0)
  })
  return null
}

function Effects() {
  const bloom = useRef()
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.7 + Math.sin(vault.unseal * Math.PI) * 0.6 + vault.surge * 1.4
  })
  return (
    <EffectComposer multisampling={4}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.3} intensity={0.7} radius={0.75} />
      <Vignette eskil={false} offset={0.2} darkness={0.9} />
    </EffectComposer>
  )
}

export default function VaultScene({ capsules, focus, onSelect, onUnseal }) {
  return (
    <Canvas camera={{ position: [0, 2.2, 12], fov: 45 }} dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => setCursorHover(false)}>
      <color attach="background" args={['#050507']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} color="#e8d3a8" />

      <Environment resolution={256}>
        <Lightformer form="ring" intensity={1.6} color="#e8d3a8" position={[0, 6, -6]} scale={6} />
        <Lightformer form="rect" intensity={1.2} color="#d6b77e" position={[-6, 2, 4]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#7cc7ff" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 1.5, 1]} />
        <Lightformer form="circle" intensity={0.6} color="#ffffff" position={[0, 8, 4]} scale={3} />
      </Environment>

      <Stars radius={60} depth={40} count={2200} factor={3} saturation={0} fade speed={0.4} />
      <Sparkles count={80} scale={[12, 6, 12]} size={2.2} speed={0.4} color="#e8d3a8" opacity={0.5} />

      <Platform />
      <VaultHeart />
      <Carousel capsules={capsules} focus={focus} onSelect={onSelect} onUnseal={onUnseal} />
      <CameraRig />
      <Effects />
    </Canvas>
  )
}