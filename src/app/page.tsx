import { FingerprintStabilityTable } from "@/components/fingerprints/stability-table";

export default async function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Model911</h1>
        <p className="text-muted-foreground">
          Monitor model fingerprint changes to detect potential quantization or
          stability issues.
        </p>
      </div>
      <FingerprintStabilityTable />
    </div>
  );
}
