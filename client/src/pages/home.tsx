import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, ShieldAlert, FileSearch, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: status } = useQuery({
    queryKey: ["/api/status"],
  });

  const { data: history } = useQuery({
    queryKey: ["/api/scan-history"],
  });

  const scanMutation = useMutation({
    mutationFn: async (files: string[]) => {
      return apiRequest("POST", "/api/scan", { files });
    },
    onSuccess: () => {
      toast({
        title: "Scan Complete",
        description: "Your files have been scanned successfully.",
      });
      setScanning(false);
      setProgress(0);
    },
  });

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).map(f => f.name);
    if (files.length === 0) return;

    setScanning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
      }
      setProgress(progress);
    }, 500);

    await scanMutation.mutateAsync(files);
    clearInterval(interval);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Shield className="w-10 h-10 text-primary" />
        <h1 className="text-3xl font-bold">Security Center</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className={status?.protection ? "text-green-500" : "text-red-500"} />
              Protection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {status?.protection ? "Protected" : "At Risk"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock />
              Last Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {status?.lastScan ? new Date(status.lastScan).toLocaleDateString() : "Never"}
            </p>
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
            <p className="text-2xl font-semibold">{status?.threatsFound || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
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
            onChange={handleScan}
            multiple
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="w-full mb-4"
          >
            Select Files to Scan
          </Button>
          
          {scanning && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Scanning files... {Math.round(progress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {history?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((result: any) => (
                <Alert key={result.id} variant={result.status === "infected" ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.path} - {result.status}
                    {result.details && ` (${result.details})`}
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
