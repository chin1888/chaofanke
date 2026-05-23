import { useEffect } from 'react';
import { supabase } from '../supabase/client';

const TRACKED_KEY = 'chaofanke_visit_tracked';

function detectSource(): string {
  try {
    // 1. Check UTM source first
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) {
      return normalizeSourceName(utmSource);
    }

    // 2. Check referrer
    const referrer = document.referrer;
    if (!referrer) {
      return 'Direct';
    }

    const host = new URL(referrer).hostname.toLowerCase();

    if (host.includes('instagram') || host.includes('instagr.am')) return 'Instagram';
    if (host.includes('facebook') || host.includes('fb.com') || host.includes('fb.me')) return 'Facebook';
    if (host.includes('twitter') || host.includes('x.com') || host.includes('t.co')) return 'X (Twitter)';
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('pinterest')) return 'Pinterest';
    if (host.includes('reddit')) return 'Reddit';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('snapchat')) return 'Snapchat';
    if (host.includes('whatsapp')) return 'WhatsApp';
    if (host.includes('telegram')) return 'Telegram';
    if (host.includes('google')) return 'Google Search';
    if (host.includes('bing')) return 'Bing';
    if (host.includes('yahoo')) return 'Yahoo';
    if (host.includes('baidu')) return 'Baidu';
    if (host.includes('duckduckgo')) return 'DuckDuckGo';
    if (host.includes('yandex')) return 'Yandex';

    // 3. Other external referrer
    return 'Other / External';
  } catch {
    return 'Direct';
  }
}

function normalizeSourceName(source: string): string {
  const s = source.toLowerCase().trim();
  const map: Record<string, string> = {
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'fb': 'Facebook',
    'twitter': 'X (Twitter)',
    'x': 'X (Twitter)',
    'youtube': 'YouTube',
    'tiktok': 'TikTok',
    'pinterest': 'Pinterest',
    'reddit': 'Reddit',
    'linkedin': 'LinkedIn',
    'snapchat': 'Snapchat',
    'whatsapp': 'WhatsApp',
    'telegram': 'Telegram',
    'google': 'Google Search',
    'bing': 'Bing',
    'yahoo': 'Yahoo',
    'baidu': 'Baidu',
    'direct': 'Direct',
  };
  return map[s] || source.charAt(0).toUpperCase() + source.slice(1);
}

async function trackVisit() {
  // Only track once per browser session
  if (sessionStorage.getItem(TRACKED_KEY)) return;

  const sourceName = detectSource();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if row exists for today + source
    const { data: existing } = await supabase
      .from('traffic_sources')
      .select('id, visitors')
      .eq('source_name', sourceName)
      .eq('stat_date', today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('traffic_sources')
        .update({ visitors: (existing.visitors || 0) + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('traffic_sources')
        .insert({ source_name: sourceName, stat_date: today, visitors: 1 });
    }

    sessionStorage.setItem(TRACKED_KEY, '1');
  } catch (err) {
    // Silently fail - tracking should not break the app
    console.warn('Visit tracking failed:', err);
  }
}

export default function useVisitTracker() {
  useEffect(() => {
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      trackVisit();
    }, 500);
    return () => clearTimeout(timer);
  }, []);
}
