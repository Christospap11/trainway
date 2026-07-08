/**
 * Ambient aurora — a fixed layer of slow-drifting colored light behind the
 * whole site. This is what gives the "light floating on dark depth" feel and
 * lets sections melt together with no boxes.
 */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="ambient-layer pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* base vignette so edges stay deep */}
      <div className="absolute inset-0 bg-background" />

      {/* drifting blobs — richer, more saturated glow */}
      <div className="aurora-a absolute -top-40 left-[5%] h-[60vh] w-[60vh] rounded-full bg-brand-violet/50 blur-[110px]" />
      <div className="aurora-b absolute top-[8%] right-[-2%] h-[55vh] w-[55vh] rounded-full bg-brand-fuchsia/40 blur-[115px]" />
      <div className="aurora-c absolute top-[42%] left-[-8%] h-[50vh] w-[50vh] rounded-full bg-brand-indigo/45 blur-[110px]" />
      <div className="aurora-b absolute top-[35%] right-[5%] h-[45vh] w-[45vh] rounded-full bg-brand-cyan/28 blur-[120px]" />
      <div className="aurora-a absolute bottom-[2%] left-[25%] h-[50vh] w-[50vh] rounded-full bg-brand-violet/30 blur-[130px]" />

      {/* deepen the very bottom for contrast with the footer */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
