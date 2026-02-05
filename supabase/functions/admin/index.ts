import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();
    console.log(`Admin action: ${action}`, params);

    let result;

    switch (action) {
      case 'get_stats':
        // Get dashboard statistics
        const [
          { count: totalUsers },
          { count: premiumUsers },
          { count: pendingCount },
          { count: activeListings },
          { count: blockedUsers }
        ] = await Promise.all([
          supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
          supabaseAdmin.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'premium'),
          supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
        ]);

        result = {
          total_users: totalUsers || 0,
          premium_users: premiumUsers || 0,
          pending_listings: pendingCount || 0,
          active_listings: activeListings || 0,
          blocked_users: blockedUsers || 0,
        };
        break;

      case 'get_pending_listings':
        const { data: pendingData } = await supabaseAdmin
          .from('listings')
          .select(`
            id,
            user_id,
            title,
            description,
            price,
            location,
            images,
            status,
            is_premium,
            created_at,
            expires_at,
            categories:category_id (name)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        // Fetch profiles separately
        const pendingWithProfiles = await Promise.all(
          (pendingData || []).map(async (listing) => {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('display_name, telegram_username')
              .eq('user_id', listing.user_id)
              .single();
            return { ...listing, profiles: profile };
          })
        );
        
        result = pendingWithProfiles;
        break;

      case 'get_all_listings':
        const { status: listingStatus } = params;
        let listingsQuery = supabaseAdmin
          .from('listings')
          .select(`
            id,
            user_id,
            title,
            description,
            price,
            location,
            images,
            status,
            is_premium,
            created_at,
            expires_at,
            categories:category_id (name)
          `)
          .order('created_at', { ascending: false });
        
        if (listingStatus) {
          listingsQuery = listingsQuery.eq('status', listingStatus);
        }
        
        const { data: allListings } = await listingsQuery;
        
        // Fetch profiles separately for each listing
        const listingsWithProfiles = await Promise.all(
          (allListings || []).map(async (listing) => {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('display_name, telegram_username')
              .eq('user_id', listing.user_id)
              .single();
            return { ...listing, profiles: profile };
          })
        );
        
        result = listingsWithProfiles;
        break;

      case 'approve_listing':
        const { listing_id: approveId, is_premium, days } = params;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (days || 5));

        const { error: approveError } = await supabaseAdmin
          .from('listings')
          .update({
            status: 'active',
            is_premium: is_premium || false,
            expires_at: expiresAt.toISOString(),
          })
          .eq('id', approveId);

        if (approveError) throw approveError;
        result = { success: true, message: 'E\'lon tasdiqlandi' };
        break;

      case 'reject_listing':
        const { listing_id: rejectId, reason } = params;
        const { error: rejectError } = await supabaseAdmin
          .from('listings')
          .update({
            status: 'rejected',
            rejected_reason: reason || 'Admin tomonidan rad etildi',
          })
          .eq('id', rejectId);

        if (rejectError) throw rejectError;
        result = { success: true, message: 'E\'lon rad etildi' };
        break;

      case 'extend_listing':
        const { listing_id: extendId, extend_days } = params;
        const { data: listing } = await supabaseAdmin
          .from('listings')
          .select('expires_at')
          .eq('id', extendId)
          .single();

        if (listing) {
          const newExpiry = new Date(listing.expires_at || new Date());
          newExpiry.setDate(newExpiry.getDate() + (extend_days || 5));

          await supabaseAdmin
            .from('listings')
            .update({ expires_at: newExpiry.toISOString() })
            .eq('id', extendId);
        }

        result = { success: true, message: 'E\'lon muddati uzaytirildi' };
        break;

      case 'get_all_users':
        const { data: allProfiles } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Fetch user roles separately for each profile
        const usersWithRoles = await Promise.all(
          (allProfiles || []).map(async (profile) => {
            const { data: roles } = await supabaseAdmin
              .from('user_roles')
              .select('role, premium_until')
              .eq('user_id', profile.user_id);
            return { ...profile, user_roles: roles || [] };
          })
        );
        
        result = usersWithRoles;
        break;

      case 'set_premium':
        const { user_id: premiumUserId, premium_days } = params;
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + (premium_days || 30));

        const { error: premiumError } = await supabaseAdmin
          .from('user_roles')
          .update({
            role: 'premium',
            premium_until: premiumUntil.toISOString(),
          })
          .eq('user_id', premiumUserId);

        if (premiumError) throw premiumError;
        result = { success: true, message: 'Premium status berildi' };
        break;

      case 'remove_premium':
        const { user_id: removePremiumId } = params;
        const { error: removePremiumError } = await supabaseAdmin
          .from('user_roles')
          .update({
            role: 'user',
            premium_until: null,
          })
          .eq('user_id', removePremiumId);

        if (removePremiumError) throw removePremiumError;
        result = { success: true, message: 'Premium status olib tashlandi' };
        break;

      case 'block_user':
        const { user_id: blockId } = params;
        const { error: blockError } = await supabaseAdmin
          .from('profiles')
          .update({ status: 'blocked' })
          .eq('user_id', blockId);

        if (blockError) throw blockError;
        result = { success: true, message: 'Foydalanuvchi bloklandi' };
        break;

      case 'unblock_user':
        const { user_id: unblockId } = params;
        const { error: unblockError } = await supabaseAdmin
          .from('profiles')
          .update({ status: 'active' })
          .eq('user_id', unblockId);

        if (unblockError) throw unblockError;
        result = { success: true, message: 'Foydalanuvchi blokdan chiqarildi' };
        break;

      case 'get_categories':
        const { data: categories } = await supabaseAdmin
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        result = categories || [];
        break;

      case 'create_category':
        const { name: catName, icon: catIcon, slug: catSlug } = params;
        const { data: newCat, error: createCatError } = await supabaseAdmin
          .from('categories')
          .insert({ name: catName, icon: catIcon, slug: catSlug })
          .select()
          .single();
        if (createCatError) throw createCatError;
        result = { success: true, category: newCat };
        break;

      case 'update_category':
        const { category_id: updateCatId, name: updateCatName, icon: updateCatIcon, slug: updateCatSlug } = params;
        const { error: updateCatError } = await supabaseAdmin
          .from('categories')
          .update({ name: updateCatName, icon: updateCatIcon, slug: updateCatSlug })
          .eq('id', updateCatId);
        if (updateCatError) throw updateCatError;
        result = { success: true, message: 'Kategoriya yangilandi' };
        break;

      case 'delete_category':
        const { category_id: deleteCatId } = params;
        // Check if category has listings
        const { count: listingCount } = await supabaseAdmin
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', deleteCatId);
        
        if (listingCount && listingCount > 0) {
          throw new Error(`Bu kategoriyada ${listingCount} ta e'lon bor. Avval e'lonlarni boshqa kategoriyaga o'tkazing.`);
        }
        
        const { error: deleteCatError } = await supabaseAdmin
          .from('categories')
          .delete()
          .eq('id', deleteCatId);
        if (deleteCatError) throw deleteCatError;
        result = { success: true, message: 'Kategoriya o\'chirildi' };
        break;

      // Partners management
      case 'get_partners':
        const { data: partners } = await supabaseAdmin
          .from('partners')
          .select('*')
          .order('sort_order', { ascending: true });
        result = partners || [];
        break;

      case 'create_partner':
        const { name: partnerName, logo_url, website_url, telegram_url, instagram_url, facebook_url } = params;
        const { data: newPartner, error: createPartnerError } = await supabaseAdmin
          .from('partners')
          .insert({ 
            name: partnerName, 
            logo_url, 
            website_url, 
            telegram_url, 
            instagram_url, 
            facebook_url 
          })
          .select()
          .single();
        if (createPartnerError) throw createPartnerError;
        result = { success: true, partner: newPartner };
        break;

      case 'update_partner':
        const { partner_id, ...partnerData } = params;
        const { error: updatePartnerError } = await supabaseAdmin
          .from('partners')
          .update(partnerData)
          .eq('id', partner_id);
        if (updatePartnerError) throw updatePartnerError;
        result = { success: true, message: 'Hamkor yangilandi' };
        break;

      case 'delete_partner':
        const { partner_id: deletePartnerId } = params;
        const { error: deletePartnerError } = await supabaseAdmin
          .from('partners')
          .delete()
          .eq('id', deletePartnerId);
        if (deletePartnerError) throw deletePartnerError;
        result = { success: true, message: 'Hamkor o\'chirildi' };
        break;

      // Banners management
      case 'get_banners':
        const { data: banners } = await supabaseAdmin
          .from('banners')
          .select('*')
          .order('sort_order', { ascending: true });
        result = banners || [];
        break;

      case 'create_banner':
        const { title: bannerTitle, image_url: bannerImage, link_url: bannerLink, position: bannerPosition, expires_at: bannerExpiry } = params;
        const { data: newBanner, error: createBannerError } = await supabaseAdmin
          .from('banners')
          .insert({ 
            title: bannerTitle, 
            image_url: bannerImage, 
            link_url: bannerLink,
            position: bannerPosition || 'header',
            expires_at: bannerExpiry
          })
          .select()
          .single();
        if (createBannerError) throw createBannerError;
        result = { success: true, banner: newBanner };
        break;

      case 'update_banner':
        const { banner_id, ...bannerData } = params;
        const { error: updateBannerError } = await supabaseAdmin
          .from('banners')
          .update(bannerData)
          .eq('id', banner_id);
        if (updateBannerError) throw updateBannerError;
        result = { success: true, message: 'Banner yangilandi' };
        break;

      case 'delete_banner':
        const { banner_id: deleteBannerId } = params;
        const { error: deleteBannerError } = await supabaseAdmin
          .from('banners')
          .delete()
          .eq('id', deleteBannerId);
        if (deleteBannerError) throw deleteBannerError;
        result = { success: true, message: 'Banner o\'chirildi' };
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
