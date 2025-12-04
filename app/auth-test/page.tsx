import AuthButtons from "@/components/AuthButtons";

export default function AuthTestPage() {
  return (
    <main className="px-4 pt-4 pb-4 space-y-4">
      <header>
        <h1 className="text-lg font-semibold">FORZA Auth · Test</h1>
        <p className="text-xs text-slate-400">
          This page is for testing Firebase Authentication (Google sign-in).
        </p>
      </header>

      <AuthButtons />
    </main>
  );
}