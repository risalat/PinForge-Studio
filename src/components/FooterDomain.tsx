type FooterDomainProps = {
  domain: string;
};

export function FooterDomain({ domain }: FooterDomainProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-[#d7c3ad] bg-white/85 px-5 py-3 text-[24px] font-semibold uppercase tracking-[0.24em] text-[#6f4522] backdrop-blur-sm">
      {domain}
    </div>
  );
}
