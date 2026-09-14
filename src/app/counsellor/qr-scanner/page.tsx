import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { QrIcon } from "@/components/icons";
import { ScanCheckIn } from "@/features/checkin/ScanCheckIn";

export default async function CounsellorQRScannerPage() {
  await requirePageRole("COUNSELLOR");

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Scan a student's QR code or enter their check-in code to begin a session.">
        QR Scanner
      </PageTitle>

      <Card>
        <div className="flex items-center gap-2">
          <QrIcon className="h-5 w-5 text-brand-ink" />
          <h2 className="t-h2">Check-in Scanner</h2>
        </div>
        <p className="t-body mt-2">
          Scan the QR code displayed on the student&apos;s dashboard, or type their
          code manually. This works for both booked sessions and walk-ins.
        </p>
        <div className="mt-4">
          <ScanCheckIn />
        </div>
      </Card>
    </div>
  );
}
