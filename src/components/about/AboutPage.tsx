const designConsiderations = [
  [
    'Scanning on a schedule',
    'RFID readers use real power, so scanning constantly is not a realistic approach. Instead, scans happen on a set schedule that works within the power needs of the environment. When a scan runs, the system handles everything from there. Nothing depends on someone being nearby to notice a gap.',
  ],
  [
    'What is actually there',
    'Most inventory systems track what should be on a rack based on the last delivery or stock count. RFID reads what is physically on the rack right now. When those two do not match, that is usually where an out-of-stock is quietly hiding.',
  ],
  [
    'No one has to notice first',
    'With a manual process, someone has to spot an empty rack, remember to report it, and make sure the right person gets the message. When a scan finds a gap, a task is created and sent to a team member automatically. The process starts on its own.',
  ],
  [
    'Same team, more time for customers',
    'This does not replace anyone on the team. It removes the part of the job where associates walk the whole floor just to find out what needs attention. With clear tasks already waiting, they can spend more time helping customers.',
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
        <p className="eyebrow">Design considerations</p>
        <p className="mt-1 text-sm text-slate-500">
          Honest answers to the obvious questions.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {designConsiderations.map(([title, body]) => (
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
