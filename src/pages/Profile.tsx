import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Crown, MapPin, Phone, Clock, Eye, Edit2, Loader2, Package, CheckCircle, XCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import PremiumBenefits from "@/components/PremiumBenefits";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  status: "pending" | "active" | "rejected" | "expired";
  images: string[] | null;
  views_count: number;
  created_at: string;
  expires_at: string | null;
  rejected_reason: string | null;
  category_id: string;
  category: {
    id: string;
    name: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const Profile = () => {
  const { user, profile, userRole, loading, isPremium, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: "",
    phone: "",
    location: "",
  });

  // Edit listing dialog
  const [editDialog, setEditDialog] = useState<{ open: boolean; listing: Listing | null }>({
    open: false,
    listing: null,
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    category_id: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete listing dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; listing: Listing | null }>({
    open: false,
    listing: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchListings();
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchListings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          title,
          description,
          price,
          location,
          status,
          images,
          views_count,
          created_at,
          expires_at,
          rejected_reason,
          category_id,
          category:categories(id, name, icon)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data as unknown as Listing[]);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setListingsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name || null,
          phone: formData.phone || null,
          location: formData.location || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      await refreshProfile();
      setIsEditing(false);
      toast({
        title: "Muvaffaqiyat",
        description: "Profil yangilandi",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Xatolik",
        description: "Profilni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditDialog = (listing: Listing) => {
    setEditForm({
      title: listing.title,
      description: listing.description || "",
      price: listing.price.toString(),
      location: listing.location || "",
      category_id: listing.category_id,
    });
    setEditDialog({ open: true, listing });
  };

  const handleSaveListingEdit = async () => {
    if (!editDialog.listing) return;
    
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("listings")
        .update({
          title: editForm.title,
          description: editForm.description || null,
          price: parseInt(editForm.price),
          location: editForm.location || null,
          category_id: editForm.category_id,
          status: 'pending', // Reset to pending after edit
        })
        .eq("id", editDialog.listing.id)
        .eq("user_id", user?.id); // Ensure user owns this listing

      if (error) throw error;
      
      toast({
        title: "Muvaffaqiyat",
        description: "E'lon yangilandi va qayta tekshiruvga yuborildi",
      });
      setEditDialog({ open: false, listing: null });
      fetchListings();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Xatolik",
        description: "E'lonni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!deleteDialog.listing) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", deleteDialog.listing.id)
        .eq("user_id", user?.id);

      if (error) throw error;
      
      toast({
        title: "Muvaffaqiyat",
        description: "E'lon o'chirildi",
      });
      setDeleteDialog({ open: false, listing: null });
      fetchListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Xatolik",
        description: "E'lonni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Faol</Badge>;
      case "pending":
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Tekshiruvda</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rad etilgan</Badge>;
      case "expired":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Muddati tugagan</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const canEditListing = (status: string) => {
    return status === "pending" || status === "rejected";
  };

  const getListingsStats = () => {
    const stats = {
      total: listings.length,
      active: listings.filter(l => l.status === "active").length,
      pending: listings.filter(l => l.status === "pending").length,
      rejected: listings.filter(l => l.status === "rejected").length,
      expired: listings.filter(l => l.status === "expired").length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const stats = getListingsStats();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {profile?.display_name || profile?.telegram_username || "Foydalanuvchi"}
                      {isPremium && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                          <Crown className="w-3 h-3 mr-1" /> Premium
                        </Badge>
                      )}
                      {userRole?.role === "admin" && (
                        <Badge variant="destructive">Admin</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {profile?.telegram_username && `@${profile.telegram_username}`}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditing ? "Bekor qilish" : "Tahrirlash"}
                </Button>
              </div>
            </CardHeader>
            
            {isEditing && (
              <CardContent className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Ism</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Ismingizni kiriting"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqami</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Manzil</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Shahringiz"
                    />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Saqlash
                </Button>
              </CardContent>
            )}
            
            {!isEditing && profile && (
              <CardContent className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  {userRole?.premium_until && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Premium: {new Date(userRole.premium_until).toLocaleDateString("uz-UZ")} gacha
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Premium Benefits */}
          <PremiumBenefits 
            isPremium={isPremium} 
            premiumUntil={userRole?.premium_until}
            onContactAdmin={() => window.open("https://t.me/parkent_markent", "_blank")}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Jami</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.active}</div>
              <div className="text-xs text-muted-foreground">Faol</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Tekshiruvda</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Rad etilgan</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{stats.expired}</div>
              <div className="text-xs text-muted-foreground">Muddati tugagan</div>
            </Card>
          </div>

          {/* Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Mening e'lonlarim
              </CardTitle>
              <Button asChild>
                <Link to="/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Yangi e'lon
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Barchasi</TabsTrigger>
                  <TabsTrigger value="active">Faol</TabsTrigger>
                  <TabsTrigger value="pending">Tekshiruvda</TabsTrigger>
                  <TabsTrigger value="rejected">Rad etilgan</TabsTrigger>
                </TabsList>
                
                {["all", "active", "pending", "rejected"].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                    {listingsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        {listings
                          .filter((l) => tab === "all" || l.status === tab)
                          .map((listing) => (
                            <div
                              key={listing.id}
                              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {listing.images && listing.images[0] ? (
                                  <img
                                    src={listing.images[0]}
                                    alt={listing.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-2xl">
                                    {listing.category?.icon || "📦"}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-medium truncate">{listing.title}</h3>
                                  {getStatusBadge(listing.status)}
                                </div>
                                <div className="text-lg font-bold text-primary">
                                  {listing.price.toLocaleString()} so'm
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {listing.views_count} ko'rish
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(listing.created_at), { 
                                      addSuffix: true, 
                                      locale: uz 
                                    })}
                                  </span>
                                  {listing.expires_at && listing.status === "active" && (
                                    <span className="text-amber-600">
                                      Muddat: {formatDistanceToNow(new Date(listing.expires_at), { 
                                        addSuffix: true, 
                                        locale: uz 
                                      })}
                                    </span>
                                  )}
                                </div>
                                {listing.status === "rejected" && listing.rejected_reason && (
                                  <div className="text-xs text-red-500 mt-1">
                                    Sabab: {listing.rejected_reason}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {canEditListing(listing.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenEditDialog(listing)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleteDialog({ open: true, listing })}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        
                        {listings.filter((l) => tab === "all" || l.status === tab).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            E'lonlar topilmadi
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />

      {/* Edit Listing Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, listing: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>E'lonni tahrirlash</DialogTitle>
            <DialogDescription>
              Tahrirlashdan keyin e'lon qayta tekshiruvga yuboriladi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sarlavha</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="E'lon sarlavhasi"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategoriya</Label>
              <Select
                value={editForm.category_id}
                onValueChange={(value) => setEditForm({ ...editForm, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Narx (so'm)</Label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                placeholder="100000"
              />
            </div>
            <div className="space-y-2">
              <Label>Manzil</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Shahar, tuman"
              />
            </div>
            <div className="space-y-2">
              <Label>Tavsif</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="E'lon haqida batafsil ma'lumot"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, listing: null })}>
              Bekor qilish
            </Button>
            <Button onClick={handleSaveListingEdit} disabled={editSaving}>
              {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Listing Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, listing: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E'lonni o'chirish</DialogTitle>
            <DialogDescription>
              "{deleteDialog.listing?.title}" e'lonini o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, listing: null })}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDeleteListing} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
