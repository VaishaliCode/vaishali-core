import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sparkles, Stars, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { reactor } from './reactorState'

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const easeIn = (t) => t * t * t

/* ---------- ARMOUR PLATES ---------- */
const ROWS = 4
const COLS = 8
const RADIUS = 2.2
const GAP = 0.03

function buildPlates() {
  const plates = []
  const phiLen = (Math.PI * 2) / COLS
  const thetaLen = Math.PI / ROWS

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const phiStart = c * phiLen + GAP
      const thetaStart = r * thetaLen + GAP
      const pl = phiLen - GAP * 2
      const tl = thetaLen - GAP * 2

      const geo = new THREE.SphereGeometry(RADIUS, 20, 10, phiStart, pl, thetaStart, tl)
      const phi = phiStart + pl / 2
      const theta = thetaStart + tl / 2
      const dir = new THREE.Vector3(
        -Math.cos(phi) * Math.sin(theta),
        Math.cos(theta),
        Math.sin(phi) * Math.sin(theta)
      ).normalize()
      const center = dir.clone().multiplyScalar(RADIUS)
      geo.translate(-center.x, -center.y, -center.z) // so each plate spins around its own center

      plates.push({
        geo,
        dir,
        center,
        delay: Math.random() * 0.45,
        scatter: 7 + Math.random() * 7,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        ),
        gold: (r * COLS + c) % 6 === 0,
      })
    }
  }
  return plates
}

function Plates() {
  const plates = useMemo(buildPlates, [])
  const group = useRef()
  const refs = useRef([])
  const materials = useMemo(
    () => ({
      steel: new THREE.MeshStandardMaterial({ color: '#1d1e24', metalness: 1, roughness: 0.3, side: THREE.DoubleSide }),
      gold: new THREE.MeshStandardMaterial({ color: '#c9a46a', metalness: 1, roughness: 0.2, side: THREE.DoubleSide }),
    }),
    []
  )

  useFrame((state, delta) => {
    const { assemble, charge, open } = reactor
    const t = state.clock.elapsedTime
    group.current.rotation.y += delta * (0.08 + charge * 0.4)

    plates.forEach((p, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      const a = easeInOut(clamp01(assemble * 1.45 - p.delay)) // fly in & lock
      const o = easeOut(clamp01(open * 1.45 - p.delay)) // blast apart
      const tremble = charge * charge * 0.05 * Math.sin(t * 45 + i * 1.7)
      const offset = (1 - a) * p.scatter + charge * 0.14 + tremble + o * 10

      mesh.position.copy(p.center).addScaledVector(p.dir, offset)
      const r = 1 - a + o * 0.8
      mesh.rotation.set(p.spin.x * r, p.spin.y * r, p.spin.z * r)
    })
  })

  return (
    <group ref={group}>
      {plates.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          geometry={p.geo}
          material={p.gold ? materials.gold : materials.steel}
        />
      ))}
    </group>
  )
}

/* ---------- PLASMA CORE ---------- */
function Core() {
  const mesh = useRef()
  const mat = useRef()
  const light = useRef()

  useFrame((state) => {
    const { assemble, charge, open } = reactor
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * (2 + charge * 16)) * 0.05 * (0.4 + charge)
    const s = (0.15 + 0.85 * easeOut(assemble)) * (0.62 + charge * 0.3 + open * 0.5) * pulse
    mesh.current.scale.setScalar(s)
    if (mat.current) {
      mat.current.distort = 0.28 + charge * 0.35
      mat.current.emissiveIntensity = 1.4 + charge * 3.5 + open * 5
    }
    light.current.intensity = 8 + charge * 50 + open * 80
  })

  return (
    <>
      <mesh ref={mesh}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          ref={mat}
          color="#7cc7ff"
          emissive="#7cc7ff"
          emissiveIntensity={1.4}
          distort={0.28}
          speed={2.5}
          roughness={0.1}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={light} color="#9fd6ff" intensity={8} distance={14} decay={2} />
    </>
  )
}

/* ---------- INNER LATTICE ---------- */
function Lattice() {
  const ref = useRef()
  useFrame((_, d) => {
    ref.current.rotation.y -= d * 0.15
    ref.current.rotation.x += d * 0.05
    const s = (0.3 + 0.7 * easeOut(reactor.assemble)) * (1 + reactor.open * 1.8)
    ref.current.scale.setScalar(s)
    ref.current.material.opacity = 0.22 * (1 - reactor.dive)
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.55, 1]} />
      <meshBasicMaterial color="#d6b77e" wireframe transparent opacity={0.22} />
    </mesh>
  )
}

/* ---------- GOLD GYROSCOPE RINGS ---------- */
const RING_SPECS = [
  { r: 3.0, tilt: [Math.PI / 2.4, 0, 0], axis: 'x', speed: 0.35 },
  { r: 3.35, tilt: [0, Math.PI / 3, Math.PI / 5], axis: 'y', speed: -0.25 },
  { r: 3.7, tilt: [Math.PI / 4, -Math.PI / 6, 0], axis: 'x', speed: 0.18 },
]

function GyroRings() {
  const group = useRef()
  const rings = useRef([])
  useFrame((_, d) => {
    const boost = 1 + reactor.charge * 6 + reactor.open * 4
    rings.current.forEach((m, i) => {
      if (m) m.rotation[RING_SPECS[i].axis] += d * RING_SPECS[i].speed * boost
    })
    const sc = easeOut(reactor.assemble) * (1 + reactor.open * 2.2)
    group.current.scale.setScalar(Math.max(sc, 0.0001))
  })
  return (
    <group ref={group}>
      {RING_SPECS.map((s, i) => (
        <group key={i} rotation={s.tilt}>
          <mesh ref={(el) => (rings.current[i] = el)}>
            <torusGeometry args={[s.r, 0.016, 12, 220]} />
            <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.18} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- CAMERA: drift in, mouse parallax, shake, dive ---------- */
function CameraRig() {
  const base = useRef(new THREE.Vector3(0, 0, 17))
  useFrame((state) => {
    const { assemble, charge, open, dive } = reactor
    const cam = state.camera
    const d = easeIn(dive)

    const idleZ = THREE.MathUtils.lerp(17, 9.5, easeInOut(assemble))
    base.current.z = THREE.MathUtils.lerp(idleZ, 0.15, d)
    base.current.x += (state.pointer.x * 0.9 * (1 - d) - base.current.x) * 0.05
    base.current.y += (state.pointer.y * 0.6 * (1 - d) - base.current.y) * 0.05

    const shake = charge * charge * 0.05 + (open > 0 && open < 0.6 ? 0.06 * (1 - open) : 0)
    cam.position.set(
      base.current.x + (Math.random() - 0.5) * shake,
      base.current.y + (Math.random() - 0.5) * shake,
      base.current.z
    )
    cam.lookAt(0, 0, 0)

    const fov = 40 + d * 55 // lens stretches as you get sucked in
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
  })
  return null
}

/* ---------- POST EFFECTS ---------- */
function Effects() {
  const bloom = useRef()
  const ca = useRef()
  const caOffset = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.9 + reactor.charge * 1.5 + reactor.open * 3
    if (ca.current) {
      const v = 0.0004 + reactor.charge * 0.003 + reactor.dive * 0.012
      ca.current.offset.set(v, v * 0.6)
    }
  })
  return (
    <EffectComposer multisampling={4}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.25} intensity={0.9} radius={0.8} />
      <ChromaticAberration ref={ca} offset={caOffset} radialModulation={false} modulationOffset={0} />
      <Vignette eskil={false} offset={0.2} darkness={0.85} />
    </EffectComposer>
  )
}

export default function ReactorScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 17], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#050507']} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 6, 4]} intensity={1.2} color="#e8d3a8" />

      {/* Studio reflections for the metal, built locally (no downloads) */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#e8d3a8" position={[0, 5, -6]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#7cc7ff" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[5, 2, 4]} scale={3} />
      </Environment>

      <Stars radius={60} depth={40} count={3000} factor={3} saturation={0} fade speed={0.6} />
      <Sparkles count={80} scale={10} size={2} speed={0.4} color="#d6b77e" opacity={0.6} />

      <Core />
      <Lattice />
      <Plates />
      <GyroRings />
      <CameraRig />
      <Effects />
    </Canvas>
  )
}