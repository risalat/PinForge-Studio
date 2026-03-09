type TitlePanelProps = {
  title: string;
};

export function TitlePanel({ title }: TitlePanelProps) {
  return (
    <div className="flex h-full flex-col justify-center rounded-[42px] bg-[#f6efe4] px-16 py-[72px] text-[#1f1308] shadow-[0_28px_60px_rgba(75,43,9,0.14)]">
      <p className="mb-6 text-sm font-semibold uppercase tracking-[0.42em] text-[#8c5a29]">
        PinForge Studio
      </p>
      <h1 className="text-[76px] font-black uppercase leading-[0.94] tracking-[-0.05em]">
        {title}
      </h1>
    </div>
  );
}
