import Image from "next/image";

export default function ForzaLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 blur-md rounded-2xl bg-emerald-500/30 opacity-60" />
      <div className="relative rounded-2xl bg-slate-950 border border-emerald-400/40 p-1">
        <Image
          src="/forza-logo.svg"
          alt="FORZA logo"
          width={size}
          height={size}
          className="rounded-xl"
        />
      </div>
    </div>
  );
}