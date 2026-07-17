// ─── Rig 3D Canvas ────────────────────────────────────────────────────────────
// Interactive WebGL visualisation of the 8-box 2×2×2 RFID test rig.
//
// Selection UX
//   • Click a box  : zooms camera in, pivots orbit to that box, scales it 1.75×,
//                    others go translucent.
//   • Click again  : deselects — camera animates back to origin, full opacity.
//
// Idle (no data)   : slow auto-rotate + retail-blue emissive pulse.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import type { BoxResult, RigPosition } from './rfidTypes';
import { RIG_LAYOUT } from './rfidTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOX_SIZE       = 0.92;
const STEP           = 1.08;
const DEFAULT_CAM    = new THREE.Vector3(2.4, 2.2, 3.4);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);
// At scale 1.75, box is ~1.61 units wide. With fov=44°, half-height at D is
// D * tan(22°) ≈ D * 0.404. Need D * 0.404 > box_half_diagonal (≈1.14) plus
// margin → D ≥ 4.0 keeps all corners fully in frame.
const FOCUS_DIST     = 4.0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rigTo3D({ col, layer, row }: RigPosition): THREE.Vector3 {
  return new THREE.Vector3(
    (col   - 0.5) * STEP,
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
  [70,  '#f87171'], // medium red
  [84,  '#fca5a5'], // light red — red-300, still clearly red not pink
  [85,  '#bbf7d0'], // light green — green entry
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

// ─── Single box mesh ──────────────────────────────────────────────────────────

interface BoxMeshProps {
  boxNumber:   number;
  position:    [number, number, number];
  result:      BoxResult | undefined;
  isSelected:  boolean;
  anySelected: boolean;
  hasData:     boolean;
  phaseOffset: number;
  onSelect:    (n: number) => void;
}

function BoxMesh({ boxNumber, position, result, isSelected, anySelected, hasData, phaseOffset, onSelect }: BoxMeshProps) {
  const meshRef    = useRef<THREE.Mesh>(null);
  const matRef     = useRef<THREE.MeshStandardMaterial>(null);
  const labelRef   = useRef<HTMLDivElement>(null);
  // Pre-alloc scratch vectors — zero heap allocation inside useFrame
  const _wp        = useRef(new THREE.Vector3());
  const _rigCenter = useRef(new THREE.Vector3());
  const color      = useMemo(() => boxHex(result), [result]);

  useFrame(({ camera, clock }, dt) => {
    if (!meshRef.current || !matRef.current) return;
    const smooth = 1 - Math.pow(0.001, dt);

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
      <meshStandardMaterial ref={matRef} color={color} roughness={0.55} metalness={0.05} />
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
    </mesh>
  );
}

// ─── Scene (owns camera animation) ───────────────────────────────────────────

interface SceneProps {
  boxResults:  BoxResult[];
  selectedBox: number | null;
  hasData:     boolean;
  onBoxSelect: (n: number) => void;
}

function Scene({ boxResults, selectedBox, hasData, onBoxSelect }: SceneProps) {
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
    const now = clock.elapsedTime;

    // Always lerp the orbit target (pan-disabled so no user interference)
    const tSmooth = 1 - Math.pow(0.001, dt);
    controlsRef.current.target.lerp(destTargetRef.current, tSmooth);

    // Camera lerp — only during animation window
    if (animStartRef.current !== null) {
      const elapsed  = now - animStartRef.current / 1000;
      // Remap: animStartRef stores a performance.now()-based timestamp, use elapsed since React effect
      // Simpler: just lerp camera aggressively and stop when close enough
      _curr.current.copy(controlsRef.current.object.position);
      const dist = _curr.current.distanceTo(destCamPosRef.current);
      if (dist > 0.005) {
        controlsRef.current.object.position.lerp(destCamPosRef.current, tSmooth * 1.5);
      } else {
        animStartRef.current = null; // done
      }
      void elapsed; // suppress unused warning
    }

    controlsRef.current.update();
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <directionalLight position={[-3, -1, -2]} intensity={0.15} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1.2}
        maxDistance={9}
        enableDamping
        dampingFactor={0.07}
        autoRotate={!hasData}
        autoRotateSpeed={1.4}
        onStart={() => { animStartRef.current = null; }}
      />

      {(Object.entries(RIG_LAYOUT) as [string, RigPosition][]).map(([key, pos]) => {
        const num         = Number(key);
        const phaseOffset = (pos.col + pos.row + pos.layer) * (Math.PI / 2);
        return (
          <BoxMesh
            key={num}
            boxNumber={num}
            position={rigTo3DArr(pos)}
            result={resultMap[num]}
            isSelected={selectedBox === num}
            anySelected={anySelected}
            hasData={hasData}
            phaseOffset={phaseOffset}
            onSelect={onBoxSelect}
          />
        );
      })}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface Rig3DCanvasProps {
  boxResults:  BoxResult[];
  selectedBox: number | null;
  hasData:     boolean;
  onBoxSelect: (n: number) => void;
  onDeselect:  () => void;
}

export function Rig3DCanvas({ boxResults, selectedBox, hasData, onBoxSelect, onDeselect }: Rig3DCanvasProps) {
  return (
    // onDoubleClick bubbles from the <canvas> DOM element — fires for any
    // double-click within the 3D viewport, background or box, no R3F magic needed.
    <div className="flex flex-col" onDoubleClick={onDeselect}>
      <Canvas
        camera={{ position: [2.4, 2.2, 3.4], fov: 44 }}
        style={{ width: '100%', height: 380, borderRadius: 16, background: '#ffffff', display: 'block' }}
      >
        <color attach="background" args={['#ffffff']} />
        <Scene
          boxResults={boxResults}
          selectedBox={selectedBox}
          hasData={hasData}
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
