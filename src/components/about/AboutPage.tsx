const capabilityCards = [
  [
    'Rack-level visibility',
    'Show what is present on a specific apparel fixture instead of treating the whole sales floor as one inventory bucket.',
  ],
  [
    'RFID-informed replenishment',
    'Use reader confidence and item presence to guide when a rack needs attention, not just when a shelf looks empty.',
  ],
  [
    'Associate-ready workflow',
    'Turn a detected gap into a simple action: inspect the rack, pull inventory, replenish, and confirm the fixture is back in stock.',
  ],
  [
    'Fixture-aware design',
    'Compare how different rack formats behave, from hanging apparel racks to dense folded displays with harder reads.',
  ],
];

export function AboutPage() {
  return (
    <section className="space-y-5">
      <article className="panel p-6">
        <p className="eyebrow">About ShelfLoop</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-retail-ink">
              Rack-level RFID visibility for apparel replenishment.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              ShelfLoop is a retail operations concept for making apparel fixtures easier to read,
              understand, and replenish. The prototype focuses on a zoomed-in store map where each
              rack can show merchandise presence, read confidence, and simple replenishment actions.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              The goal is not another generic analytics dashboard. It is a fixture-first workflow:
              see the rack, understand what the RFID reader is detecting, and act before the display
              turns into an out-of-stock problem.
            </p>
          </div>

          <div className="border-l-4 border-spark bg-retail-blue-light/50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-retail-blue">
              Working product idea
            </p>
            <p className="mt-3 text-lg font-black leading-7 text-retail-ink">
              Give store teams a clean view of what each rack believes is present, what changed, and
              where replenishment should happen next.
            </p>
          </div>
        </div>
      </article>

      <article className="panel p-6">
        <p className="eyebrow">What the prototype is proving</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {capabilityCards.map(([title, body]) => (
            <div key={title} className="border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-black text-retail-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
