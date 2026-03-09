import Link from "next/link";

const links = [
  {
    href: "/library",
    label: "Content Library",
    description: "Browse all locked templates and open full previews from one place.",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Recent jobs, post count, generated pin count, and freshness-ready scaffolding.",
  },
  {
    href: "/preview/split-vertical-title",
    label: "Preview Template",
    description: "Live browser preview for the first locked Canva-style layout.",
  },
  {
    href: "/render/split-vertical-title",
    label: "Render Route",
    description: "Production render surface used by Playwright for PNG exports.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff4e3_0%,#f7f0e5_50%,#efe7da_100%)] px-6 py-10 text-[#24160a] sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#8a572a]">
              PinForge Studio
            </p>
            <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl">
              Pinterest pin generation scaffold for the existing PinForge extension.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#5f4530]">
              This project is ready for template work, Playwright exports, Prisma-backed job
              records, and Publer integration replacement.
            </p>
          </div>
          <div className="rounded-[36px] border border-white/70 bg-white/70 p-8 shadow-[0_28px_80px_rgba(58,39,14,0.12)] backdrop-blur-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#8a572a]">
              First milestone
            </p>
            <ul className="mt-6 space-y-4 text-lg leading-7 text-[#382414]">
              <li>React template system with a fixed 1000x1500 canvas</li>
              <li>Preview route and render route for side-by-side visual matching</li>
              <li>Playwright screenshot pipeline wired to local storage</li>
              <li>Prisma models for posts, jobs, templates, and generated pins</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[32px] bg-[#2c1c12] p-7 text-[#f7ede0] transition-transform duration-200 hover:-translate-y-1"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d9b78f]">
                Open
              </p>
              <h2 className="mt-3 text-2xl font-bold">{link.label}</h2>
              <p className="mt-3 text-base leading-7 text-[#e6d3bc]">{link.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
