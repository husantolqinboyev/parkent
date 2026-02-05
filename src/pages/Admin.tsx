import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Users,
  Crown,
  Check,
  X,
  Clock,
  Ban,
  Unlock,
  ArrowLeft,
  Loader2,
  RefreshCw,
  FolderPlus,
  Pencil,
  Trash2,
  Tags,
  Handshake,
  Image,
  Link as LinkIcon,
  Globe,
  Send,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import PendingListingCard from "@/components/admin/PendingListingCard";

interface Stats {
  total_users: number;
  premium_users: number;
  pending_listings: number;
  active_listings: number;
  blocked_users: number;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location: string | null;
  images: string[];
  status: string;
  is_premium: boolean;
  created_at: string;
  expires_at: string | null;
  profiles: { display_name: string | null; telegram_username: string | null } | null;
  categories: { name: string } | null;
}

interface UserData {
  id: string;
  user_id: string;
  display_name: string | null;
  telegram_username: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  user_roles: { role: string; premium_until: string | null }[] | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  listing_count: number;
  created_at: string;
}

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  telegram_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  position: string;
  sort_order: number;
  expires_at: string | null;
}

const Admin = () => {
  const { user, session, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialogs
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; listingId: string | null }>({
    open: false,
    listingId: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [premiumDialog, setPremiumDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });
  const [premiumDays, setPremiumDays] = useState("30");
  const [extendDialog, setExtendDialog] = useState<{ open: boolean; listingId: string | null }>({
    open: false,
    listingId: null,
  });
  const [extendDays, setExtendDays] = useState("5");

  // Category dialogs
  const [categoryDialog, setCategoryDialog] = useState<{ 
    open: boolean; 
    mode: 'create' | 'edit'; 
    category: Category | null 
  }>({
    open: false,
    mode: 'create',
    category: null,
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '', slug: '' });
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });

  // Partner and Banner dialogs
  const [partnerDialog, setPartnerDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; partner: Partner | null }>({
    open: false,
    mode: 'create',
    partner: null,
  });
  const [partnerForm, setPartnerForm] = useState({ name: '', logo_url: '', website_url: '', telegram_url: '', instagram_url: '', facebook_url: '' });
  const [bannerDialog, setBannerDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; banner: Banner | null }>({
    open: false,
    mode: 'create',
    banner: null,
  });
  const [bannerForm, setBannerForm] = useState({ title: '', image_url: '', link_url: '', expires_at: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/");
      toast.error("Admin huquqi kerak");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const callAdminAPI = async (action: string, params: Record<string, unknown> = {}) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Admin API error');
    }

    return response.json();
  };

  const fetchData = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const [statsData, listingsData, usersData, categoriesData, partnersData, bannersData] = await Promise.all([
        callAdminAPI("get_stats"),
        callAdminAPI("get_all_listings"),
        callAdminAPI("get_all_users"),
        callAdminAPI("get_categories"),
        callAdminAPI("get_partners"),
        callAdminAPI("get_banners"),
      ]);

      setStats(statsData);
      setListings(listingsData);
      setUsers(usersData);
      setCategories(categoriesData);
      setPartners(partnersData);
      setBanners(bannersData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && isAdmin) {
      fetchData();
    }
  }, [session, isAdmin]);

  const handleApproveListing = async (listingId: string, isPremium = false) => {
    setActionLoading(listingId);
    try {
      await callAdminAPI("approve_listing", { listing_id: listingId, is_premium: isPremium, days: 5 });
      toast.success("E'lon tasdiqlandi");
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectListing = async () => {
    if (!rejectDialog.listingId) return;
    setActionLoading(rejectDialog.listingId);
    try {
      await callAdminAPI("reject_listing", { listing_id: rejectDialog.listingId, reason: rejectReason });
      toast.success("E'lon rad etildi");
      setRejectDialog({ open: false, listingId: null });
      setRejectReason("");
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendListing = async () => {
    if (!extendDialog.listingId) return;
    setActionLoading(extendDialog.listingId);
    try {
      await callAdminAPI("extend_listing", { listing_id: extendDialog.listingId, extend_days: parseInt(extendDays) });
      toast.success("E'lon muddati uzaytirildi");
      setExtendDialog({ open: false, listingId: null });
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPremium = async () => {
    if (!premiumDialog.userId) return;
    setActionLoading(premiumDialog.userId);
    try {
      await callAdminAPI("set_premium", { user_id: premiumDialog.userId, premium_days: parseInt(premiumDays) });
      toast.success("Premium status berildi");
      setPremiumDialog({ open: false, userId: null });
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemovePremium = async (userId: string) => {
    setActionLoading(userId);
    try {
      await callAdminAPI("remove_premium", { user_id: userId });
      toast.success("Premium status olib tashlandi");
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await callAdminAPI("block_user", { user_id: userId });
      toast.success("Foydalanuvchi bloklandi");
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await callAdminAPI("unblock_user", { user_id: userId });
      toast.success("Foydalanuvchi blokdan chiqarildi");
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  // Category handlers
  const handleOpenCategoryDialog = (mode: 'create' | 'edit', category?: Category) => {
    if (mode === 'edit' && category) {
      setCategoryForm({ name: category.name, icon: category.icon, slug: category.slug });
      setCategoryDialog({ open: true, mode: 'edit', category });
    } else {
      setCategoryForm({ name: '', icon: '📦', slug: '' });
      setCategoryDialog({ open: true, mode: 'create', category: null });
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.icon || !categoryForm.slug) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }

    setActionLoading('category');
    try {
      if (categoryDialog.mode === 'create') {
        await callAdminAPI("create_category", {
          name: categoryForm.name,
          icon: categoryForm.icon,
          slug: categoryForm.slug,
        });
        toast.success("Kategoriya yaratildi");
      } else if (categoryDialog.category) {
        await callAdminAPI("update_category", {
          category_id: categoryDialog.category.id,
          name: categoryForm.name,
          icon: categoryForm.icon,
          slug: categoryForm.slug,
        });
        toast.success("Kategoriya yangilandi");
      }
      setCategoryDialog({ open: false, mode: 'create', category: null });
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryDialog.category) return;
    setActionLoading(deleteCategoryDialog.category.id);
    try {
      await callAdminAPI("delete_category", { category_id: deleteCategoryDialog.category.id });
      toast.success("Kategoriya o'chirildi");
      setDeleteCategoryDialog({ open: false, category: null });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Xatolik yuz berdi";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Partner handlers
  const handleOpenPartnerDialog = (mode: 'create' | 'edit', partner?: Partner) => {
    if (mode === 'edit' && partner) {
      setPartnerForm({
        name: partner.name,
        logo_url: partner.logo_url || '',
        website_url: partner.website_url || '',
        telegram_url: partner.telegram_url || '',
        instagram_url: partner.instagram_url || '',
        facebook_url: partner.facebook_url || '',
      });
      setPartnerDialog({ open: true, mode: 'edit', partner });
    } else {
      setPartnerForm({ name: '', logo_url: '', website_url: '', telegram_url: '', instagram_url: '', facebook_url: '' });
      setPartnerDialog({ open: true, mode: 'create', partner: null });
    }
  };

  const handleSavePartner = async () => {
    if (!partnerForm.name) {
      toast.error("Hamkor nomini kiriting");
      return;
    }

    setActionLoading('partner');
    try {
      if (partnerDialog.mode === 'create') {
        await callAdminAPI("create_partner", partnerForm);
        toast.success("Hamkor qo'shildi");
      } else if (partnerDialog.partner) {
        await callAdminAPI("update_partner", { partner_id: partnerDialog.partner.id, ...partnerForm });
        toast.success("Hamkor yangilandi");
      }
      setPartnerDialog({ open: false, mode: 'create', partner: null });
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    setActionLoading(partnerId);
    try {
      await callAdminAPI("delete_partner", { partner_id: partnerId });
      toast.success("Hamkor o'chirildi");
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  // Banner handlers
  const handleOpenBannerDialog = (mode: 'create' | 'edit', banner?: Banner) => {
    if (mode === 'edit' && banner) {
      setBannerForm({
        title: banner.title || '',
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        expires_at: banner.expires_at ? new Date(banner.expires_at).toISOString().split('T')[0] : '',
      });
      setBannerDialog({ open: true, mode: 'edit', banner });
    } else {
      setBannerForm({ title: '', image_url: '', link_url: '', expires_at: '' });
      setBannerDialog({ open: true, mode: 'create', banner: null });
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("banners")
        .getPublicUrl(fileName);

      setBannerForm({ ...bannerForm, image_url: publicUrl });
      toast.success("Rasm yuklandi");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Rasm yuklashda xatolik");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.image_url) {
      toast.error("Banner rasmini yuklang");
      return;
    }

    setActionLoading('banner');
    try {
      if (bannerDialog.mode === 'create') {
        await callAdminAPI("create_banner", {
          title: bannerForm.title || null,
          image_url: bannerForm.image_url,
          link_url: bannerForm.link_url || null,
          expires_at: bannerForm.expires_at ? new Date(bannerForm.expires_at).toISOString() : null,
        });
        toast.success("Banner qo'shildi");
      } else if (bannerDialog.banner) {
        await callAdminAPI("update_banner", {
          banner_id: bannerDialog.banner.id,
          title: bannerForm.title || null,
          image_url: bannerForm.image_url,
          link_url: bannerForm.link_url || null,
          expires_at: bannerForm.expires_at ? new Date(bannerForm.expires_at).toISOString() : null,
        });
        toast.success("Banner yangilandi");
      }
      setBannerDialog({ open: false, mode: 'create', banner: null });
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    setActionLoading(bannerId);
    try {
      await callAdminAPI("delete_banner", { banner_id: bannerId });
      toast.success("Banner o'chirildi");
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingListings = listings.filter(l => l.status === "pending");
  const activeListings = listings.filter(l => l.status === "active");
  const rejectedListings = listings.filter(l => l.status === "rejected");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yangilash
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Jami foydalanuvchilar</CardDescription>
              <CardTitle className="text-3xl">{stats?.total_users || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Premium foydalanuvchilar</CardDescription>
              <CardTitle className="text-3xl text-primary">{stats?.premium_users || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Kutilayotgan e'lonlar</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats?.pending_listings || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Faol e'lonlar</CardDescription>
              <CardTitle className="text-3xl text-primary">{stats?.active_listings || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bloklangan</CardDescription>
              <CardTitle className="text-3xl text-destructive">{stats?.blocked_users || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Kutilayotgan</span> ({pendingListings.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Faol</span> ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Rad etilgan</span> ({rejectedListings.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Foydalanuvchilar</span> ({users.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="h-4 w-4" />
              <span className="hidden sm:inline">Kategoriyalar</span> ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">Hamkorlar</span> ({partners.length})
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Bannerlar</span> ({banners.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Listings */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Tasdiqlashni kutayotgan e'lonlar</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Kutilayotgan e'lonlar yo'q</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pendingListings.map((listing) => (
                      <PendingListingCard
                        key={listing.id}
                        listing={listing}
                        onApprove={handleApproveListing}
                        onReject={(id) => setRejectDialog({ open: true, listingId: id })}
                        isLoading={actionLoading === listing.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Listings */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Faol e'lonlar</CardTitle>
              </CardHeader>
              <CardContent>
                {activeListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Faol e'lonlar yo'q</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sarlavha</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Narx</TableHead>
                        <TableHead>Muddati</TableHead>
                        <TableHead className="text-right">Harakatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">{listing.title}</TableCell>
                          <TableCell>
                            {listing.is_premium ? (
                              <Badge className="bg-primary">Premium</Badge>
                            ) : (
                              <Badge variant="secondary">Oddiy</Badge>
                            )}
                          </TableCell>
                          <TableCell>{listing.price.toLocaleString()} so'm</TableCell>
                          <TableCell>
                            {listing.expires_at
                              ? new Date(listing.expires_at).toLocaleDateString("uz-UZ")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExtendDialog({ open: true, listingId: listing.id })}
                            >
                              <Clock className="mr-1 h-4 w-4" />
                              Uzaytirish
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejected Listings */}
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rad etilgan e'lonlar</CardTitle>
              </CardHeader>
              <CardContent>
                {rejectedListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Rad etilgan e'lonlar yo'q</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sarlavha</TableHead>
                        <TableHead>Kategoriya</TableHead>
                        <TableHead>Foydalanuvchi</TableHead>
                        <TableHead>Sana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">{listing.title}</TableCell>
                          <TableCell>{listing.categories?.name}</TableCell>
                          <TableCell>
                            {listing.profiles?.display_name || listing.profiles?.telegram_username || "—"}
                          </TableCell>
                          <TableCell>
                            {new Date(listing.created_at).toLocaleDateString("uz-UZ")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Foydalanuvchilar</CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Foydalanuvchilar yo'q</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ism</TableHead>
                        <TableHead>Telegram</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead>Ro'yxatdan o'tgan</TableHead>
                        <TableHead className="text-right">Harakatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData) => {
                        const role = userData.user_roles?.[0]?.role || "user";
                        return (
                          <TableRow key={userData.id}>
                            <TableCell className="font-medium">
                              {userData.display_name || "—"}
                            </TableCell>
                            <TableCell>
                              {userData.telegram_username ? `@${userData.telegram_username}` : "—"}
                            </TableCell>
                            <TableCell>
                              {role === "admin" && <Badge variant="destructive">Admin</Badge>}
                              {role === "premium" && <Badge className="bg-primary">Premium</Badge>}
                              {role === "user" && <Badge variant="secondary">Oddiy</Badge>}
                            </TableCell>
                            <TableCell>
                              {userData.status === "blocked" ? (
                                <Badge variant="destructive">Bloklangan</Badge>
                              ) : (
                                <Badge variant="outline">Faol</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(userData.created_at).toLocaleDateString("uz-UZ")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {role !== "admin" && (
                                  <>
                                    {role === "premium" ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRemovePremium(userData.user_id)}
                                        disabled={actionLoading === userData.user_id}
                                      >
                                        <X className="mr-1 h-4 w-4" />
                                        Premium olib tashlash
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPremiumDialog({ open: true, userId: userData.user_id })}
                                        disabled={actionLoading === userData.user_id}
                                      >
                                        <Crown className="mr-1 h-4 w-4" />
                                        Premium berish
                                      </Button>
                                    )}
                                    {userData.status === "blocked" ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUnblockUser(userData.user_id)}
                                        disabled={actionLoading === userData.user_id}
                                      >
                                        <Unlock className="mr-1 h-4 w-4" />
                                        Blokdan chiqarish
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleBlockUser(userData.user_id)}
                                        disabled={actionLoading === userData.user_id}
                                      >
                                        <Ban className="mr-1 h-4 w-4" />
                                        Bloklash
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Kategoriyalar</CardTitle>
                <Button onClick={() => handleOpenCategoryDialog('create')}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Yangi kategoriya
                </Button>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Kategoriyalar yo'q</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Icon</TableHead>
                        <TableHead>Nomi</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>E'lonlar soni</TableHead>
                        <TableHead className="text-right">Harakatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="text-2xl">{category.icon}</TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                          <TableCell>{category.listing_count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCategoryDialog('edit', category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteCategoryDialog({ open: true, category })}
                                disabled={category.listing_count > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partners */}
          <TabsContent value="partners">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Hamkorlar</CardTitle>
                <Button onClick={() => handleOpenPartnerDialog('create')}>
                  <Handshake className="mr-2 h-4 w-4" />
                  Yangi hamkor
                </Button>
              </CardHeader>
              <CardContent>
                {partners.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Hamkorlar yo'q</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Nomi</TableHead>
                        <TableHead>Ijtimoiy tarmoqlar</TableHead>
                        <TableHead className="text-right">Harakatlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            {partner.logo_url ? (
                              <img src={partner.logo_url} alt={partner.name} className="h-8 w-8 rounded object-contain" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-sm font-bold text-primary">
                                {partner.name.charAt(0)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {partner.telegram_url && <Send className="h-4 w-4 text-muted-foreground" />}
                              {partner.instagram_url && <Globe className="h-4 w-4 text-muted-foreground" />}
                              {partner.website_url && <LinkIcon className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleOpenPartnerDialog('edit', partner)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeletePartner(partner.id)} disabled={actionLoading === partner.id}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banners */}
          <TabsContent value="banners">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reklama bannerlari</CardTitle>
                <Button onClick={() => handleOpenBannerDialog('create')}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Yangi banner
                </Button>
              </CardHeader>
              <CardContent>
                {banners.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Bannerlar yo'q</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {banners.map((banner) => (
                      <Card key={banner.id} className="overflow-hidden">
                        <div className="aspect-[16/4] overflow-hidden">
                          <img src={banner.image_url} alt={banner.title || "Banner"} className="h-full w-full object-cover" />
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium">{banner.title || "Nomsiz banner"}</p>
                          {banner.link_url && <p className="text-xs text-muted-foreground truncate">{banner.link_url}</p>}
                          {banner.expires_at && (
                            <p className="text-xs text-muted-foreground">
                              Muddati: {new Date(banner.expires_at).toLocaleDateString("uz-UZ")}
                            </p>
                          )}
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenBannerDialog('edit', banner)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteBanner(banner.id)} disabled={actionLoading === banner.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, listingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E'lonni rad etish</DialogTitle>
            <DialogDescription>
              Rad etish sababini kiriting (ixtiyoriy)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sabab</Label>
              <Textarea
                placeholder="Masalan: Rasm sifati yomon"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, listingId: null })}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleRejectListing}>
              Rad etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Dialog */}
      <Dialog open={premiumDialog.open} onOpenChange={(open) => setPremiumDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium status berish</DialogTitle>
            <DialogDescription>
              Premium muddatini kunlarda kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kunlar soni</Label>
              <Input
                type="number"
                value={premiumDays}
                onChange={(e) => setPremiumDays(e.target.value)}
                min="1"
                max="365"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPremiumDialog({ open: false, userId: null })}>
              Bekor qilish
            </Button>
            <Button onClick={handleSetPremium}>
              <Crown className="mr-2 h-4 w-4" />
              Premium berish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={extendDialog.open} onOpenChange={(open) => setExtendDialog({ open, listingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E'lon muddatini uzaytirish</DialogTitle>
            <DialogDescription>
              Uzaytirish kunlarini kiriting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Kunlar soni</Label>
              <Input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                min="1"
                max="30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog({ open: false, listingId: null })}>
              Bekor qilish
            </Button>
            <Button onClick={handleExtendListing}>
              <Clock className="mr-2 h-4 w-4" />
              Uzaytirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ ...categoryDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoryDialog.mode === 'create' ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Icon (emoji)</Label>
              <Input
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                placeholder="🏠"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomi</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setCategoryForm({ 
                    ...categoryForm, 
                    name,
                    slug: categoryDialog.mode === 'create' ? generateSlug(name) : categoryForm.slug
                  });
                }}
                placeholder="Ko'chmas mulk"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="kochmas-mulk"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false, mode: 'create', category: null })}>
              Bekor qilish
            </Button>
            <Button onClick={handleSaveCategory} disabled={actionLoading === 'category'}>
              {actionLoading === 'category' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteCategoryDialog.open} onOpenChange={(open) => setDeleteCategoryDialog({ open, category: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyani o'chirish</DialogTitle>
            <DialogDescription>
              "{deleteCategoryDialog.category?.name}" kategoriyasini o'chirishni tasdiqlaysizmi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialog({ open: false, category: null })}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Dialog */}
      <Dialog open={partnerDialog.open} onOpenChange={(open) => setPartnerDialog({ ...partnerDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {partnerDialog.mode === 'create' ? 'Yangi hamkor' : 'Hamkorni tahrirlash'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nomi *</Label>
              <Input
                value={partnerForm.name}
                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                placeholder="Hamkor nomi"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={partnerForm.logo_url}
                onChange={(e) => setPartnerForm({ ...partnerForm, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telegram</Label>
                <Input
                  value={partnerForm.telegram_url}
                  onChange={(e) => setPartnerForm({ ...partnerForm, telegram_url: e.target.value })}
                  placeholder="https://t.me/username"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={partnerForm.instagram_url}
                  onChange={(e) => setPartnerForm({ ...partnerForm, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={partnerForm.facebook_url}
                  onChange={(e) => setPartnerForm({ ...partnerForm, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/page"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={partnerForm.website_url}
                  onChange={(e) => setPartnerForm({ ...partnerForm, website_url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartnerDialog({ open: false, mode: 'create', partner: null })}>
              Bekor qilish
            </Button>
            <Button onClick={handleSavePartner} disabled={actionLoading === 'partner'}>
              {actionLoading === 'partner' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner Dialog */}
      <Dialog open={bannerDialog.open} onOpenChange={(open) => setBannerDialog({ ...bannerDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bannerDialog.mode === 'create' ? 'Yangi banner' : 'Bannerni tahrirlash'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banner rasmi *</Label>
              {bannerForm.image_url ? (
                <div className="relative aspect-[16/4] overflow-hidden rounded-lg border border-border">
                  <img src={bannerForm.image_url} alt="Banner" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setBannerForm({ ...bannerForm, image_url: '' })}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex aspect-[16/4] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="mb-2 h-8 w-8" />
                      <span className="text-sm">Rasm yuklash (1920x80 tavsiya etiladi)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sarlavha</Label>
              <Input
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                placeholder="Banner sarlavhasi"
              />
            </div>
            <div className="space-y-2">
              <Label>Havola (link)</Label>
              <Input
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Muddati (ixtiyoriy)</Label>
              <Input
                type="date"
                value={bannerForm.expires_at}
                onChange={(e) => setBannerForm({ ...bannerForm, expires_at: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerDialog({ open: false, mode: 'create', banner: null })}>
              Bekor qilish
            </Button>
            <Button onClick={handleSaveBanner} disabled={actionLoading === 'banner'}>
              {actionLoading === 'banner' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
