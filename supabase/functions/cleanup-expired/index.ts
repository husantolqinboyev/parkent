import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function should be called by a cron job
// It cleans up expired listings and their associated storage files
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`Running cleanup at ${now.toISOString()}`);
    console.log(`Looking for listings expired before ${oneDayAgo.toISOString()}`);

    // Step 1: Find listings that expired more than 24 hours ago
    const { data: expiredListings, error: fetchError } = await supabase
      .from("listings")
      .select("id, images, user_id, title")
      .eq("status", "expired")
      .lt("expires_at", oneDayAgo.toISOString());

    if (fetchError) {
      console.error("Error fetching expired listings:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredListings?.length || 0} listings to delete`);

    if (!expiredListings || expiredListings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired listings to clean up",
          deleted: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let deletedCount = 0;
    let storageDeletedCount = 0;

    // Step 2: Delete images from storage and then delete listing records
    for (const listing of expiredListings) {
      try {
        // Delete images from storage
        if (listing.images && listing.images.length > 0) {
          for (const imageUrl of listing.images) {
            try {
              // Extract file path from URL
              // URL format: https://xxx.supabase.co/storage/v1/object/public/listings/user_id/filename.jpg
              const urlParts = imageUrl.split("/listings/");
              if (urlParts.length > 1) {
                const filePath = urlParts[1];
                const { error: deleteStorageError } = await supabase.storage
                  .from("listings")
                  .remove([filePath]);

                if (deleteStorageError) {
                  console.log(`Failed to delete image ${filePath}:`, deleteStorageError);
                } else {
                  storageDeletedCount++;
                  console.log(`Deleted image: ${filePath}`);
                }
              }
            } catch (imgError) {
              console.log(`Error processing image URL ${imageUrl}:`, imgError);
            }
          }
        }

        // Delete the listing record
        const { error: deleteError } = await supabase
          .from("listings")
          .delete()
          .eq("id", listing.id);

        if (deleteError) {
          console.error(`Failed to delete listing ${listing.id}:`, deleteError);
        } else {
          deletedCount++;
          console.log(`Deleted listing: ${listing.id} (${listing.title})`);
        }
      } catch (listingError) {
        console.error(`Error processing listing ${listing.id}:`, listingError);
      }
    }

    // Step 3: Also update listings that just expired (set status to expired)
    const { data: newlyExpired, error: updateError } = await supabase
      .from("listings")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", now.toISOString())
      .select("id");

    if (updateError) {
      console.error("Error updating newly expired listings:", updateError);
    } else {
      console.log(`Marked ${newlyExpired?.length || 0} listings as expired`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed`,
        deleted: deletedCount,
        imagesDeleted: storageDeletedCount,
        markedExpired: newlyExpired?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
