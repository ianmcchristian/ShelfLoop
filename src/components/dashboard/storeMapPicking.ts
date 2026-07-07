export function chooseRandomIndex(indexes: number[]): number | null {
  if (indexes.length === 0) {
    return null;
  }

  return indexes[Math.floor(Math.random() * indexes.length)] ?? null;
}

export function chooseRandomActiveIndex(positions: boolean[]): number | null {
  return chooseRandomIndex(positions.flatMap((isActive, index) => (isActive ? [index] : [])));
}

export function chooseDenseRackStackPickIndex(
  positions: boolean[],
  positionIndex: number,
): number | null {
  const stackStart = Math.floor(positionIndex / 3) * 3;
  const centerIndex = stackStart + 1;

  if (positions[centerIndex]) {
    return centerIndex;
  }

  return chooseRandomIndex([stackStart, stackStart + 2].filter((index) => positions[index]));
}

export function chooseRandomDenseRackIndex(positions: boolean[]): number | null {
  const activeStackStarts: number[] = [];

  for (let stackStart = 0; stackStart < positions.length; stackStart += 3) {
    if (positions[stackStart] || positions[stackStart + 1] || positions[stackStart + 2]) {
      activeStackStarts.push(stackStart);
    }
  }

  const stackStart = chooseRandomIndex(activeStackStarts);

  return stackStart === null ? null : chooseDenseRackStackPickIndex(positions, stackStart);
}
