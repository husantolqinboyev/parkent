import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

type AuthStep = "start" | "code" | "profile";

const Auth = () => {
  const [step, setStep] = useState<AuthStep>("start");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: "",
    phone: "",
    location: "",
  });
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (user && profile?.display_name) {
      navigate("/");
    }
  }, [user, profile, navigate]);

  const handleTelegramRedirect = () => {
    window.open("https://t.me/marketfinora_bot?start=auth", "_blank");
    setStep("code");
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setLoading(true);
    try {
      // Use backend API instead of Supabase functions
      const data = await apiClient.verifyTelegramCode(code);

      // Set the session
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      if (data.is_new_user || !data.profile?.display_name) {
        setStep("profile");
        toast.success("Kod tasdiqlandi! Profilingizni to'ldiring.");
      } else {
        toast.success("Muvaffaqiyatli kirdingiz!");
        navigate("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.display_name.trim()) {
      toast.error("Iltimos, ismingizni kiriting");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profileData.display_name,
          phone: profileData.phone || null,
          location: profileData.location || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profil saqlandi!");
      navigate("/");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profilni saqlashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          {step === "start" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Send className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Telegram orqali kirish</CardTitle>
                <CardDescription>
                  Xavfsiz va tez kirish uchun Telegram botimizdan foydalaning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleTelegramRedirect}
                >
                  <Send className="mr-2 h-5 w-5" />
                  Telegram bilan davom etish
                </Button>
                <div className="space-y-2 rounded-lg bg-accent/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Qanday ishlaydi?</p>
                  <ol className="list-inside list-decimal space-y-1">
                    <li>Telegram botga yo'naltirilasiz</li>
                    <li>Bot sizga 6 xonali kod beradi</li>
                    <li>Kodni shu yerga kiriting</li>
                    <li>Tayyor! Akkauntingiz faol</li>
                  </ol>
                </div>
              </CardContent>
            </>
          )}

          {step === "code" && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Tasdiqlash kodi</CardTitle>
                <CardDescription>
                  Telegram botdan olgan 6 xonali kodingizni kiriting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Kod</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="text-center text-2xl tracking-widest"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kod 3 daqiqa ichida amal qiladi
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={code.length !== 6 || loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Tasdiqlash
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setStep("start")}
                    disabled={loading}
                  >
                    Orqaga
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === "profile" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Muvaffaqiyatli!</CardTitle>
                <CardDescription>
                  Siz tizimga kirdingiz. Endi profilingizni to'ldiring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ism / Nickname *</Label>
                    <Input 
                      id="name" 
                      placeholder="Ismingiz"
                      value={profileData.display_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqam (ixtiyoriy)</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+998 90 123 45 67"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Hudud</Label>
                    <Input 
                      id="location" 
                      placeholder="Parkent, tuman, mahalla"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Saqlash va davom etish
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
