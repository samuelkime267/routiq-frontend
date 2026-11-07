interface AuthIntroProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export default function AuthIntro({
  eyebrow,
  title,
  description,
}: AuthIntroProps) {
  return (
    <div className="mb-7">
      {eyebrow ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-pri/60">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[32px]">
        {title}
      </h1>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
        {description}
      </p>
    </div>
  );
}
