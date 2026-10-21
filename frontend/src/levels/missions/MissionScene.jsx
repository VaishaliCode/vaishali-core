import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { mission } from './missionState'

const CHAMPAGNE = new THREE.Color('#d6b77e')
const PLASMA = new THREE.Color('#7cc7ff')

// A different crystal for each mission file
const SHAPES = [
  (r) => new THREE.IcosahedronGeometry(r, 1),
  (r) => new THREE.OctahedronGeometry(r, 0),
  (r) => new THREE.DodecahedronGeometry(r, 0),
  (r) => new THREE.TorusKnotGeometry(r * 0.62, r * 0.2, 120, 12),
]

/* ---------- The data crystal floating above the projector ---------- */
function Crystal({ shape }) {
  const group = useRef()
  const wire = useRef()
  const inner = useRef()
  const outerGeo = useMemo(() => SHAPES[shape % SHAPES.length](1.35), [shape])
  const innerGeo = useMemo(() => SHAPES[shape % SHAPES.length](0.85), [shape])

  // free the old shapes' GPU memory when the crystal changes
  useEffect(() => () => {
    outerGeo.dispose()
    innerGeo.dispose()
  }, [outerGeo, innerGeo])

  useFrame((state, delta) => {
    const { scan, energy, surge } = mission
    const t = state.clock.elapsedTime
    const busy = Math.sin(scan * Math.PI) // 0 → 1 → 0 during a decrypt
    group.current.rotation.y += delta * (0.25 + busy * 2.2 + surge * 1.5)
    group.current.rotation.x = Math.sin(t * 0.3) * 0.25
    group.current.position.y = 0.35 + Math.sin(t * 0.8) * 0.12
    group.current.scale.setScalar(1 + busy * 0.08 + surge * 0.12)

    wire.current.material.color.copy(CHAMPAGNE).lerp(PLASMA, Math.max(busy, energy * 0.5))
    wire.current.material.opacity = 0.35 + busy * 0.5 + energy * 0.2
    inner.current.material.emissiveIntensity = 0.15 + energy * 0.9 + busy * 1.6 + surge * 2
  })

  return (
    <group ref={group}>
      <mesh ref={wire} geometry={outerGeo}>
        <meshBasicMaterial wireframe transparent opacity={0.4} color="#d6b77e" toneMapped={false} />
      </mesh>
      <mesh ref={inner} geometry={innerGeo}>
        <meshStandardMaterial color="#14161b" emissive="#7cc7ff" emissiveIntensity={0.2}
          metalness={0.9} roughness={0.25} toneMapped={false} flatShading />
      </mesh>
    </group>
  )
}

/* ---------- The scanner ring that sweeps up through the crystal while decrypting ---------- */
function Scanner() {
  const ring = useRef()
  useFrame(() => {
    const { scan } = mission
    ring.current.position.y = THREE.MathUtils.lerp(-1.4, 2.1, scan)
    ring.current.material.opacity = Math.sin(scan * Math.PI) * 0.9
    ring.current.scale.setScalar(1 - Math.abs(scan - 0.5) * 0.5)
  })
  return (
    <mesh ref={ring} rotation-x={Math.PI / 2}>
      <torusGeometry args={[1.7, 0.012, 8, 160]} />
      <meshBasicMaterial color="#7cc7ff" transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

/* ---------- Hologram projector: base rings + a cone of light ---------- */
function Projector() {
  const cone = useRef()
  const rings = useRef()
  useFrame((state, delta) => {
    const { scan, energy, surge } = mission
    const busy = Math.sin(scan * Math.PI)
    rings.current.rotation.z += delta * (0.2 + busy)
    cone.current.material.opacity = 0.035 + energy * 0.03 + busy * 0.05 + surge * 0.06
  })
  return (
    <group position-y={-2.2}>
      <group ref={rings} rotation-x={-Math.PI / 2}>
        {[1.0, 1.35, 1.7].map((r, i) => (
          <mesh key={r}>
            <torusGeometry args={[r, i === 1 ? 0.02 : 0.01, 8, 160]} />
            <meshStandardMaterial color="#d6b77e" emissive="#d6b77e" emissiveIntensity={0.4} metalness={1} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {/* light cone: open-ended, glowing additively */}
      <mesh ref={cone} position-y={2.1}>
        <cylinderGeometry args={[2.3, 1.0, 4.2, 48, 1, true]} />
        <meshBasicMaterial color="#7cc7ff" transparent opacity={0.04} side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- Camera: wide screens shift the crystal into the gap between list and file ---------- */
function CameraRig() {
  const { size } = useThree()
  const wide = size.width >= 1100
  const aspect = size.width / size.height
  const base = useRef(new THREE.Vector3(0, 0, 12))
  useFrame((state) => {
    const shiftX = wide ? 1.2 : 0
    const shiftY = wide ? 0 : -0.9 // narrow: crystal sits between the file strip and the viewer
    const z = (wide ? 10 : THREE.MathUtils.clamp(8 / aspect, 12.5, 22)) - mission.surge * 0.8
    base.current.x += (state.pointer.x * 0.6 - base.current.x) * 0.04
    base.current.y += (state.pointer.y * 0.4 - base.current.y) * 0.04
    base.current.z += (z - base.current.z) * 0.04
    state.camera.position.set(base.current.x + shiftX, base.current.y + shiftY + 0.4, base.current.z)
    state.camera.lookAt(shiftX, shiftY, 0)
  })
  return null
}

function Effects() {
  const bloom = useRef()
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.8 + Math.sin(mission.scan * Math.PI) * 0.8 + mission.surge * 1.5
  })
  return (
    <EffectComposer multisampling={4}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.2} intensity={0.8} radius={0.8} />
      <Vignette eskil={false} offset={0.2} darkness={0.9} />
    </EffectComposer>
  )
}

export default function MissionScene({ shape }) {
  return (
    <Canvas camera={{ position: [0, 0, 12], fov: 40 }} dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#050507']} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} color="#e8d3a8" />
      <pointLight position={[0, -1.5, 2]} intensity={6} distance={8} color="#7cc7ff" />

      <Stars radius={60} depth={40} count={2000} factor={3} saturation={0} fade speed={0.4} />
      <Sparkles count={70} scale={[6, 6, 4]} size={2.2} speed={0.5} color="#7cc7ff" opacity={0.55} />

      <Crystal shape={shape} />
      <Scanner />
      <Projector />
      <CameraRig />
      <Effects />
    </Canvas>
  )
}