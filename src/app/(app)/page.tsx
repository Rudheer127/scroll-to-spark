const SECTIONS = [
  {
    title: "What this app does",
    body: "Turns a moment of feeling helpless into one small, real thing you can do, and shows you what it changed.",
  },
  {
    title: "What exists today",
    body: "The app frame, the design tokens and the project rules. Discussions are the first feature to be built.",
  },
  {
    title: "What comes next",
    body: "Groups you can create, join, leave and delete, with threaded comments, images, emojis and GIFs.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="text-muted">
          Scroll to Spark is being built in the open. Here is where it stands.
        </p>
      </header>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map(({ title, body }) => (
          <article
            key={title}
            className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-6"
          >
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-muted">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
