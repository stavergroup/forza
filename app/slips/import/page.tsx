import BetpawaBookingImport from "@/components/BetpawaBookingImport";

export const metadata = {
  title: "Import BetPawa Slip | FORZA",
};

export default function ImportSlipPage() {
  return (
    <main className="pt-2 pb-4">
      <BetpawaBookingImport />
    </main>
  );
}