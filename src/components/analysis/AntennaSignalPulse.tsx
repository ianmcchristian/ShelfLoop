// --- Antenna Signal Pulse ----------------------------------------------------
// Animates 2-3 shallow spherical-cap "sheets" propagating from the antenna face
// toward the rig, simulating an expanding RFID read-field wavefront.
//
// Shape: SphereGeometry cap (~40deg polar angle) -- a shallow radar-dish
//        profile. Convex dome side leads toward the rig; concave opens back
//        toward the antenna.
//
// Motion:
//   - Pole (tip of dome, leading edge) starts at the antenna face and travels
//     TRAVEL units along the face normal over LIFETIME seconds.
//   - Cap expands uniformly: scale 0.05 -> 1.8 (the whole dish grows wider as
//     it propagates, like a real radio wavefront diverging from the source).
//   - mesh position = polePos - faceNormal * currentScale
//     so the pole is always at the front of the mesh regardless of scale.
//   - Passes through the rig and keeps going; fades continuously from 0.4 -> 0.
//
// Orientation:
//   rotation.x = PI - angleDeg_in_rad
//   At 0deg : rotation.x = PI   -> pole points (0,-1, 0) -- straight down
//   At 45deg: rotation.x = 3PI/4 -> pole points (0,-0.707,+0.707) -- down+north

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Pulse tuning ------------------------------------------------------------

const SHEET_COUNT   = 3;
const SHEET_STAGGER = 0.28;  // s between consecutive sheets
const SHEET_LIFE    = 1.8;   // s each sheet lives
const SCALE_START   = 0.05;  // initial cap radius (units)
const SCALE_END     = 1.8;   // final cap radius (units)
const TRAVEL        = 2.6;   // distance the pole travels (units) -- well past rig
const CAP_THETA     = Math.PI * 0.22; // ~40deg polar angle -- shallow dish depth

// Antenna geometry mirrored from Rig3DCanvas.tsx
const _ARM_Y     = 1.82;
const _ARM_Z     = 0.09;
const _ANTENNA_Y = 1.88;
const _ANTENNA_Z = 0.31;

// --- Component ---------------------------------------------------------------

export interface AntennaSignalPulseProps {
  /** Increment each press to fire a burst of sheets. 0 = no burst on mount. */
  pulseTrigger: number;
  angleDeg: 0 | 45;
}

export function AntennaSignalPulse({ pulseTrigger, angleDeg }: AntennaSignalPulseProps) {
  // One mesh ref per sheet -- avoids calling useRef inside a loop
  const ref0 = useRef<THREE.Mesh>(null);
  const ref1 = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  const meshRefs = [ref0, ref1, ref2] as const;

  // null = idle, -1 = pending (clock captured next frame), number = active burst start
  const burstStartRef = useRef<number | null>(null);

  // Pre-allocated scratch -- zero heap allocation in useFrame
  const _polePos  = useRef(new THREE.Vector3());
  const _meshPos  = useRef(new THREE.Vector3());

  // --- Geometry derived from angleDeg ----------------------------------------
  const antennaY = angleDeg === 0 ? _ARM_Y     : _ANTENNA_Y;
  const antennaZ = angleDeg === 0 ? _ARM_Z + 0.33 : _ANTENNA_Z;
  const radAngle = THREE.MathUtils.degToRad(angleDeg);

  // Antenna face centre (plate centre -- offset to true face is ~0.014 units, negligible)
  const facePos = useMemo(
    () => new THREE.Vector3(0, antennaY, antennaZ),
    [antennaY, antennaZ],
  );

  // Face normal -- direction the dome tip travels toward the rig
  //   0deg  -> (0, -1,    0   )   straight down
  //   45deg -> (0, -0.707,+0.707) down + northward
  const faceNormal = useMemo(
    () => new THREE.Vector3(0, -Math.cos(radAngle), Math.sin(radAngle)),
    [radAngle],
  );

  // Cap rotation: rotation.x = PI - radAngle aligns the +Y pole with faceNormal
  //   Verified: R_x(PI-a) applied to (0,1,0) gives (0,-cos(a),sin(a)) = faceNormal
  const capRotX = Math.PI - radAngle;

  // Shared cap geometry -- all sheets reuse the same buffer
  const capGeo = useMemo(
    () => new THREE.SphereGeometry(1, 36, 8, 0, Math.PI * 2, 0, CAP_THETA),
    [],
  );

  // --- Trigger ---------------------------------------------------------------
  useEffect(() => {
    if (pulseTrigger === 0) return; // ignore initial mount
    burstStartRef.current = -1;     // sentinel: captured from R3F clock next frame
  }, [pulseTrigger]);

  // --- Animation -------------------------------------------------------------
  useFrame(({ clock }) => {
    // Capture burst start from R3F clock (avoids wall-clock / R3F mismatch)
    if (burstStartRef.current === -1) {
      burstStartRef.current = clock.elapsedTime;
    }

    const burstStart = burstStartRef.current;
    const now        = clock.elapsedTime;

    // Expire burst once all sheets have finished
    const totalDuration = SHEET_LIFE + (SHEET_COUNT - 1) * SHEET_STAGGER + 0.05;
    if (burstStart !== null && now - burstStart > totalDuration) {
      burstStartRef.current = null;
    }

    for (let i = 0; i < SHEET_COUNT; i++) {
      const mesh = meshRefs[i]?.current;
      if (!mesh) continue;

      // Maintain correct orientation even if angleDeg changes between bursts
      mesh.rotation.x = capRotX;

      if (burstStart === null) { mesh.visible = false; continue; }

      const sheetStart = burstStart + i * SHEET_STAGGER;
      const age        = now - sheetStart;

      if (age < 0 || age > SHEET_LIFE) { mesh.visible = false; continue; }

      mesh.visible = true;

      const t  = age / SHEET_LIFE;          // linear 0->1
      const te = 1 - (1 - t) * (1 - t);    // quadratic ease-out: fast expand, slow tail

      // Scale: cap grows from SCALE_START to SCALE_END
      const s = SCALE_START + (SCALE_END - SCALE_START) * te;
      mesh.scale.setScalar(s);

      // Pole (leading tip) position along the face normal
      _polePos.current
        .copy(facePos)
        .addScaledVector(faceNormal, te * TRAVEL);

      // Mesh centre is behind the pole by exactly one scaled unit in face normal
      // polePos = meshPos + faceNormal * s  =>  meshPos = polePos - faceNormal * s
      _meshPos.current
        .copy(_polePos.current)
        .addScaledVector(faceNormal, -s);
      mesh.position.copy(_meshPos.current);

      // Fade: bright at birth (0.4), invisible at death
      const mat   = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.38 * (1 - t);
    }
  });

  // --- Render ----------------------------------------------------------------
  // Each mesh gets its own MeshBasicMaterial so opacity is independent per sheet.
  // Geometry is shared (read-only buffer, safe to reference from multiple meshes).
  // depthWrite:false prevents the transparent cap from clipping geometry behind it.
  return (
    <>
      {meshRefs.map((ref, i) => (
        <mesh key={i} ref={ref} visible={false}>
          <primitive object={capGeo} attach="geometry" />
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
