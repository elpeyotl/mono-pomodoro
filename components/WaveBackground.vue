<template>
  <div ref="containerRef" class="wave-background" />
</template>

<script setup lang="ts">
import * as THREE from 'three'

interface Props {
  mode?: 'focus' | 'shortBreak' | 'longBreak'
  isRunning?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'focus',
  isRunning: false
})

const containerRef = ref<HTMLDivElement | null>(null)

// Three.js objects
let scene: THREE.Scene
let camera: THREE.OrthographicCamera
let renderer: THREE.WebGLRenderer
let mesh: THREE.Mesh
let animationId: number
let startTime: number

// Color configurations for different modes - OCEAN TURQUOISE
const modeColors = {
  focus: {
    color1: new THREE.Color(0x00e5cc), // Bright turquoise/teal
    color2: new THREE.Color(0x0891b2), // Cyan/ocean blue
    color3: new THREE.Color(0x042f2e), // Dark teal background
    speed: 0.4
  },
  shortBreak: {
    color1: new THREE.Color(0x60a5fa), // Bright blue
    color2: new THREE.Color(0xa78bfa), // Bright purple
    color3: new THREE.Color(0x0a0a18), // Dark blue-tinted background
    speed: 0.2
  },
  longBreak: {
    color1: new THREE.Color(0x818cf8), // Bright indigo
    color2: new THREE.Color(0xf472b6), // Bright pink
    color3: new THREE.Color(0x100a18), // Dark purple-tinted background
    speed: 0.15
  }
}

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment Shader - Creates smooth, organic waves
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uSpeed;
  uniform float uIntensity;
  
  varying vec2 vUv;
  
  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    vec2 uv = vUv;
    float time = uTime * uSpeed;
    
    // Create multiple layers of waves - LARGER SCALE
    float wave1 = snoise(vec2(uv.x * 1.5 + time * 0.5, uv.y * 1.0 + time * 0.3)) * 0.5 + 0.5;
    float wave2 = snoise(vec2(uv.x * 2.0 - time * 0.4, uv.y * 1.5 + time * 0.2)) * 0.5 + 0.5;
    float wave3 = snoise(vec2(uv.x * 1.0 + time * 0.3, uv.y * 2.0 - time * 0.5)) * 0.5 + 0.5;
    
    // Combine waves with more weight
    float combinedWave = (wave1 * 1.0 + wave2 * 0.7 + wave3 * 0.5) / 2.2;
    
    // Apply intensity - HIGHER BASE INTENSITY
    float intensity = mix(0.5, 1.0, uIntensity);
    combinedWave *= intensity;
    
    // Create gradient from bottom to top
    float gradient = uv.y * 0.6 + 0.4;
    
    // Mix colors based on wave and gradient - MUCH MORE VISIBLE
    vec3 color = mix(uColor3, uColor2, combinedWave * 0.7);
    color = mix(color, uColor1, combinedWave * gradient * 0.6);
    
    // Boost overall brightness slightly
    color *= 1.1;
    
    // Add subtle vignette
    float vignette = 1.0 - length((uv - 0.5) * 1.0);
    vignette = smoothstep(0.0, 1.0, vignette);
    color *= 0.9 + vignette * 0.1;
    
    gl_FragColor = vec4(color, 1.0);
  }
`

// Current uniforms for smooth transitions
const currentColors = {
  color1: new THREE.Color(),
  color2: new THREE.Color(),
  color3: new THREE.Color(),
  speed: 0.3,
  intensity: 0.5
}

function initThree() {
  if (!containerRef.value) return
  
  // Scene
  scene = new THREE.Scene()
  
  // Camera (orthographic for 2D effect)
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.z = 1
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)
  
  // Initialize colors
  const initialMode = modeColors[props.mode]
  currentColors.color1.copy(initialMode.color1)
  currentColors.color2.copy(initialMode.color2)
  currentColors.color3.copy(initialMode.color3)
  currentColors.speed = initialMode.speed
  currentColors.intensity = props.isRunning ? 1.0 : 0.5
  
  // Shader Material
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: currentColors.color1 },
      uColor2: { value: currentColors.color2 },
      uColor3: { value: currentColors.color3 },
      uSpeed: { value: currentColors.speed },
      uIntensity: { value: currentColors.intensity }
    }
  })
  
  // Plane geometry (full screen)
  const geometry = new THREE.PlaneGeometry(2, 2)
  mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  // Start animation
  startTime = Date.now()
  animate()
  
  // Handle resize
  window.addEventListener('resize', onResize)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const material = mesh.material as THREE.ShaderMaterial
  const elapsed = (Date.now() - startTime) / 1000
  
  material.uniforms.uTime.value = elapsed
  
  // Smooth color transitions
  const targetMode = modeColors[props.mode]
  const lerpFactor = 0.02
  
  currentColors.color1.lerp(targetMode.color1, lerpFactor)
  currentColors.color2.lerp(targetMode.color2, lerpFactor)
  currentColors.color3.lerp(targetMode.color3, lerpFactor)
  currentColors.speed += (targetMode.speed - currentColors.speed) * lerpFactor
  
  const targetIntensity = props.isRunning ? 1.0 : 0.5
  currentColors.intensity += (targetIntensity - currentColors.intensity) * lerpFactor
  
  material.uniforms.uSpeed.value = currentColors.speed
  material.uniforms.uIntensity.value = currentColors.intensity
  
  renderer.render(scene, camera)
}

function onResize() {
  if (!renderer) return
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function cleanup() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', onResize)
  
  if (mesh) {
    mesh.geometry.dispose()
    ;(mesh.material as THREE.ShaderMaterial).dispose()
  }
  if (renderer) {
    renderer.dispose()
    if (containerRef.value && renderer.domElement) {
      containerRef.value.removeChild(renderer.domElement)
    }
  }
}

onMounted(() => {
  // Only run on client side
  if (typeof window !== 'undefined') {
    initThree()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.wave-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
}

.wave-background :deep(canvas) {
  display: block;
}
</style>
