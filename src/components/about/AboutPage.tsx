const talkingPoints = [
  [
    'Map-first reset',
    'The prototype is being rebuilt around a clean top-view store map before adding simulation layers back in.',
  ],
  [
    'Retail-native visual style',
    'The theme now starts from a familiar retail palette: strong blue, yellow accent, white surfaces, and restrained shapes.',
  ],
  [
    'Simple before smart',
    'Dashboard scope is intentionally stripped down so the map layout can be designed correctly instead of buried under widgets.',
  ],
  [
    'Future workflow layer',
    'Once the map foundation works, RFID reads, storage movement, and replenishment states can be layered on deliberately.',
  ],
];

export function AboutPage() {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <article className="panel p-6">
        <p className="eyebrow">Product story</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-retail-ink">
          ShelfLoop starts with a clear store map, then layers RFID workflow on top.
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The current reset removes the noisy first-draft dashboard and returns the product to its
          core visual foundation: a map of the sales floor, storage area, and replenishment path.
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The goal is to make the interface feel like a retail operations tool first, not a generic
          analytics dashboard with RFID words sprinkled on top. Tiny miracle: fewer boxes.
        </p>
      </article>

      <article className="panel p-6">
        <p className="eyebrow">Current direction</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {talkingPoints.map(([title, body]) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-retail-blue-light/45 p-4">
              <h3 className="font-black text-retail-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
