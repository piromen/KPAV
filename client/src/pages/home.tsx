import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Shield,
  ShieldAlert,
  FileSearch,
  Clock,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Settings,
  FileLock2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<"quick" | "full" | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: status } = useQuery({
    queryKey: ["/api/status"],
  });

  const { data: history } = useQuery({
    queryKey: ["/api/scan-history"],
  });

  const updateSignaturesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/update-signatures");
    },
    onSuccess: () => {
      toast({
        title: "Signatures Updated",
        description: "Virus definitions have been updated successfully.",
      });
    },
  });

  const toggleProtectionMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("POST", "/api/settings", { realtimeProtection: enabled });
    },
  });

  const scanMutation = useMutation({
    mutationFn: async ({ type, paths }: { type: "quick" | "full"; paths?: string[] }) => {
      const endpoint = type === "quick" ? "/api/quick-scan" : "/api/full-scan";
      return apiRequest("POST", endpoint, { paths });
    },
    onSuccess: () => {
      toast({
        title: "Scan Complete",
        description: "System scan has been completed successfully.",
      });
      setScanning(false);
      setProgress(0);
      setScanType(null);
    },
  });

  const handleQuickScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).map(f => f.path);
    if (files.length === 0) return;

    setScanning(true);
    setScanType("quick");
    simulateProgress();
    await scanMutation.mutateAsync({ type: "quick", paths: files });
  };

  const handleFullScan = async () => {
    setScanning(true);
    setScanType("full");
    simulateProgress();
    await scanMutation.mutateAsync({ type: "full" });
  };

  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
      }
      setProgress(progress);
    }, 500);
  };

  const getStatusColor = () => {
    if (!status?.realtimeProtection) return "text-red-500";
    if (status?.systemHealth < 50) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold">Security Center</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => updateSignaturesMutation.mutate()}
          disabled={updateSignaturesMutation.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Update Signatures
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className={getStatusColor()} />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Realtime Protection</span>
                <Switch
                  checked={status?.realtimeProtection}
                  onCheckedChange={(checked) => toggleProtectionMutation.mutate(checked)}
                />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">System Health</span>
                <Progress value={status?.systemHealth} className="mt-2" />
              </div>
              <p className="text-sm text-muted-foreground">
                Signature Version: {status?.signatureVersion}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock />
              Last Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="text-sm text-muted-foreground">Quick Scan: </span>
                {status?.lastQuickScan
                  ? new Date(status.lastQuickScan).toLocaleDateString()
                  : "Never"}
              </p>
              <p>
                <span className="text-sm text-muted-foreground">Full Scan: </span>
                {status?.lastFullScan
                  ? new Date(status.lastFullScan).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert />
              Threats Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{status?.threatsDetected || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch />
              Quick Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleQuickScan}
              multiple
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="w-full mb-4"
            >
              <FileLock2 className="mr-2 h-4 w-4" />
              Select Files to Scan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive />
              Full System Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleFullScan}
              disabled={scanning}
              className="w-full mb-4"
            >
              Start Full Scan
            </Button>
          </CardContent>
        </Card>
      </div>

      {scanning && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold">
                {scanType === "quick" ? "Quick Scan" : "Full System Scan"} in Progress
              </h3>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Scanning system... {Math.round(progress)}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {history?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Threat History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((result: any) => (
                <Alert
                  key={result.id}
                  variant={result.status === "infected" ? "destructive" : "default"}
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.filePath} - {result.status}
                    {result.threatType && ` (${result.threatType})`}
                    {result.metadata?.threatLevel && 
                      ` - Threat Level: ${result.metadata.threatLevel}`}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}