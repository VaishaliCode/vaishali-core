import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { transmission } from './transmissionState'

const FOCAL = 0.9 // focal length of the dish (where the feed horn sits)
const DISH_R = 2 // dish radius
const RIM_Y = (DISH_R * DISH_R) / (4 * FOCAL)
const BEAM_LEN = 40
const WAVES = 7

// Parabolic dish profile spun around the Y axis
function dishGeometry(points, segments) {
  const pts = []
  for (let i = 0; i <= points; i++) {
    const r = 0.12 + (i / points) * (DISH_R - 0.12)
    pts.push(new THREE.Vector2(r, (r * r) / (4 * FOCAL)))
  }
  return new THREE.LatheGeometry(pts, segments)
}

// Position + rotation for a thin rod between two points
function rod(from, to) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return { position: a.add(b).multiplyScalar(0.5), quaternion, length: dir.length() }
}

/* ---------- Glowing rim shader: bright at the edges, clear in the middle ---------- */
function useFresnelMaterial(color) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: 1 } },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
          float f = pow(clamp(1.0 - abs(dot(vNormal, vView)), 0.0, 1.0), 3.0);            gl_FragColor = vec4(uColor * f * uIntensity, f);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color],
  )
  useEffect(() => () => material.dispose(), [material])
  return material
}

/* ---------- The planet horizon below the station ---------- */
function Planet() {
  const atmosphere = useFresnelMaterial('#7cc7ff')
  useFrame(() => {
    atmosphere.uniforms.uIntensity.value = 0.9 + transmission.beam * 0.6 + transmission.surge * 0.8 + transmission.pulse * 0.6
  })
  return (
    <group position={[0, -46, -18]}>
      <mesh>
        <sphereGeometry args={[40, 128, 64]} />
        <meshStandardMaterial color="#0b0c10" roughness={1} metalness={0} />
      </mesh>
      <mesh material={atmosphere}>
        <sphereGeometry args={[40.6, 128, 64]} />
      </mesh>
    </group>
  )
}

/* ---------- Transmission beam + travelling wave rings ---------- */
function Beam() {
  const shaft = useRef()
  const outer = useRef()
  const core = useRef()
  const waves = useRef([])
  const phase = useRef(0)

  useFrame((_, dt) => {
    const { beam, pulse, surge } = transmission
    shaft.current.scale.y = Math.max(0.001, beam)
    outer.current.material.opacity = beam * (0.08 + pulse * 0.22 + surge * 0.08)
    core.current.material.opacity = beam * (0.45 + pulse * 0.5)

    phase.current += dt * (0.12 + pulse * 0.9)
    waves.current.forEach((w, i) => {
      if (!w) return
      const f = (phase.current + i / WAVES) % 1
      const y = f * BEAM_LEN * 0.55 * beam
      w.position.y = y
      w.scale.setScalar(0.1 + (0.85 * y) / BEAM_LEN + 0.05)
      w.material.opacity = beam * (1 - f) * (0.55 + pulse * 0.45)
    })
  })

  return (
    <group position-y={FOCAL}>
      <group ref={shaft}>
        <mesh ref={outer} position-y={BEAM_LEN / 2}>
          <cylinderGeometry args={[0.9, 0.08, BEAM_LEN, 48, 1, true]} />
          <meshBasicMaterial color="#7cc7ff" transparent opacity={0} side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={core} position-y={BEAM_LEN / 2}>
          <cylinderGeometry args={[0.12, 0.03, BEAM_LEN, 16, 1, true]} />
          <meshBasicMaterial color="#e8f6ff" transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {Array.from({ length: WAVES }, (_, i) => (
        <mesh key={i} ref={(m) => (waves.current[i] = m)} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1, 0.02, 8, 96]} />
          <meshBasicMaterial color="#7cc7ff" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- The uplink dish: scans the sky, then locks on and fires ---------- */
function Dish() {
  const yaw = useRef()
  const pitch = useRef()
  const feed = useRef()
  const bowl = useMemo(() => dishGeometry(28, 96), [])
  const grid = useMemo(() => dishGeometry(10, 32), [])
  const struts = useMemo(
    () => [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2
      return rod([Math.cos(a) * DISH_R, RIM_Y, Math.sin(a) * DISH_R], [0, FOCAL + 0.15, 0])
    }),
    [],
  )
  useEffect(() => () => {
    bowl.dispose()
    grid.dispose()
  }, [bowl, grid])

  useFrame((s) => {
    const { lock, beam, pulse, surge } = transmission
    const t = s.clock.elapsedTime
    // scanning sweep fades into a locked aim (beam leans up and to the left)
    yaw.current.rotation.y = lock * 0.5 + (1 - lock) * Math.sin(t * 0.35) * 0.9
    pitch.current.rotation.x = lock * -0.5 + (1 - lock) * (-0.25 + Math.sin(t * 0.5) * 0.15)
    feed.current.material.emissiveIntensity = 0.4 + beam * 2 + pulse * 3 + surge
    feed.current.scale.setScalar(1 + pulse * 0.6)
  })

  return (
    <group position-y={0.2}>
      {/* pedestal + counterweight */}
      <mesh position-y={-1.25}>
        <cylinderGeometry args={[0.14, 0.32, 2.1, 24]} />
        <meshStandardMaterial color="#15171d" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position-y={-0.25}>
        <sphereGeometry args={[0.26, 32, 16]} />
        <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.2} />
      </mesh>

      <group ref={yaw}>
        <group ref={pitch}>
          <mesh geometry={bowl}>
            <meshStandardMaterial color="#1b1d23" metalness={1} roughness={0.28} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={grid} position-y={0.012}>
            <meshBasicMaterial color="#9c7f4a" wireframe transparent opacity={0.35} toneMapped={false} />
          </mesh>
          <mesh position-y={RIM_Y} rotation-x={Math.PI / 2}>
            <torusGeometry args={[DISH_R, 0.035, 12, 128]} />
            <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.18} emissive="#9c7f4a" emissiveIntensity={0.3} />
          </mesh>
          {struts.map((r, i) => (
            <mesh key={i} position={r.position} quaternion={r.quaternion}>
              <cylinderGeometry args={[0.012, 0.012, r.length, 6]} />
              <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.3} />
            </mesh>
          ))}
          {/* feed horn at the focus */}
          <mesh position-y={FOCAL + 0.12} rotation-x={Math.PI}>
            <coneGeometry args={[0.1, 0.22, 24]} />
            <meshStandardMaterial color="#d6b77e" metalness={1} roughness={0.2} />
          </mesh>
          <mesh ref={feed} position-y={FOCAL}>
            <sphereGeometry args={[0.07, 24, 12]} />
            <meshStandardMaterial color="#14161b" emissive="#7cc7ff" emissiveIntensity={0.4} toneMapped={false} />
          </mesh>
          <Beam />
        </group>
      </group>
    </group>
  )
}

/* ---------- Station platform under the dish ---------- */
function Platform() {
  const ring = useRef()
  useFrame((s) => {
    const { beam, pulse } = transmission
    ring.current.material.opacity = 0.2 + beam * 0.5 + pulse * 0.3
    ring.current.rotation.z = s.clock.elapsedTime * 0.1
  })
  return (
    <group position-y={-2.1}>
      <mesh>
        <cylinderGeometry args={[2.6, 2.9, 0.16, 96]} />
        <meshStandardMaterial color="#0b0c10" metalness={0.85} roughness={0.4} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.085}>
        <ringGeometry args={[2.36, 2.38, 128]} />
        <meshBasicMaterial color="#9c7f4a" toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.09}>
        <ringGeometry args={[1.1, 1.13, 6]} />
        <meshBasicMaterial color="#7cc7ff" transparent opacity={0.2} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- Star field that streaks a little with every pulse ---------- */
function Sky() {
  const group = useRef()
  useFrame((_, dt) => {
    group.current.rotation.y += dt * (0.008 + transmission.pulse * 0.12 + transmission.surge * 0.05)
  })
  return (
    <group ref={group}>
      <Stars radius={70} depth={50} count={3000} factor={3.2} saturation={0} fade speed={0.5} />
    </group>
  )
}

/* ---------- Camera: keeps the station clear of the terminal panel ---------- */
function CameraRig() {
  const { size } = useThree()
  const base = useRef(new THREE.Vector3(0, 0, 11))
  useFrame((state) => {
    const aspect = size.width / size.height
    const wide = size.width > 1000
    const z = (wide ? 11 : THREE.MathUtils.clamp(8 / aspect, 11, 20)) - transmission.surge * 0.6
    const visH = 2 * z * Math.tan(THREE.MathUtils.degToRad(22.5))
    const shiftX = wide ? visH * aspect * 0.2 : 0
    const shiftY = wide ? 0 : -visH * 0.22

    base.current.x += (state.pointer.x * 0.7 - base.current.x) * 0.04
    base.current.y += (state.pointer.y * 0.4 - base.current.y) * 0.04
    base.current.z += (z - base.current.z) * 0.05
    state.camera.position.set(base.current.x + shiftX, base.current.y + 0.8 + shiftY, base.current.z)
    state.camera.lookAt(shiftX, 0.4 + shiftY, 0)
  })
  return null
}

function Effects() {
  const bloom = useRef()
  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.8 + transmission.pulse * 1.2 + transmission.surge * 1.0
  })
  return (
    <EffectComposer multisampling={4}>
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.3} intensity={0.8} radius={0.8} />
      <Vignette eskil={false} offset={0.2} darkness={0.9} />
    </EffectComposer>
  )
}

export default function TransmissionScene() {
  return (
    <Canvas camera={{ position: [0, 0.8, 11], fov: 45 }} dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#050507']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-5, 6, 4]} intensity={1.2} color="#e8d3a8" />
      <pointLight position={[0, 1.5, 2]} intensity={4} distance={8} color="#7cc7ff" />

      <Environment resolution={256}>
        <Lightformer form="ring" intensity={1.6} color="#e8d3a8" position={[0, 6, -6]} scale={6} />
        <Lightformer form="rect" intensity={1.2} color="#d6b77e" position={[-6, 2, 4]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#7cc7ff" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 1.5, 1]} />
      </Environment>

      <Sky />
      <Sparkles count={60} scale={[14, 8, 8]} size={2} speed={0.4} color="#7cc7ff" opacity={0.45} />

      <Planet />
      <Platform />
      <Dish />
      <CameraRig />
      <Effects />
    </Canvas>
  )
}