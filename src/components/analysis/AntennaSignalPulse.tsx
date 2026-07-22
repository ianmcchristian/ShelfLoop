// ─── Antenna Signal Pulse ─────────────────────────────────────────────────────
// Animates 3 expanding flat rings from the antenna face to simulate an RFID
// read field. Triggered by incrementing `pulseTrigger`.
//
// Ring behaviour:
//   - 3 rings fire in a tight staggered cluster (0 / 0.22 / 0.44 s delay)
//   - Each ring starts at the antenna face, expands radius 0→1.5 units over 2 s
//   - Rings travel forward along the face normal (hemisphere-forward direction)
//   - Opacity fades 0.55→0 over the ring's lifetime
//   - Ring plane is always perpendicular to the antenna face normal:
//       rotation.x = PI/2 − angleDeg_in_radians
//       At 0°  → PI/2  (ring in XZ plane, normal = -Y, travels straight down)
//       At 45° → PI/4  (ring tilted, normal = (0,−0.707,+0.707))

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Pulse tuning ─────────────────────────────────────────────────────────────

const RING_COUNT    = 3;
const RING_STAGGER  = 0.22;   // s between consecutive rings in the burst
const RING_LIFETIME = 2.0;    // s each ring lives
const RING_MAX_R    = 1.5;    // max scale (radius in units)
const RING_TRAVEL   = 1.1;    // distance the ring moves along face normal (units)
const RING_INNER_R  = 0.82;   // inner radius fraction of ring geometry
const RING_OUTER_R  = 1.0;    // outer radius (unit; scaled in useFrame)
const RING_SEGMENTS = 72;     // polygon count — smooth enough at any radius

// Antenna geometry — mirrors the constants in Rig3DCanvas.tsx
// (these define where the antenna plate sits in world space)
const _ARM_Y     = 1.82;
const _ARM_Z     = 0.09;
const _ANTENNA_Y = 1.88;
const _ANTENNA_Z = 0.31;

// ─── Component ────────────────────────────────────────────────────────────────

export interface AntennaSignalPulseProps {
  /** Increment to fire a burst of 3 rings. Value 0 = no burst on mount. */
  pulseTrigger: number;
  angleDeg: 0 | 45;
}

export function AntennaSignalPulse({ pulseTrigger, angleDeg }: AntennaSignalPulseProps) {
  // Three individual refs — avoids calling useRef in a loop (hooks rules)
  const ref0 = useRef<THREE.Mesh>(null);
  const ref1 = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  const meshRefs = [ref0, ref1, ref2] as const;

  // Burst start time in R3F clock seconds.
  // null  = no active burst
  // -1    = pending — will be assigned from clock on the next useFrame
  const burstStartRef = useRef<number | null>(null);

  // Pre-allocated scratch vector — zero heap allocation inside useFrame
  const _pos = useRef(new THREE.Vector3());

  // ── Antenna geometry derived from angle ──────────────────────────────────
  const antennaY  = angleDeg === 0 ? _ARM_Y     : _ANTENNA_Y;
  const antennaZ  = angleDeg === 0 ? _ARM_Z + 0.33 : _ANTENNA_Z;
  const radAngle  = THREE.MathUtils.degToRad(angleDeg);

  // Plate centre — negligible (~0.01 unit) offset vs. actual face; not worth the math
  const facePos = useMemo(
    () => new THREE.Vector3(0, antennaY, antennaZ),
    [antennaY, antennaZ],
  );

  // Face normal: (0, -cos(angle), sin(angle))
  //   At 0° → (0, -1, 0)   — straight down
  //   At 45° → (0, -0.707, +0.707) — down + south toward rig
  const faceNormal = useMemo(
    () => new THREE.Vector3(0, -Math.cos(radAngle), Math.sin(radAngle)),
    [radAngle],
  );

  // Ring orientation: rotate the XY-plane ring so its normal matches faceNormal
  //   rotation.x = PI/2 − radAngle  →  normal = (0, -sin(rotation.x), cos(rotation.x))
  //                                           = (0, -cos(angle), sin(angle)) 
  const ringRotX = Math.PI / 2 - radAngle;

  // Shared geometry — all 3 meshes reference this; materials are separate
  const ringGeo = useMemo(
    () => new THREE.RingGeometry(RING_INNER_R, RING_OUTER_R, RING_SEGMENTS),
    [],
  );

  // ── Trigger ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // pulseTrigger === 0 is the initial render — ignore it
    if (pulseTrigger === 0) return;
    burstStartRef.current = -1; // sentinel: clock time captured on next frame
  }, [pulseTrigger]);

  // ── Animation ─────────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    // Capture burst start from R3F clock (avoids wall-clock / R3F clock mismatch)
    if (burstStartRef.current === -1) {
      burstStartRef.current = clock.elapsedTime;
    }

    const burstStart = burstStartRef.current;
    const now        = clock.elapsedTime;

    // Expire burst once all rings have finished
    const totalDuration = RING_LIFETIME + (RING_COUNT - 1) * RING_STAGGER + 0.05;
    if (burstStart !== null && now - burstStart > totalDuration) {
      burstStartRef.current = null;
    }

    for (let i = 0; i < RING_COUNT; i++) {
      const mesh = meshRefs[i]?.current;
      if (!mesh) continue;

      // Always keep rotation correct (handles hot-switching angle mid-burst)
      mesh.rotation.x = ringRotX;

      if (burstStart === null) { mesh.visible = false; continue; }

      const ringStart = burstStart + i * RING_STAGGER;
      const age       = now - ringStart;

      if (age < 0 || age > RING_LIFETIME) { mesh.visible = false; continue; }

      mesh.visible = true;

      const t  = age / RING_LIFETIME;        // linear 0 → 1
      const te = 1 - (1 - t) * (1 - t);     // quadratic ease-out (fast start, slow end)

      // Radius expansion
      mesh.scale.setScalar(RING_MAX_R * te);

      // Forward travel along the face normal
      _pos.current
        .copy(facePos)
        .addScaledVector(faceNormal, te * RING_TRAVEL);
      mesh.position.copy(_pos.current);

      // Fade out — brightest at birth, fully transparent at death
      const mat    = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity  = 0.55 * (1 - t);
    }
  });

  // ── Render ────────────────────────────────────────────────────────────────
  // All rings start hidden (visible=false in useFrame on first tick).
  // Each gets its own material instance so opacity can be animated independently.
  return (
    <>
      {meshRefs.map((ref, i) => (
        <mesh key={i} ref={ref} visible={false}>
          <primitive object={ringGeo} attach="geometry" />
          <meshBasicMaterial
            color="#2563eb"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
