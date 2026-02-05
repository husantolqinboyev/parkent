import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Send, ArrowRight, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageCompressor";
import { sanitizeListingForm, validateTitle, validateDescription, validateLocation } from "@/lib/sanitize";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CreateListing = () => {
  const { user, profile, isPremium, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    price: "",
    description: "",
    location: profile?.location || "",
  });

  const maxImages = isPremium ? 3 : 2;

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("E'lon joylash uchun tizimga kiring");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");

      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= maxImages) {
      toast.error(`Maksimum ${maxImages} ta rasm yuklash mumkin`);
      return;
    }

    setUploading(true);
    try {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Faqat rasm fayllarini yuklash mumkin");
        return;
      }

      // Validate file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Rasm hajmi 10MB dan oshmasligi kerak");
        return;
      }

      // Compress image before upload
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.7,
        maxSizeMB: 0.5,
      });

      const fileExt = "jpg"; // Always use jpg after compression
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(fileName, compressedFile, {
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("listings")
        .getPublicUrl(fileName);

      setImages([...images, publicUrl]);
      toast.success("Rasm yuklandi");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Rasm yuklashda xatolik");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs with XSS protection
    const titleValidation = validateTitle(formData.title);
    if (!titleValidation.valid) {
      toast.error(titleValidation.error);
      return;
    }

    const descValidation = validateDescription(formData.description);
    if (!descValidation.valid) {
      toast.error(descValidation.error);
      return;
    }

    const locValidation = validateLocation(formData.location);
    if (!locValidation.valid) {
      toast.error(locValidation.error);
      return;
    }

    if (!formData.category_id) {
      toast.error("Kategoriya tanlang");
      return;
    }

    const sanitized = sanitizeListingForm(formData);

    if (sanitized.price <= 0) {
      toast.error("To'g'ri narx kiriting");
      return;
    }

    if (images.length === 0) {
      toast.error("Kamida 1 ta rasm yuklang");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("listings")
        .insert({
          user_id: user?.id,
          title: sanitized.title,
          category_id: formData.category_id,
          price: sanitized.price,
          description: sanitized.description || null,
          location: sanitized.location || null,
          images: images,
          status: "pending",
          is_premium: false,
        });

      if (error) throw error;

      toast.success("E'lon yuborildi! Admin tasdiqlagach ko'rinadi.");
      navigate("/listings");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("E'lon yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Yangi e'lon yaratish</CardTitle>
              <CardDescription>
                E'loningiz admin tomonidan tekshirilgach, hammaga ko'rinadi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images */}
                <div className="space-y-2">
                  <Label>Rasmlar (maksimum {maxImages} ta)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-square overflow-hidden rounded-lg border border-border"
                      >
                        <img
                          src={img}
                          alt={`Rasm ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < maxImages && (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground">
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="mb-2 h-8 w-8" />
                            <span className="text-sm">Rasm qo'shish</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rasmlar avtomatik siqiladi (max 500KB).{" "}
                    {isPremium 
                      ? "Premium: kuniga 3 ta e'lon, 3 ta rasm" 
                      : "Oddiy: kuniga 1 ta e'lon, 2 ta rasm"}
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Mahsulot nomi *</Label>
                  <Input
                    id="title"
                    placeholder="Masalan: iPhone 14 Pro Max, yangi"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={loading}
                    maxLength={200}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Kategoriya *</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategoriya tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Narx (so'm) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="1000000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={loading}
                    min={0}
                    max={999999999999}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Joylashuv</Label>
                  <Input
                    id="location"
                    placeholder="Parkent, markaz"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={loading}
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Tavsif</Label>
                  <Textarea
                    id="description"
                    placeholder="Mahsulot haqida qo'shimcha ma'lumot..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={loading}
                    maxLength={5000}
                  />
                </div>

                {/* Contact Info */}
                <div className="rounded-lg bg-accent/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Telegram kontakt</p>
                      <p className="text-sm text-muted-foreground">
                        @{profile?.telegram_username || "username"} - avtomatik qo'shiladi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" className="flex-1" disabled={loading || uploading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    E'lonni joylash
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Bekor qilish
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  E'lon admin tomonidan tekshirilgach (odatda 1-2 soat ichida) hammaga ko'rinadi
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateListing;
