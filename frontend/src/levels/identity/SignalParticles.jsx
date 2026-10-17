import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { signal } from './signalState'
import { profile } from '../../data/profile'

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uClarity;
  uniform float uPixel;
  attribute vec3 aRandom;
  attribute float aSeed;
  varying float vMix;

  void main() {
    float c = smoothstep(0.0, 1.0, clamp(uClarity * 1.25 - aSeed * 0.25, 0.0, 1.0));

    vec3 chaos = aRandom + vec3(
      sin(uTime * 0.6 + aSeed * 20.0),
      cos(uTime * 0.5 + aSeed * 13.0),
      sin(uTime * 0.4 + aSeed * 7.0)
    ) * 0.4;

    vec3 pos = mix(chaos, position, c);
    pos += vec3(sin(uTime * 30.0 + aSeed * 100.0), cos(uTime * 27.0 + aSeed * 80.0), 0.0) * 0.03 * (1.0 - c);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixel * (1.6 + aSeed * 1.8) * (8.0 / -mv.z);
    vMix = c;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vMix;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColorA, uColorB, vMix);
    gl_FragColor = vec4(col * (1.0 + vMix * 0.6), a * (0.35 + 0.65 * vMix));
  }
`

// Draw the name on a hidden canvas, then pick pixel positions for particles
async function sampleName(lines, count) {
  await document.fonts.load('500 250px "Cormorant Garamond"')
  await document.fonts.load('italic 400 250px "Cormorant Garamond"')

  const W = 1600
  const H = 600
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '500 250px "Cormorant Garamond"'
  ctx.fillText(lines[0], W / 2, H * 0.3)
  ctx.font = 'italic 400 250px "Cormorant Garamond"'
  ctx.fillText(lines[1], W / 2, H * 0.74)

  const data = ctx.getImageData(0, 0, W, H).data
  const pts = []
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 140) pts.push(x, y)

  const n = pts.length / 2
  const out = new Float32Array(count * 3)
  const scale = 9 / W
  for (let i = 0; i < count; i++) {
    const k = Math.floor(Math.random() * n) * 2
    out[i * 3] = (pts[k] - W / 2) * scale
    out[i * 3 + 1] = -(pts[k + 1] - H / 2) * scale
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.12
  }
  return out
}

function NameField() {
  const count = window.innerWidth < 760 ? 3500 : 7000
  const [targets, setTargets] = useState(null)
  const group = useRef()
  const smooth = useRef(0)
  const { viewport, gl } = useThree()

  useEffect(() => {
    let alive = true
    sampleName([profile.firstName, profile.lastName], count).then((t) => alive && setTargets(t))
    return () => {
      alive = false
    }
  }, [count])

  const { geometry, material } = useMemo(() => {
    if (!targets) return {}
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(targets, 3))
    const rnd = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      rnd[i * 3] = (Math.random() - 0.5) * 16
      rnd[i * 3 + 1] = (Math.random() - 0.5) * 9
      rnd[i * 3 + 2] = (Math.random() - 0.5) * 6
      seed[i] = Math.random()
    }
    g.setAttribute('aRandom', new THREE.BufferAttribute(rnd, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))

    const m = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uClarity: { value: 0 },
        uPixel: { value: 1 },
        uColorA: { value: new THREE.Color('#7cc7ff') },
        uColorB: { value: new THREE.Color('#e8d3a8') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geometry: g, material: m }
  }, [targets, count])

  useFrame((state) => {
    if (!material || !group.current) return
    smooth.current += (signal.clarity - smooth.current) * 0.06
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uClarity.value = smooth.current
    material.uniforms.uPixel.value = gl.getPixelRatio()
    group.current.rotation.y += (state.pointer.x * 0.25 - group.current.rotation.y) * 0.04
    group.current.rotation.x += (-state.pointer.y * 0.15 - group.current.rotation.x) * 0.04
  })

  if (!geometry) return null
  const s = Math.min(1, (viewport.width * 0.88) / 9)

  return (
    <group ref={group} scale={s}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}

export default function SignalParticles() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 40 }} dpr={[1, 1.75]} gl={{ antialias: false }}>
      <color attach="background" args={['#050507']} />
      <NameField />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.1} intensity={1.1} radius={0.75} />
      </EffectComposer>
    </Canvas>
  )
}