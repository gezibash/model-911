import { FingerprintStabilityTable } from "@/components/fingerprints/stability-table";

export default async function FingerprintsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Model Fingerprint Stability</h1>
        <p className="text-muted-foreground">
          Monitor model fingerprint changes to detect potential quantization or
          stability issues.
        </p>
      </div>

      <FingerprintStabilityTable />
    </div>
  );
}
