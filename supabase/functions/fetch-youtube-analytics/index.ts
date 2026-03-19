import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOOGLE_CLIENT_ID = "1018807402846-5fojit5gfd7pnqrl8js1qgno061qiii5.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

async function refreshAccessToken(refreshToken: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to refresh access token");
  }

  const tokens = await tokenResponse.json();
  return {
    access_token: tokens.access_token,
    expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { integration_id } = await req.json();

    if (!integration_id) {
      throw new Error("Missing required parameter: integration_id");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: integration, error: integrationError } = await supabaseClient
      .from("analytics_integrations")
      .select("*")
      .eq("id", integration_id)
      .eq("platform", "youtube")
      .single();

    if (integrationError || !integration) {
      throw new Error("YouTube integration not found");
    }

    if (!integration.enabled) {
      throw new Error("YouTube integration is disabled");
    }

    let accessToken = integration.access_token;
    const tokenExpiresAt = new Date(integration.token_expires_at);

    if (tokenExpiresAt < new Date()) {
      const refreshed = await refreshAccessToken(integration.refresh_token);
      accessToken = refreshed.access_token;

      await supabaseClient
        .from("analytics_integrations")
        .update({
          access_token: refreshed.access_token,
          token_expires_at: refreshed.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", integration_id);
    }

    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${integration.channel_id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!channelResponse.ok) {
      throw new Error("Failed to fetch YouTube channel statistics");
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      throw new Error("Channel not found");
    }

    const stats = channel.statistics;
    const today = new Date().toISOString().split('T')[0];

    const { error: channelAnalyticsError } = await supabaseClient
      .from("youtube_channel_analytics")
      .upsert({
        integration_id,
        date: today,
        subscribers: parseInt(stats.subscriberCount || "0"),
        views: parseInt(stats.viewCount || "0"),
        videos: parseInt(stats.videoCount || "0"),
      }, {
        onConflict: "integration_id,date",
      });

    if (channelAnalyticsError) {
      console.error("Error saving channel analytics:", channelAnalyticsError);
    }

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${integration.channel_id}&order=date&maxResults=10&type=video`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      const videoIds = videosData.items?.map((item: any) => item.id.videoId).join(",");

      if (videoIds) {
        const videoDetailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (videoDetailsResponse.ok) {
          const videoDetails = await videoDetailsResponse.json();

          for (const video of videoDetails.items || []) {
            await supabaseClient
              .from("youtube_video_analytics")
              .upsert({
                integration_id,
                video_id: video.id,
                title: video.snippet.title,
                published_at: video.snippet.publishedAt,
                views: parseInt(video.statistics.viewCount || "0"),
                likes: parseInt(video.statistics.likeCount || "0"),
                comments: parseInt(video.statistics.commentCount || "0"),
                thumbnail_url: video.snippet.thumbnails.medium.url,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: "integration_id,video_id",
              });
          }
        }
      }
    }

    await supabaseClient
      .from("analytics_integrations")
      .update({
        last_sync: new Date().toISOString(),
      })
      .eq("id", integration_id);

    return new Response(
      JSON.stringify({
        success: true,
        channel: {
          subscribers: stats.subscriberCount,
          views: stats.viewCount,
          videos: stats.videoCount,
        },
        synced_at: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Fetch YouTube analytics error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});