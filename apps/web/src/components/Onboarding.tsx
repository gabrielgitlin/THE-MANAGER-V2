import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Music, Globe, Users, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface OnboardingProps {
  onComplete: () => void;
  initialStep?: number;
  stepsCompleted?: string[];
}

const TOTAL_STEPS = 5;

const STEP_META = [
  { num: 1, title: 'Welcome', icon: Music },
  { num: 2, title: 'Your Artist', icon: Music },
  { num: 3, title: 'Platforms', icon: Globe },
  { num: 4, title: 'Touring', icon: Globe },
  { num: 5, title: 'Your Profile', icon: User },
];

export default function Onboarding({ onComplete, initialStep = 1, stepsCompleted = [] }: OnboardingProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(initialStep);
  const [completed, setCompleted] = useState<Set<string>>(new Set(stepsCompleted));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 — Artist basics
  const [artistName, setArtistName] = useState('');
  const [artistGenre, setArtistGenre] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistCountry, setArtistCountry] = useState('');
  const [artistCity, setArtistCity] = useState('');
  const [artistLabel, setArtistLabel] = useState('');

  // Step 3 — Streaming & social
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Step 4 — Touring
  const [bandsintownUrl, setBandsintownUrl] = useState('');
  const [songkickUrl, setSongkickUrl] = useState('');
  const [bookingAgency, setBookingAgency] = useState('');
  const [bookingAgent, setBookingAgent] = useState('');
  const [managementCompany, setManagementCompany] = useState('');
  const [publicist, setPublicist] = useState('');

  // Step 5 — Manager profile
  const [managerName, setManagerName] = useState(user?.full_name || '');
  const [managerRole, setManagerRole] = useState('');

  // Load existing data
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    // Load artist if exists
    const { data: artist } = await supabase
      .from('artists')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (artist) {
      setArtistName(artist.name || '');
      setArtistGenre(artist.genre || '');
      setArtistBio(artist.bio || '');
      setArtistCountry(artist.country || '');
      setArtistCity(artist.city || '');
      setArtistLabel(artist.label || '');
      setSpotifyUrl(artist.spotify_url || '');
      setAppleMusicUrl(artist.apple_music_url || '');
      setInstagramUrl(artist.instagram_url || '');
      setYoutubeUrl(artist.youtube_url || '');
      setTiktokUrl(artist.tiktok_url || '');
      setTwitterUrl(artist.twitter_url || '');
      setWebsiteUrl(artist.website_url || '');
      setBandsintownUrl(artist.bandsintown_url || '');
      setSongkickUrl(artist.songkick_url || '');
      setBookingAgency(artist.booking_agency || '');
      setBookingAgent(artist.booking_agent || '');
      setManagementCompany(artist.management_company || '');
      setPublicist(artist.publicist || '');
    }
  };

  const saveProgress = async (nextStep: number, markCompleted?: string) => {
    const newCompleted = new Set(completed);
    if (markCompleted) newCompleted.add(markCompleted);
    setCompleted(newCompleted);

    await supabase
      .from('onboarding')
      .upsert({
        user_id: user?.id,
        current_step: nextStep,
        steps_completed: Array.from(newCompleted),
        completed: nextStep > TOTAL_STEPS,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
  };

  const saveArtistBasics = async () => {
    if (!artistName.trim()) {
      setError('Artist name is required');
      return false;
    }
    setSaving(true);
    setError(null);

    // Check if artist exists
    const { data: existing } = await supabase
      .from('artists')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('artists')
        .update({
          name: artistName.trim(),
          genre: artistGenre.trim() || null,
          bio: artistBio.trim() || null,
          country: artistCountry.trim() || null,
          city: artistCity.trim() || null,
          label: artistLabel.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('artists')
        .insert({
          name: artistName.trim(),
          genre: artistGenre.trim() || null,
          bio: artistBio.trim() || null,
          country: artistCountry.trim() || null,
          city: artistCity.trim() || null,
          label: artistLabel.trim() || null,
        });
    }

    setSaving(false);
    return true;
  };

  const savePlatforms = async () => {
    setSaving(true);
    const { data: artist } = await supabase
      .from('artists')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (artist) {
      await supabase
        .from('artists')
        .update({
          spotify_url: spotifyUrl.trim() || null,
          apple_music_url: appleMusicUrl.trim() || null,
          instagram_url: instagramUrl.trim() || null,
          youtube_url: youtubeUrl.trim() || null,
          tiktok_url: tiktokUrl.trim() || null,
          twitter_url: twitterUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artist.id);
    }
    setSaving(false);
    return true;
  };

  const saveTouring = async () => {
    setSaving(true);
    const { data: artist } = await supabase
      .from('artists')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (artist) {
      await supabase
        .from('artists')
        .update({
          bandsintown_url: bandsintownUrl.trim() || null,
          songkick_url: songkickUrl.trim() || null,
          booking_agency: bookingAgency.trim() || null,
          booking_agent: bookingAgent.trim() || null,
          management_company: managementCompany.trim() || null,
          publicist: publicist.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artist.id);
    }
    setSaving(false);
    return true;
  };

  const saveManagerProfile = async () => {
    setSaving(true);
    if (user?.id) {
      await supabase
        .from('users')
        .update({
          full_name: managerName.trim() || null,
          role: managerRole.trim() || user?.role || 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
    setSaving(false);
    return true;
  };

  const handleNext = async () => {
    let success = true;

    if (step === 2) success = await saveArtistBasics();
    if (step === 3) success = await savePlatforms();
    if (step === 4) success = await saveTouring();
    if (step === 5) success = await saveManagerProfile();

    if (!success) return;

    const stepKey = `step_${step}`;
    const nextStep = step + 1;

    await saveProgress(nextStep, stepKey);

    if (nextStep > TOTAL_STEPS) {
      onComplete();
    } else {
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = async () => {
    const nextStep = step + 1;
    await saveProgress(nextStep);
    if (nextStep > TOTAL_STEPS) {
      onComplete();
    } else {
      setStep(nextStep);
    }
  };

  /* ── Input helper ── */
  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border-2)',
    color: 'var(--t1)',
    padding: '10px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 600,
    color: 'var(--t3)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    display: 'block',
  };

  const Field = ({ label, value, onChange, placeholder, type = 'text', required = false }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
  }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );

  const TextArea = ({ label, value, onChange, placeholder, rows = 3 }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
  }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle, resize: 'vertical' as const }}
      />
    </div>
  );

  /* ── Step progress bar ── */
  const ProgressBar = () => (
    <div className="flex items-center gap-1" style={{ marginBottom: '32px' }}>
      {STEP_META.map((s) => (
        <div key={s.num} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full"
            style={{
              height: '2px',
              background: step >= s.num ? 'var(--brand-1)' : 'var(--border-2)',
              transition: 'background 0.3s',
            }}
          />
          <span style={{
            fontSize: '8px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: step >= s.num ? 'var(--brand-1)' : 'var(--t3)',
          }}>
            {s.title}
          </span>
        </div>
      ))}
    </div>
  );

  /* ── Render steps ── */
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-lg mx-auto px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/The Manager_Logo_PNG-2.png"
            alt="The Manager"
            className="h-6 object-contain invert"
          />
        </div>

        <ProgressBar />

        {/* Step content */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            padding: '32px',
          }}
        >
          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center">
              <img
                src="/TM-Icono-negro.png"
                alt=""
                className="w-16 h-16 mx-auto mb-6 object-contain"
                style={{ filter: 'invert(1)', opacity: 0.8 }}
              />
              <h2 style={{ color: 'var(--t1)', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Welcome to The Manager
              </h2>
              <p style={{ color: 'var(--t3)', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px' }}>
                Let's set up your workspace. We'll walk you through a few steps to configure your artist profile, connect your platforms, and personalize your experience. You can always come back to complete this later from Settings.
              </p>
            </div>
          )}

          {/* ── STEP 2: Artist basics ── */}
          {step === 2 && (
            <div>
              <h2 style={{ color: 'var(--t1)', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                Your Artist
              </h2>
              <p style={{ color: 'var(--t3)', fontSize: '12px', marginBottom: '24px' }}>
                Basic information about the artist you manage.
              </p>

              {error && (
                <div style={{ background: 'var(--status-red-bg)', border: '1px solid var(--status-red)', color: 'var(--status-red)', padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              <Field label="Artist / Band name" value={artistName} onChange={setArtistName} placeholder="e.g. Bad Bunny" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Genre" value={artistGenre} onChange={setArtistGenre} placeholder="e.g. Latin, Pop" />
                <Field label="Label" value={artistLabel} onChange={setArtistLabel} placeholder="e.g. Rimas Entertainment" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Country" value={artistCountry} onChange={setArtistCountry} placeholder="e.g. Puerto Rico" />
                <Field label="City" value={artistCity} onChange={setArtistCity} placeholder="e.g. San Juan" />
              </div>
              <TextArea label="Bio" value={artistBio} onChange={setArtistBio} placeholder="Short artist biography..." />
            </div>
          )}

          {/* ── STEP 3: Streaming & Social ── */}
          {step === 3 && (
            <div>
              <h2 style={{ color: 'var(--t1)', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                Streaming & Social
              </h2>
              <p style={{ color: 'var(--t3)', fontSize: '12px', marginBottom: '24px' }}>
                Connect your artist's profiles. Paste the full URL for each platform.
              </p>

              <Field label="Spotify" value={spotifyUrl} onChange={setSpotifyUrl} placeholder="https://open.spotify.com/artist/..." />
              <Field label="Apple Music" value={appleMusicUrl} onChange={setAppleMusicUrl} placeholder="https://music.apple.com/artist/..." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Instagram" value={instagramUrl} onChange={setInstagramUrl} placeholder="https://instagram.com/..." />
                <Field label="TikTok" value={tiktokUrl} onChange={setTiktokUrl} placeholder="https://tiktok.com/@..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="YouTube" value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/@..." />
                <Field label="X / Twitter" value={twitterUrl} onChange={setTwitterUrl} placeholder="https://x.com/..." />
              </div>
              <Field label="Website" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://..." />
            </div>
          )}

          {/* ── STEP 4: Touring ── */}
          {step === 4 && (
            <div>
              <h2 style={{ color: 'var(--t1)', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                Touring & Live
              </h2>
              <p style={{ color: 'var(--t3)', fontSize: '12px', marginBottom: '24px' }}>
                Touring profiles and team contacts.
              </p>

              <Field label="Bandsintown" value={bandsintownUrl} onChange={setBandsintownUrl} placeholder="https://bandsintown.com/artist/..." />
              <Field label="Songkick" value={songkickUrl} onChange={setSongkickUrl} placeholder="https://songkick.com/artists/..." />
              <div style={{ height: '1px', background: 'var(--border)', margin: '20px 0' }} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Booking Agency" value={bookingAgency} onChange={setBookingAgency} placeholder="e.g. CAA, WME" />
                <Field label="Booking Agent" value={bookingAgent} onChange={setBookingAgent} placeholder="Agent name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Management Company" value={managementCompany} onChange={setManagementCompany} placeholder="Company name" />
                <Field label="Publicist" value={publicist} onChange={setPublicist} placeholder="Publicist name" />
              </div>
            </div>
          )}

          {/* ── STEP 5: Manager Profile ── */}
          {step === 5 && (
            <div>
              <h2 style={{ color: 'var(--t1)', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                Your Profile
              </h2>
              <p style={{ color: 'var(--t3)', fontSize: '12px', marginBottom: '24px' }}>
                Tell us about yourself.
              </p>

              <Field label="Full Name" value={managerName} onChange={setManagerName} placeholder="Your name" />
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Your Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Artist Manager', 'Tour Manager', 'Day-to-Day Manager', 'Business Manager', 'Label Rep', 'Other'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setManagerRole(role)}
                      className="text-left transition-all"
                      style={{
                        padding: '10px 12px',
                        fontSize: '12px',
                        background: managerRole === role ? 'rgba(0,156,85,0.1)' : 'var(--surface-2)',
                        border: `1px solid ${managerRole === role ? 'var(--brand-1)' : 'var(--border-2)'}`,
                        color: managerRole === role ? 'var(--brand-1)' : 'var(--t2)',
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="flex items-center justify-between mt-5">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: 'var(--t3)', fontSize: '12px' }}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step > 1 && step < TOTAL_STEPS && (
              <button
                onClick={handleSkip}
                className="transition-opacity hover:opacity-80"
                style={{ color: 'var(--t3)', fontSize: '12px' }}
              >
                Skip for now
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-6 py-2.5"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === TOTAL_STEPS ? (
                <>
                  <img src="/The Manager_Iconografia-11.svg" className="pxi-md icon-white" alt="" />
                  Finish Setup
                </>
              ) : (
                <>
                  {step === 1 ? "Let's go" : 'Continue'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
