import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  Image, 
  Clock, 
  Star,
  Shield,
  MessageCircle
} from "lucide-react";

interface PremiumBenefitsProps {
  isPremium: boolean;
  premiumUntil?: string | null;
  onContactAdmin?: () => void;
}

const PremiumBenefits = ({ isPremium, premiumUntil, onContactAdmin }: PremiumBenefitsProps) => {
  const benefits = [
    {
      icon: Zap,
      title: "Kuniga 3 ta e'lon",
      description: "Oddiy foydalanuvchilar 1 ta, siz esa 3 tagacha e'lon joylashingiz mumkin",
      free: "1 ta/kun",
      premium: "3 ta/kun",
    },
    {
      icon: Image,
      title: "Har e'londa 3 ta rasm",
      description: "Ko'proq rasm = ko'proq e'tibor va ishonch",
      free: "2 ta rasm",
      premium: "3 ta rasm",
    },
    {
      icon: TrendingUp,
      title: "Yuqori o'rinlarda ko'rinish",
      description: "E'lonlaringiz boshqalardan ustun turadi",
      free: "Oddiy",
      premium: "Birinchi",
    },
    {
      icon: Star,
      title: "Premium badge",
      description: "Maxsus yashil dizayn va Premium belgisi",
      free: "Yo'q",
      premium: "Ha",
    },
    {
      icon: Clock,
      title: "E'lon muddati",
      description: "E'lonlaringiz uzoqroq muddatga faol bo'ladi",
      free: "5 kun",
      premium: "7 kun",
    },
    {
      icon: Shield,
      title: "Ustuvor qo'llab-quvvatlash",
      description: "Savollaringizga tezroq javob olasiz",
      free: "Oddiy",
      premium: "Ustuvor",
    },
  ];

  const daysRemaining = premiumUntil 
    ? Math.max(0, Math.ceil((new Date(premiumUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Card className={isPremium ? "border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${isPremium ? "text-primary" : "text-muted-foreground"}`} />
            <CardTitle>Premium afzalliklari</CardTitle>
          </div>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
              <Crown className="w-3 h-3 mr-1" />
              Faol
            </Badge>
          )}
        </div>
        <CardDescription>
          {isPremium 
            ? `Premium statusingiz ${daysRemaining} kun qoldi`
            : "Premium bo'lib, ko'proq imkoniyatlarga ega bo'ling"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`flex gap-3 rounded-lg border p-3 ${
                isPremium ? "bg-card border-primary/20" : "bg-muted/30"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <benefit.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    Bepul: {benefit.free}
                  </Badge>
                  <Badge className={`text-xs px-1.5 py-0 ${
                    isPremium ? "bg-primary" : "bg-muted-foreground"
                  }`}>
                    Premium: {benefit.premium}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isPremium && (
          <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center">
            <h4 className="font-semibold text-foreground mb-2">
              Premium bo'lishni xohlaysizmi?
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Admin bilan bog'lanib, Premium statusga ega bo'ling
            </p>
            <Button 
              onClick={onContactAdmin}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Adminga yozish
            </Button>
          </div>
        )}

        {isPremium && premiumUntil && (
          <div className="rounded-lg bg-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Premium muddati</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(premiumUntil).toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })} gacha
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{daysRemaining}</p>
                <p className="text-xs text-muted-foreground">kun qoldi</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumBenefits;
