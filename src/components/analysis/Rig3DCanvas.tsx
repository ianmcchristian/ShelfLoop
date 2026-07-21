// ─── Rig 3D Canvas ────────────────────────────────────────────────────────────
// Interactive WebGL visualisation of the 8-box 2×2×2 RFID test rig.
//
// Selection UX
//   • Click a box  : zooms camera in, pivots orbit to that box, scales it 1.75×,
//                    others go translucent.
//   • Click again  : deselects — camera animates back to origin, full opacity.
//
// Idle (no data)   : slow auto-rotate + retail-blue emissive pulse.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import type { BoxResult, RigPosition } from './rfidTypes';
import { RIG_LAYOUT } from './rfidTypes';
import { rssiToHex, rssiToPct, RSSI_MISSED_COLOR } from './rfidColorUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOX_SIZE       = 0.92;
const STEP           = 1.08;
// Camera sits on the North-West side by default so the north row is visually on top
// and West/East still map left/right the way Ian expects.
const DEFAULT_CAM    = new THREE.Vector3(-2.4, 2.2, 3.4);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);
const COMPASS_RADIUS = 1.72;
const COMPASS_Y      = 1.38;
const POST_HEIGHT    = 2.55;
const POST_Y         = 0.48;
const HUB_Y          = 1.22;
const ARM_Y          = 1.82;
const ARM_Z          = 0.09;
const ANTENNA_Y      = 1.88;
const ANTENNA_Z      = 0.31;
// At scale 1.75, box is ~1.61 units wide. With fov=44°, half-height at D is
// D * tan(22°) ≈ D * 0.404. Need D * 0.404 > box_half_diagonal (≈1.14) plus
// margin → D ≥ 4.0 keeps all corners fully in frame.
const FOCUS_DIST     = 4.0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rigTo3D({ col, layer, row }: RigPosition): THREE.Vector3 {
  return new THREE.Vector3(
    (0.5   - col) * STEP,
    (layer - 0.5) * STEP,
    (0.5   - row) * STEP,
  );
}

function rigTo3DArr(pos: RigPosition): [number, number, number] {
  const v = rigTo3D(pos);
  return [v.x, v.y, v.z];
}

// Precise red scale per spec, green entry at 85%.
type ColorStop = [number, string];
const COLOR_STOPS: ColorStop[] = [
  [0,   '#7f1d1d'], // maroon / blood red — flat at exactly 0%
  [1,   '#ef4444'], // vivid red — instant snap at 1%
  [50,  '#ef4444'], // vivid red stays flat through 50%
  [65,  '#f87171'], // medium red
  [79,  '#fca5a5'], // light red — approaching threshold
  [80,  '#bbf7d0'], // light green — green entry at 80%
  [93,  '#22c55e'], // vivid green
  [100, '#16a34a'], // rich green
];

function boxHex(result: BoxResult | undefined): string {
  if (!result || result.readCount + result.missCount === 0) return '#dde4ec';
  const pct = result.coveragePct;
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [lo, cLo] = COLOR_STOPS[i]!;
    const [hi, cHi] = COLOR_STOPS[i + 1]!;
    if (pct >= lo && pct <= hi) {
      const t = (pct - lo) / (hi - lo);
      return `#${new THREE.Color(cLo).lerp(new THREE.Color(cHi), t).getHexString()}`;
    }
  }
  return '#16a34a';
}

// ─── Face-corner tag label positions ────────────────────────────────────────
// Positions are in LOCAL mesh space (before scale). EPS pushes labels just
// proud of the face so occlude raycasts don't self-intersect the box.

const H   = BOX_SIZE / 2;
const C   = H * 0.72;   // corner inset — places labels at ~72% from centre
const EPS = 0.025;      // surface offset

type FaceCorners = Record<string, [number, number, number]>;
const FACE_CORNERS: Record<string, FaceCorners> = {
  Front:  { TL: [-C,  C, H+EPS], TR: [ C,  C, H+EPS], BL: [-C, -C, H+EPS], BR: [ C, -C, H+EPS] },
  Back:   { TL: [ C,  C,-(H+EPS)], TR: [-C,  C,-(H+EPS)], BL: [ C, -C,-(H+EPS)], BR: [-C, -C,-(H+EPS)] },
  Right:  { TL: [H+EPS,  C,  C], TR: [H+EPS,  C, -C], BL: [H+EPS, -C,  C], BR: [H+EPS, -C, -C] },
  Left:   { TL:[-(H+EPS), C, -C], TR:[-(H+EPS), C,  C], BL:[-(H+EPS),-C, -C], BR:[-(H+EPS),-C,  C] },
  Top:    { TL: [-C, H+EPS, -C], TR: [ C, H+EPS, -C], BL: [-C, H+EPS,  C], BR: [ C, H+EPS,  C] },
  Bottom: { TL: [-C,-(H+EPS), C], TR: [ C,-(H+EPS), C], BL: [-C,-(H+EPS),-C], BR: [ C,-(H+EPS),-C] },
};

const FACE_LABEL_POSITIONS: Record<string, [number, number, number]> = {
  Front: [0, 0, H + EPS],
  Back: [0, 0, -(H + EPS)],
  Right: [H + EPS, 0, 0],
  Left: [-(H + EPS), 0, 0],
  Top: [0, H + EPS, 0],
  Bottom: [0, -(H + EPS), 0],
};

const FACE_SHORT_LABEL: Record<string, string> = {
  Front: 'F',
  Back: 'B',
  Left: 'L',
  Right: 'R',
  Top: 'U',
  Bottom: 'D',
};

// ─── Camera sync state (shared between two canvas instances in compare mode) ──

export interface SyncCameraState {
  camPosX: number; camPosY: number; camPosZ: number;
  targetX: number; targetY: number; targetZ: number;
}

/** Shared neutral colour for dimmed (non-selected) boxes. Never mutated. */
const DIMMED_CLR = new THREE.Color('#c8cdd4');



// ─── Single box mesh ──────────────────────────────────────────────────────────

interface BoxMeshProps {
  boxNumber: number;
  position: [number, number, number];
  result: BoxResult | undefined;
  highlightedTagKey: string | null;
  isSelected: boolean;
  anySelected: boolean;
  hasData: boolean;
  phaseOffset: number;
  suppressHtmlLabels: boolean;
  rssiSuffixMap: Map<string, number>;
  onSelect: (n: number) => void;
}

function BoxMesh({ boxNumber, position, result, highlightedTagKey, isSelected, anySelected, hasData, phaseOffset, suppressHtmlLabels, rssiSuffixMap, onSelect }: BoxMeshProps) {
  const meshRef     = useRef<THREE.Mesh>(null);
  const matRef      = useRef<THREE.MeshStandardMaterial>(null);
  const labelRef    = useRef<HTMLDivElement>(null);
  // Pre-alloc scratch vectors — zero heap allocation inside useFrame
  const _wp         = useRef(new THREE.Vector3());
  const _rigCenter  = useRef(new THREE.Vector3());
  const colorHex    = useMemo(() => boxHex(result), [result]);
  // Track coverage colour so useFrame can lerp back to it on deselect
  const coverageClr = useRef(new THREE.Color(colorHex));
  const prevHex     = useRef(colorHex);

  useFrame(({ camera, clock }, dt) => {
    if (!meshRef.current || !matRef.current) return;
    const smooth = 1 - Math.pow(0.001, dt);

    // ── Sync coverage colour if result changed (rare) ─────────────────────────
    if (prevHex.current !== colorHex) {
      coverageClr.current.set(colorHex);
      prevHex.current = colorHex;
    }

    // ── Colour: dimmed boxes go neutral grey, others keep coverage colour ──────
    const wantColor = anySelected && !isSelected ? DIMMED_CLR : coverageClr.current;
    matRef.current.color.lerp(wantColor, smooth);

    // ── Scale ────────────────────────────────────────────────────────────────
    const targetScale = isSelected ? 1.75 : 1.0;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, smooth),
    );

    // ── Material opacity (selection dimming) ─────────────────────────────────
    const selectionTarget = anySelected && !isSelected ? 0.18 : 1.0;
    const newOpacity      = THREE.MathUtils.lerp(matRef.current.opacity, selectionTarget, smooth);
    const wantTransparent = newOpacity < 0.99;
    // needsUpdate is required when toggling transparent — forces shader recompile
    if (matRef.current.transparent !== wantTransparent) {
      matRef.current.transparent = wantTransparent;
      matRef.current.needsUpdate = true;
    }
    matRef.current.opacity = newOpacity;

    // ── Label opacity: selection dim × depth fade ─────────────────────────────
    if (labelRef.current) {
      meshRef.current.getWorldPosition(_wp.current);
      _wp.current.applyMatrix4(camera.matrixWorldInverse);
      _rigCenter.current.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse);
      const isBack     = _wp.current.z < _rigCenter.current.z;
      const depthAlpha = isBack ? 0.22 : 1.0;
      const labelOpacity = Math.min(newOpacity, depthAlpha);
      // Guard: only touch the DOM when the value has meaningfully changed
      const prev = parseFloat(labelRef.current.style.opacity || '1');
      if (Math.abs(labelOpacity - prev) > 0.01) {
        labelRef.current.style.opacity = String(labelOpacity.toFixed(3));
      }
    }

    // ── Emissive: idle pulse only — no colour change on selection ─────────────
    if (!hasData) {
      const pulse = Math.max(0, Math.sin(clock.elapsedTime * 1.4 + phaseOffset));
      matRef.current.emissive.set('#0071dc');
      matRef.current.emissiveIntensity = pulse * 0.5;
    } else {
      matRef.current.emissiveIntensity = 0;
    }
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      // When another box is already selected, require a deselect first.
      // User must double-click to exit before selecting a different box.
      if (anySelected && !isSelected) return;
      onSelect(boxNumber);
    },
    [anySelected, isSelected, boxNumber, onSelect],
  );

  return (
    <mesh ref={meshRef} position={position} onClick={handleClick}>
      <boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]} />
      <meshStandardMaterial ref={matRef} color={colorHex} roughness={1} metalness={0} />
      {!anySelected && !suppressHtmlLabels && (
        <Html center position={[0, 0, 0]} distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div
            ref={labelRef}
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
              background: 'rgba(10,20,40,0.42)',
              color: '#ffffff',
              borderRadius: 999,
              padding: '2px 7px',
              backdropFilter: 'blur(4px)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              transition: 'opacity 0.3s ease',
            }}
          >
            {boxNumber}
          </div>
        </Html>
      )}

      {/* Face labels — only while inspecting a selected box */}
      {isSelected && !suppressHtmlLabels && result?.faces.map((faceResult) => {
        const pos = FACE_LABEL_POSITIONS[faceResult.face];
        if (!pos) return null;
        return (
          <Html
            key={`face-${faceResult.face}`}
            center
            position={pos}
            distanceFactor={5.5}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            occlude={[meshRef] as any}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.08em',
                background: 'rgba(10,20,40,0.72)',
                color: '#ffffff',
                borderRadius: 999,
                padding: '2px 6px',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              }}
            >
              {FACE_SHORT_LABEL[faceResult.face]}
            </div>
          </Html>
        );
      })}

      {/* Tag labels at each face corner — only on the selected box */}
      {isSelected && !suppressHtmlLabels && result?.faces.flatMap((faceResult) =>
        faceResult.slots.map((slot) => {
          const pos = FACE_CORNERS[slot.face]?.[slot.position];
          if (!pos) return null;
          const text = (slot.fullEpc ?? slot.label).slice(-7).toUpperCase();
          const slotKey = `${boxNumber}-${slot.face}-${slot.position}`;
          const isHighlighted = highlightedTagKey === slotKey;

          // Tag colour: read = RSSI gradient (static green fallback when no RSSI data),
          // missed / unresolved = always gray. Gray means nothing. Colour means read.
          const lookupKey = (slot.fullEpc ?? slot.label).slice(-7).toUpperCase();
          const rssiDbm   = slot.state === 'read' ? (rssiSuffixMap.get(lookupKey) ?? null) : null;
          let tagBg: string;
          if (isHighlighted)              { tagBg = 'rgba(0,113,220,0.96)'; }
          else if (slot.state !== 'read') { tagBg = RSSI_MISSED_COLOR; }
          else if (rssiDbm !== null)      { tagBg = rssiToHex(rssiDbm); }
          else                            { tagBg = 'rgba(20,83,45,0.88)'; } // green fallback (no RSSI data)

          return (
            <Html
              key={`${slot.face}-${slot.position}`}
              center
              position={pos as [number, number, number]}
              distanceFactor={5}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              occlude={[meshRef] as any}
              style={{ pointerEvents: 'none' }}
            >
              {/* Wrapper: pointer-events:auto on the chip while the Html portal stays none,
                  so OrbitControls still works when dragging through a label area. */}
              <div className="group relative" style={{ display: 'inline-block', pointerEvents: 'auto' }}>
                <div
                  className={isHighlighted ? 'animate-pulse' : undefined}
                  style={{
                    fontSize: 7,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    background: tagBg,
                    color: '#ffffff',
                    padding: '1px 3px',
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    boxShadow: isHighlighted
                      ? '0 0 0 1px rgba(191,219,254,0.95), 0 0 12px rgba(0,113,220,0.75), 0 0 24px rgba(0,113,220,0.45)'
                      : undefined,
                  }}
                >
                  {text}
                </div>

                {/* RSSI tooltip — only renders when signal data is available */}
                {rssiDbm !== null && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/90 px-1.5 py-0.5 text-[8px] font-bold text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100">
                    {rssiToPct(rssiDbm)}% signal
                  </div>
                )}
              </div>
            </Html>
          );
        })
      )}
    </mesh>
  );
}

// ─── Orientation helpers / rig guide ─────────────────────────────────────────

function CompassMarker({ position, label }: { position: [number, number, number]; label: 'N' | 'S' | 'E' | 'W' }) {
  return (
    <Html position={position} center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.16em',
          color: label === 'N' ? '#0f172a' : '#64748b',
          background: 'rgba(255,255,255,0.82)',
          border: '1px solid rgba(148,163,184,0.25)',
          borderRadius: 999,
          padding: '1px 5px',
          userSelect: 'none',
          boxShadow: '0 1px 8px rgba(15,23,42,0.08)',
        }}
      >
        {label}
      </div>
    </Html>
  );
}

function CompassRose() {
  return (
    <>
      <CompassMarker position={[0, COMPASS_Y,  COMPASS_RADIUS]} label="N" />
      <CompassMarker position={[0, COMPASS_Y, -COMPASS_RADIUS]} label="S" />
      <CompassMarker position={[ COMPASS_RADIUS, COMPASS_Y, 0]} label="E" />
      <CompassMarker position={[-COMPASS_RADIUS, COMPASS_Y, 0]} label="W" />
    </>
  );
}

function PulseWave({ delay }: { delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const startRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;
    if (startRef.current === null) startRef.current = clock.elapsedTime;

    const t = clock.elapsedTime - startRef.current - delay;
    if (t < 0 || t > 0.9) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;
    const progress = t / 0.9;
    const scale = 1 + progress * 3.4;
    meshRef.current.position.z = 0.04 + progress * 1.15;
    meshRef.current.scale.set(scale, scale, 1);
    matRef.current.opacity = 0.22 * (1 - progress);
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[0.62, 0.46]} />
      <meshBasicMaterial
        ref={matRef}
        color="#38bdf8"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function PulseBurst() {
  return (
    <>
      <PulseWave delay={0} />
      <PulseWave delay={0.12} />
      <PulseWave delay={0.24} />
    </>
  );
}

function AntennaGuide({ angleDeg, pulseToken }: { angleDeg: 0 | 45; pulseToken: number }) {
  const antennaY = angleDeg === 0 ? ARM_Y : ANTENNA_Y;
  const antennaZ = angleDeg === 0 ? ARM_Z + 0.33 : ANTENNA_Z;
  const antennaRotationX = -THREE.MathUtils.degToRad(angleDeg);

  return (
    <group position={[0, 0, 0]}>
      {/* PVC center pole */}
      <mesh position={[0, POST_Y, 0]}>
        <cylinderGeometry args={[0.028, 0.028, POST_HEIGHT, 14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={1} metalness={0} transparent opacity={0.7} />
      </mesh>

      {/* Hub / printed clamp on the pole */}
      <mesh position={[0, HUB_Y, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.11, 12]} />
        <meshStandardMaterial color="#94a3b8" roughness={1} metalness={0} transparent opacity={0.5} />
      </mesh>

      {/* Mount arm protruding North from the center pole */}
      <mesh position={[0, ARM_Y, ARM_Z]}>
        <boxGeometry args={[0.09, 0.05, 0.2]} />
        <meshStandardMaterial color="#64748b" roughness={1} metalness={0} transparent opacity={0.55} />
      </mesh>

      {/* Antenna plate + pulse waves share the same physical orientation */}
      <group position={[0, antennaY, antennaZ]} rotation={[antennaRotationX, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.62, 0.028, 0.46]} />
          <meshStandardMaterial color="#0f172a" roughness={0.95} metalness={0} transparent opacity={0.26} />
        </mesh>
        {pulseToken > 0 && <PulseBurst key={pulseToken} />}
      </group>
    </group>
  );
}

// ─── Scene (owns camera animation) ───────────────────────────────────────────

interface SceneProps {
  boxResults: BoxResult[];
  selectedBox: number | null;
  highlightedTagKey: string | null;
  hasData: boolean;
  suppressHtmlLabels: boolean;
  showAntennaGuide: boolean;
  showCompassGuide: boolean;
  antennaGuideAngleDeg: 0 | 45;
  antennaPulseToken: number;
  rssiSuffixMap: Map<string, number>;
  isSyncActive: boolean;
  syncSide: 'A' | 'B';
  syncStateRef: React.MutableRefObject<SyncCameraState | null> | undefined;
  lastActiveSideRef: React.MutableRefObject<'A' | 'B' | null> | undefined;
  onBoxSelect: (n: number) => void;
}

function Scene({ boxResults, selectedBox, highlightedTagKey, hasData, suppressHtmlLabels, showAntennaGuide, showCompassGuide, antennaGuideAngleDeg, antennaPulseToken, rssiSuffixMap, isSyncActive, syncSide, syncStateRef, lastActiveSideRef, onBoxSelect }: SceneProps) {
  const resultMap  = useMemo(
    () => Object.fromEntries(boxResults.map((b) => [b.boxNumber, b])),
    [boxResults],
  );
  const anySelected = selectedBox !== null;

  // ── Camera animation state ────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef     = useRef<any>(null);
  const animStartRef    = useRef<number | null>(null);  // null = idle
  const destTargetRef   = useRef(DEFAULT_TARGET.clone());
  const destCamPosRef   = useRef(DEFAULT_CAM.clone());
  // Pre-alloc scratch vectors — never allocate inside useFrame
  const _dir            = useRef(new THREE.Vector3());
  const _curr           = useRef(new THREE.Vector3());
  const _syncCamPos     = useRef(new THREE.Vector3());
  const _syncTarget     = useRef(new THREE.Vector3());

  // Trigger animation whenever selection changes
  useEffect(() => {
    if (!controlsRef.current) return;

    animStartRef.current = performance.now() / 1000;

    if (selectedBox !== null) {
      const pos = RIG_LAYOUT[selectedBox];
      if (pos) {
        // Destination orbit target = box world position
        destTargetRef.current.copy(rigTo3D(pos));

        // Camera direction: from current orbit target → current camera
        // (preserve viewing angle, just move the focal point + zoom in)
        _dir.current
          .copy(controlsRef.current.object.position)
          .sub(controlsRef.current.target)
          .normalize();
        destCamPosRef.current
          .copy(destTargetRef.current)
          .addScaledVector(_dir.current, FOCUS_DIST);
      }
    } else {
      // Deselect — re-centre orbit target but KEEP camera exactly where it is.
      // The user chose this angle; don't yank the view back to the start.
      destTargetRef.current.copy(DEFAULT_TARGET);
      destCamPosRef.current.copy(controlsRef.current.object.position);
    }
  }, [selectedBox]);

  useFrame(({ clock }, dt) => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    const tgt = controlsRef.current.target;
    const tSmooth = 1 - Math.pow(0.001, dt);

    // ── Is this canvas the sync follower right now? ───────────────────────────
    const isFollower =
      isSyncActive &&
      syncStateRef != null &&
      lastActiveSideRef != null &&
      lastActiveSideRef.current !== null &&
      lastActiveSideRef.current !== syncSide &&
      syncStateRef.current !== null;

    if (isFollower) {
      // ── Follower: smooth-lerp toward leader's live camera state ────────────
      // dt*25 ≈ 0.42 lerp at 60fps — reaches 93% within 5 frames, no jitter.
      // This feeds into controls.update() so damping stays in the same pipeline.
      const s = syncStateRef!.current!;
      const syncLerp = Math.min(dt * 25, 0.9);
      _syncCamPos.current.set(s.camPosX, s.camPosY, s.camPosZ);
      _syncTarget.current.set(s.targetX, s.targetY, s.targetZ);
      cam.position.lerp(_syncCamPos.current, syncLerp);
      tgt.lerp(_syncTarget.current, syncLerp);
      controlsRef.current.update();
    } else {
      // ── Leader / normal mode: standard animation pipeline ─────────────────
      tgt.lerp(destTargetRef.current, tSmooth);

      if (animStartRef.current !== null) {
        const elapsed = clock.elapsedTime - animStartRef.current / 1000;
        _curr.current.copy(cam.position);
        const dist = _curr.current.distanceTo(destCamPosRef.current);
        if (dist > 0.005) {
          cam.position.lerp(destCamPosRef.current, tSmooth * 1.5);
        } else {
          animStartRef.current = null;
        }
        void elapsed;
      }

      controlsRef.current.update();

      // Write sync state so the follower can read it next frame
      if (isSyncActive && syncStateRef && lastActiveSideRef?.current === syncSide) {
        syncStateRef.current = {
          camPosX: cam.position.x, camPosY: cam.position.y, camPosZ: cam.position.z,
          targetX: tgt.x, targetY: tgt.y, targetZ: tgt.z,
        };
      }
    }
  });

  return (
    <>
      {/* High ambient keeps colours true to coverage value from any angle.
          Single soft directional just enough to read cube edges — no shadows. */}
      <ambientLight intensity={0.95} />
      <directionalLight position={[3, 5, 4]} intensity={0.18} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1.2}
        maxDistance={9}
        enableDamping
        dampingFactor={0.07}
        autoRotate={!hasData}
        autoRotateSpeed={1.4}
        onStart={() => {
          animStartRef.current = null;
          if (isSyncActive && lastActiveSideRef) lastActiveSideRef.current = syncSide;
        }}
      />

      {!suppressHtmlLabels && showCompassGuide && <CompassRose />}
      {showAntennaGuide && <AntennaGuide angleDeg={antennaGuideAngleDeg} pulseToken={antennaPulseToken} />}

      {(Object.entries(RIG_LAYOUT) as [string, RigPosition][]).map(([key, pos]) => {
        const num         = Number(key);
        const phaseOffset = (pos.col + pos.row + pos.layer) * (Math.PI / 2);
        return (
          <BoxMesh
            key={num}
            boxNumber={num}
            position={rigTo3DArr(pos)}
            result={resultMap[num]}
            highlightedTagKey={highlightedTagKey}
            isSelected={selectedBox === num}
            anySelected={anySelected}
            hasData={hasData}
            phaseOffset={phaseOffset}
            suppressHtmlLabels={suppressHtmlLabels}
            rssiSuffixMap={rssiSuffixMap}
            onSelect={onBoxSelect}
          />
        );
      })}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface Rig3DCanvasProps {
  boxResults: BoxResult[];
  selectedBox: number | null;
  highlightedTagKey: string | null;
  hasData: boolean;
  suppressHtmlLabels: boolean;
  showAntennaGuide?: boolean;
  showCompassGuide?: boolean;
  antennaGuideAngleDeg?: 0 | 45;
  onAntennaGuideAngleChange?: (angle: 0 | 45) => void;
  rssiSuffixMap: Map<string, number>;
  canvasHeight?: number;
  isSyncActive?: boolean;
  syncSide?: 'A' | 'B';
  syncStateRef?: React.MutableRefObject<SyncCameraState | null>;
  lastActiveSideRef?: React.MutableRefObject<'A' | 'B' | null>;
  onBoxSelect: (n: number) => void;
  onDeselect: () => void;
}

export function Rig3DCanvas({ boxResults, selectedBox, highlightedTagKey, hasData, suppressHtmlLabels, showAntennaGuide = false, showCompassGuide = false, antennaGuideAngleDeg = 45, onAntennaGuideAngleChange, rssiSuffixMap, canvasHeight = 560, isSyncActive = false, syncSide = 'A', syncStateRef, lastActiveSideRef, onBoxSelect, onDeselect }: Rig3DCanvasProps) {
  const [antennaPulseToken, setAntennaPulseToken] = useState(0);

  return (
    // onDoubleClick bubbles from the <canvas> DOM element — fires for any
    // double-click within the 3D viewport, background or box, no R3F magic needed.
    <div className="relative flex flex-col" onDoubleClick={onDeselect}>
      {showAntennaGuide && onAntennaGuideAngleChange && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
          <div className="pointer-events-auto inline-flex rounded-full border border-slate-200 bg-white/92 p-1 shadow-sm backdrop-blur">
            {([0, 45] as const).map((angle) => (
              <button
                key={angle}
                type="button"
                aria-pressed={antennaGuideAngleDeg === angle}
                className={`rounded-full px-3 py-1 text-[0.62rem] font-black tracking-[0.12em] transition ${
                  antennaGuideAngleDeg === angle
                    ? 'bg-retail-blue text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                onClick={() => onAntennaGuideAngleChange(angle)}
              >
                {angle}°
              </button>
            ))}
          </div>

          <button
            type="button"
            className="pointer-events-auto rounded-full border border-sky-200 bg-white/92 px-3 py-1.5 text-[0.62rem] font-black tracking-[0.12em] text-sky-700 shadow-sm backdrop-blur transition hover:bg-sky-50"
            onClick={() => setAntennaPulseToken((v) => v + 1)}
          >
            Pulse Antenna
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: [-2.4, 2.2, 3.4], fov: 44 }}
        style={{ width: '100%', height: canvasHeight, borderRadius: 16, background: '#ffffff', display: 'block' }}
      >
        <color attach="background" args={['#ffffff']} />
        <Scene
          boxResults={boxResults}
          selectedBox={selectedBox}
          highlightedTagKey={highlightedTagKey}
          hasData={hasData}
          suppressHtmlLabels={suppressHtmlLabels}
          showAntennaGuide={showAntennaGuide}
          showCompassGuide={showCompassGuide}
          antennaGuideAngleDeg={antennaGuideAngleDeg}
          antennaPulseToken={antennaPulseToken}
          rssiSuffixMap={rssiSuffixMap}
          isSyncActive={isSyncActive}
          syncSide={syncSide}
          syncStateRef={syncStateRef}
          lastActiveSideRef={lastActiveSideRef}
          onBoxSelect={onBoxSelect}
        />
      </Canvas>
      {hasData && (
        <p className="mt-2 text-right text-[0.58rem] font-semibold text-slate-400">
          {selectedBox !== null
            ? 'Double-click anywhere to deselect'
            : 'Drag to rotate · Click a box to inspect'}
        </p>
      )}
    </div>
  );
}
