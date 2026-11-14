type SettingsSectionProps = { title: string; description: string; children: React.ReactNode };

/** One block of the settings page: what it is on the left, the form on the right. */
export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="grid gap-6 rounded-(--radius-card) border border-border bg-surface p-6 shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}
