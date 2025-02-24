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
  Globe,
  Download,
  FileLock2,
  Network
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

  const { data: networkEvents } = useQuery({
    queryKey: ["/api/network-events"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const updateSignaturesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/update-signatures");
    },
    onSuccess: () => {
      toast({
        title: "İmzalar Güncellendi",
        description: "Virüs tanımları başarıyla güncellendi.",
      });
    },
  });

  const toggleProtectionMutation = useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) => {
      return apiRequest("POST", "/api/settings", { [type]: enabled });
    },
  });

  const scanMutation = useMutation({
    mutationFn: async ({ type, paths }: { type: "quick" | "full"; paths?: string[] }) => {
      const endpoint = type === "quick" ? "/api/quick-scan" : "/api/full-scan";
      return apiRequest("POST", endpoint, { paths });
    },
    onSuccess: () => {
      toast({
        title: "Tarama Tamamlandı",
        description: "Sistem taraması başarıyla tamamlandı.",
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
    if (!status?.realtimeProtection || !status?.webProtection) return "text-red-500";
    if (status?.systemHealth < 50) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 text-transparent bg-clip-text">
              KAZIMPAŞA ANTİ-VİRÜS
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => updateSignaturesMutation.mutate()}
            disabled={updateSignaturesMutation.isPending}
            className="border-primary/20 hover:bg-primary/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            İmzaları Güncelle
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className={getStatusColor()} />
                Sistem Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Gerçek Zamanlı Koruma</span>
                  <Switch
                    checked={status?.realtimeProtection}
                    onCheckedChange={(checked) => 
                      toggleProtectionMutation.mutate({ type: "realtimeProtection", enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Web Koruması</span>
                  <Switch
                    checked={status?.webProtection}
                    onCheckedChange={(checked) => 
                      toggleProtectionMutation.mutate({ type: "webProtection", enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>İndirme Taraması</span>
                  <Switch
                    checked={status?.downloadScanning}
                    onCheckedChange={(checked) => 
                      toggleProtectionMutation.mutate({ type: "downloadScanning", enabled: checked })}
                  />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Sistem Sağlığı</span>
                  <Progress value={status?.systemHealth} className="mt-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  İmza Versiyonu: {status?.signatureVersion}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock />
                Son Taramalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="text-sm text-muted-foreground">Hızlı Tarama: </span>
                  {status?.lastQuickScan
                    ? new Date(status.lastQuickScan).toLocaleDateString()
                    : "Hiç yapılmadı"}
                </p>
                <p>
                  <span className="text-sm text-muted-foreground">Tam Tarama: </span>
                  {status?.lastFullScan
                    ? new Date(status.lastFullScan).toLocaleDateString()
                    : "Hiç yapılmadı"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert />
                Tespit Edilen Tehditler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{status?.threatsDetected || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe />
                Web Koruması
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="text-sm text-muted-foreground">Engellenen URL'ler: </span>
                  {networkEvents?.filter(e => e.action === "blocked").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status?.webProtection ? "Aktif" : "Devre Dışı"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch />
                Hızlı Tarama
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
                Dosya Seç ve Tara
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive />
                Tam Sistem Taraması
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleFullScan}
                disabled={scanning}
                className="w-full mb-4"
              >
                Tam Tarama Başlat
              </Button>
            </CardContent>
          </Card>
        </div>

        {scanning && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {scanType === "quick" ? "Hızlı Tarama" : "Tam Sistem Taraması"} Devam Ediyor
                </h3>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  Sistem taranıyor... %{Math.round(progress)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {networkEvents?.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network />
                Ağ Aktivitesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkEvents.slice(0, 5).map((event: any) => (
                  <Alert
                    key={event.id}
                    variant={event.action === "blocked" ? "destructive" : "default"}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {event.processName} - {event.remoteAddress}:{event.remotePort} 
                      ({event.protocol}) - {event.action}
                      {event.reason && ` (${event.reason})`}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {history?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tehdit Geçmişi</CardTitle>
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
                        ` - Tehdit Seviyesi: ${result.metadata.threatLevel}`}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}