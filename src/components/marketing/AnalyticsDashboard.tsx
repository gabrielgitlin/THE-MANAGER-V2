import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { getYouTubeIntegration, getYouTubeChannelAnalytics, getYouTubeVideoAnalytics } from '../../lib/youtubeAnalytics';
import { supabase } from '../../lib/supabase';
import { 
  BarChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { ArrowDown, ArrowUp, Calendar, Download, Filter, Globe, Instagram, Music, RefreshCw, Share2, AlignJustify as Spotify, TrendingUp, Twitter, Youtube } from 'lucide-react';

// Mock data for streaming platforms
const STREAMING_DATA = {
  overview: {
    totalStreams: 12453789,
    monthlyListeners: 2345678,
    topTrack: 'Stairway to Heaven',
    topTrackStreams: 3456789,
    growthRate: 12.5,
    playlists: 1245,
    followers: 987654
  },
  platforms: {
    spotify: 7654321,
    appleMusic: 2345678,
    amazonMusic: 1234567,
    youtubeMusic: 987654,
    deezer: 456789,
    tidal: 234567
  },
  history: [
    { date: '2024-01', spotify: 650000, appleMusic: 230000, amazonMusic: 120000, youtubeMusic: 95000, deezer: 45000, tidal: 25000 },
    { date: '2024-02', spotify: 680000, appleMusic: 240000, amazonMusic: 125000, youtubeMusic: 98000, deezer: 46000, tidal: 26000 },
    { date: '2024-03', spotify: 700000, appleMusic: 245000, amazonMusic: 128000, youtubeMusic: 100000, deezer: 47000, tidal: 27000 },
    { date: '2024-04', spotify: 720000, appleMusic: 250000, amazonMusic: 130000, youtubeMusic: 102000, deezer: 48000, tidal: 28000 },
    { date: '2024-05', spotify: 750000, appleMusic: 255000, amazonMusic: 132000, youtubeMusic: 105000, deezer: 49000, tidal: 29000 },
    { date: '2024-06', spotify: 780000, appleMusic: 260000, amazonMusic: 135000, youtubeMusic: 108000, deezer: 50000, tidal: 30000 }
  ],
  topTracks: [
    { name: 'Stairway to Heaven', streams: 3456789, growth: 5.2 },
    { name: 'Whole Lotta Love', streams: 2345678, growth: 3.8 },
    { name: 'Black Dog', streams: 1987654, growth: 4.5 },
    { name: 'Immigrant Song', streams: 1876543, growth: 6.7 },
    { name: 'Kashmir', streams: 1765432, growth: 2.9 }
  ],
  demographics: {
    age: [
      { name: '18-24', value: 25 },
      { name: '25-34', value: 35 },
      { name: '35-44', value: 20 },
      { name: '45-54', value: 15 },
      { name: '55+', value: 5 }
    ],
    gender: [
      { name: 'Male', value: 65 },
      { name: 'Female', value: 32 },
      { name: 'Non-binary', value: 3 }
    ],
    countries: [
      { name: 'United States', value: 45 },
      { name: 'United Kingdom', value: 15 },
      { name: 'Germany', value: 8 },
      { name: 'Canada', value: 7 },
      { name: 'Australia', value: 5 },
      { name: 'Other', value: 20 }
    ]
  },
  playlists: {
    editorial: 245,
    algorithmic: 780,
    user: 220,
    total: 1245,
    topPlaylists: [
      { name: 'Rock Classics', followers: 5600000, platform: 'Spotify' },
      { name: 'All-Time Rock Anthems', followers: 3400000, platform: 'Spotify' },
      { name: '70s Rock Essentials', followers: 2800000, platform: 'Apple Music' },
      { name: 'Classic Rock Drive', followers: 2100000, platform: 'Spotify' },
      { name: 'Guitar Legends', followers: 1900000, platform: 'Amazon Music' }
    ]
  }
};

// Mock data for social media
const SOCIAL_MEDIA_DATA = {
  overview: {
    totalFollowers: 15678900,
    engagement: 3.2,
    growth: 5.7,
    posts: 1245,
    mentions: 34567
  },
  platforms: {
    instagram: 5678900,
    twitter: 3456700,
    facebook: 4567800,
    youtube: 1234500,
    tiktok: 741000
  },
  history: [
    { date: '2024-01', instagram: 5400000, twitter: 3300000, facebook: 4400000, youtube: 1150000, tiktok: 700000 },
    { date: '2024-02', instagram: 5450000, twitter: 3320000, facebook: 4420000, youtube: 1170000, tiktok: 710000 },
    { date: '2024-03', instagram: 5500000, twitter: 3350000, facebook: 4450000, youtube: 1190000, tiktok: 720000 },
    { date: '2024-04', instagram: 5550000, twitter: 3380000, facebook: 4480000, youtube: 1200000, tiktok: 725000 },
    { date: '2024-05', instagram: 5600000, twitter: 3420000, facebook: 4520000, youtube: 1220000, tiktok: 735000 },
    { date: '2024-06', instagram: 5678900, twitter: 3456700, facebook: 4567800, youtube: 1234500, tiktok: 741000 }
  ],
  engagement: [
    { date: '2024-01', instagram: 3.0, twitter: 2.1, facebook: 1.8, youtube: 4.5, tiktok: 5.2 },
    { date: '2024-02', instagram: 3.1, twitter: 2.0, facebook: 1.7, youtube: 4.6, tiktok: 5.3 },
    { date: '2024-03', instagram: 3.0, twitter: 2.2, facebook: 1.9, youtube: 4.7, tiktok: 5.4 },
    { date: '2024-04', instagram: 3.2, twitter: 2.3, facebook: 1.8, youtube: 4.8, tiktok: 5.5 },
    { date: '2024-05', instagram: 3.1, twitter: 2.2, facebook: 1.7, youtube: 4.9, tiktok: 5.6 },
    { date: '2024-06', instagram: 3.2, twitter: 2.3, facebook: 1.8, youtube: 5.0, tiktok: 5.7 }
  ],
  topPosts: [
    { 
      platform: 'Instagram', 
      date: '2024-06-15', 
      content: 'Throwback to the 1973 tour #LedZeppelin', 
      likes: 345678, 
      comments: 12345, 
      shares: 5678 
    },
    { 
      platform: 'Twitter', 
      date: '2024-06-10', 
      content: 'Celebrating 50 years of Houses of the Holy today!', 
      likes: 234567, 
      comments: 8765, 
      shares: 4567 
    },
    { 
      platform: 'YouTube', 
      date: '2024-05-30', 
      content: 'Stairway to Heaven (Remastered) - Official Video', 
      likes: 567890, 
      comments: 34567, 
      shares: 12345,
      views: 2345678
    },
    { 
      platform: 'TikTok', 
      date: '2024-05-25', 
      content: 'When the levee breaks #classicrock #ledzeppelin', 
      likes: 456789, 
      comments: 23456, 
      shares: 7890,
      views: 1234567
    },
    { 
      platform: 'Facebook', 
      date: '2024-05-20', 
      content: 'New merchandise available now! Link in bio.', 
      likes: 123456, 
      comments: 4567, 
      shares: 2345 
    }
  ],
  demographics: {
    age: [
      { name: '18-24', value: 20 },
      { name: '25-34', value: 30 },
      { name: '35-44', value: 25 },
      { name: '45-54', value: 15 },
      { name: '55+', value: 10 }
    ],
    gender: [
      { name: 'Male', value: 70 },
      { name: 'Female', value: 28 },
      { name: 'Non-binary', value: 2 }
    ],
    countries: [
      { name: 'United States', value: 40 },
      { name: 'United Kingdom', value: 18 },
      { name: 'Germany', value: 7 },
      { name: 'Canada', value: 6 },
      { name: 'Australia', value: 5 },
      { name: 'Other', value: 24 }
    ]
  }
};

// Colors for charts
const COLORS = {
  spotify: '#1DB954',
  appleMusic: '#FC3C44',
  amazonMusic: '#00A8E1',
  youtubeMusic: '#FF0000',
  deezer: '#00C7F2',
  tidal: '#000000',
  instagram: '#E1306C',
  twitter: '#1DA1F2',
  facebook: '#4267B2',
  youtube: '#FF0000',
  tiktok: '#000000'
};

const PLATFORM_COLORS = [
  '#1DB954', // Spotify
  '#FC3C44', // Apple Music
  '#00A8E1', // Amazon Music
  '#FF0000', // YouTube Music
  '#00C7F2', // Deezer
  '#000000'  // Tidal
];

const SOCIAL_COLORS = [
  '#E1306C', // Instagram
  '#1DA1F2', // Twitter
  '#4267B2', // Facebook
  '#FF0000', // YouTube
  '#000000'  // TikTok
];

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#83a6ed'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('6m');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('streaming');
  const [youtubeIntegration, setYoutubeIntegration] = useState<any>(null);
  const [youtubeChannelData, setYoutubeChannelData] = useState<any[]>([]);
  const [youtubeVideoData, setYoutubeVideoData] = useState<any[]>([]);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    loadYouTubeData();
  }, []);

  const loadYouTubeData = async () => {
    try {
      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (artist) {
        const integration = await getYouTubeIntegration(artist.id);
        if (integration && integration.enabled) {
          setYoutubeIntegration(integration);

          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const channelData = await getYouTubeChannelAnalytics(integration.id, startDate, endDate);
          const videoData = await getYouTubeVideoAnalytics(integration.id, 10);

          if (channelData.length > 0) {
            setYoutubeChannelData(channelData.reverse());
            setYoutubeVideoData(videoData);
            setHasRealData(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading YouTube data:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const getLatestYouTubeStats = () => {
    if (youtubeChannelData.length === 0) return null;
    return youtubeChannelData[youtubeChannelData.length - 1];
  };

  return (
    <div className="space-y-6">
      {hasRealData && youtubeIntegration && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800">YouTube Connected</h3>
              <p className="text-sm text-green-700 mt-1">
                Showing real-time data from {youtubeIntegration.platform_username}
              </p>
            </div>
            <Youtube className="w-6 h-6 text-green-600" />
          </div>
        </div>
      )}

      {!hasRealData && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Connect Your Analytics</h3>
              <p className="text-sm text-blue-700 mt-1">
                Connect your YouTube and other platforms in Settings to see real analytics data here
              </p>
            </div>
            <a href="/settings" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              Go to Settings
            </a>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Artist Analytics Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border rounded-md p-1">
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '1m' ? 'bg-primary text-white' : 'text-gray-600'}`}
              onClick={() => setTimeRange('1m')}
            >
              1M
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '3m' ? 'bg-primary text-white' : 'text-gray-600'}`}
              onClick={() => setTimeRange('3m')}
            >
              3M
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '6m' ? 'bg-primary text-white' : 'text-gray-600'}`}
              onClick={() => setTimeRange('6m')}
            >
              6M
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '1y' ? 'bg-primary text-white' : 'text-gray-600'}`}
              onClick={() => setTimeRange('1y')}
            >
              1Y
            </button>
          </div>
          <button 
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={handleRefresh}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="streaming" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            Streaming
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Social Media
          </TabsTrigger>
        </TabsList>

        {/* Streaming Analytics */}
        <TabsContent value="streaming" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Streams</p>
                    <h3 className="text-2xl font-bold mt-1">{formatNumber(STREAMING_DATA.overview.totalStreams)}</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>{STREAMING_DATA.overview.growthRate}%</span>
                      <span className="text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Listeners</p>
                    <h3 className="text-2xl font-bold mt-1">{formatNumber(STREAMING_DATA.overview.monthlyListeners)}</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>8.3%</span>
                      <span className="text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Playlist Inclusions</p>
                    <h3 className="text-2xl font-bold mt-1">{formatNumber(STREAMING_DATA.overview.playlists)}</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>12.1%</span>
                      <span className="text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 bg-light-blue rounded-lg">
                    <ListMusic className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Followers</p>
                    <h3 className="text-2xl font-bold mt-1">{formatNumber(STREAMING_DATA.overview.followers)}</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>4.7%</span>
                      <span className="text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 bg-light-blue rounded-lg">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Streams by Platform</CardTitle>
                <CardDescription>Distribution of streams across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(STREAMING_DATA.platforms).map(([key, value], index) => ({
                          name: key === 'appleMusic' ? 'Apple Music' : 
                                key === 'amazonMusic' ? 'Amazon Music' : 
                                key === 'youtubeMusic' ? 'YouTube Music' : 
                                key.charAt(0).toUpperCase() + key.slice(1),
                          value
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.entries(STREAMING_DATA.platforms).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Streaming Trends</CardTitle>
                <CardDescription>Monthly streams over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={STREAMING_DATA.history}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="spotify" stroke={COLORS.spotify} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="appleMusic" stroke={COLORS.appleMusic} />
                      <Line type="monotone" dataKey="amazonMusic" stroke={COLORS.amazonMusic} />
                      <Line type="monotone" dataKey="youtubeMusic" stroke={COLORS.youtubeMusic} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Tracks */}
          <Card>
            <CardHeader>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription>Most streamed tracks in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Track</th>
                      <th className="px-6 py-3">Streams</th>
                      <th className="px-6 py-3">Growth</th>
                      <th className="px-6 py-3">Spotify</th>
                      <th className="px-6 py-3">Apple Music</th>
                      <th className="px-6 py-3">Other</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STREAMING_DATA.topTracks.map((track, index) => (
                      <tr key={index} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{track.name}</td>
                        <td className="px-6 py-4">{formatNumber(track.streams)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <ArrowUp className="w-3 h-3 text-green-600 mr-1" />
                            <span className="text-green-600">{track.growth}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-[#1DB954] h-2.5 rounded-full" style={{ width: `${60 - index * 5}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-[#FC3C44] h-2.5 rounded-full" style={{ width: `${30 - index * 2}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-gray-600 h-2.5 rounded-full" style={{ width: `${10 + index}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Demographics and Playlists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Listener Demographics</CardTitle>
                <CardDescription>Breakdown of your audience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Age Distribution</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={STREAMING_DATA.demographics.age}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${value}%`} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Gender Distribution</h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={STREAMING_DATA.demographics.gender}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {STREAMING_DATA.demographics.gender.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Top Countries</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={STREAMING_DATA.demographics.countries}
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="value" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Playlist Insights</CardTitle>
                <CardDescription>Performance across playlists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Editorial</p>
                    <p className="text-xl font-bold text-gray-900">{STREAMING_DATA.playlists.editorial}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Algorithmic</p>
                    <p className="text-xl font-bold text-gray-900">{STREAMING_DATA.playlists.algorithmic}</p>
                  </div>
                  <div className="bg-light-blue p-4 rounded-lg">
                    <p className="text-sm text-gray-500">User</p>
                    <p className="text-xl font-bold text-gray-900">{STREAMING_DATA.playlists.user}</p>
                  </div>
                </div>

                <h4 className="text-sm font-medium mb-2">Top Playlists</h4>
                <div className="space-y-2">
                  {STREAMING_DATA.playlists.topPlaylists.map((playlist, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{playlist.name}</p>
                        <p className="text-xs text-gray-500">{playlist.platform}</p>
                      </div>
                      <p className="text-sm text-gray-700">{formatNumber(playlist.followers)} followers</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Media Analytics */}
        <TabsContent value="social" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Followers</p>
                    <h3 className="text-2xl font-bold mt-1">{formatNumber(SOCIAL_MEDIA_DATA.overview.totalFollowers)}</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>{SOCIAL_MEDIA_DATA.overview.growth}%</span>
                      <span className="text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                    <h3 className="text-2xl font-bold mt-1">{SOCIAL_MEDIA_DATA.overview.engagement}%</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>0.3%</span>
                      <span className="text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 bg-light-blue rounded-lg">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Posts</p>
                    <h3 className="text-2xl font-bold mt-1">{formatNumber(SOCIAL_MEDIA_DATA.overview.posts)}</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>12.3%</span>
                      <span className="text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 bg-light-blue rounded-lg">
                    <Image className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mentions</p>
                    <h3 className="text-2xl font-bold mt-1">{formatNumber(SOCIAL_MEDIA_DATA.overview.mentions)}</h3>
                    <div className="flex items-center mt-1 text-green-600 text-sm">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      <span>8.7%</span>
                      <span className="text-gray-500 ml-1">vs last period</span>
                    </div>
                  </div>
                  <div className="p-2 bg-beige rounded-lg">
                    <MessageCircle className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Followers by Platform</CardTitle>
                <CardDescription>Distribution of followers across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(SOCIAL_MEDIA_DATA.platforms).map(([key, value], index) => ({
                          name: key.charAt(0).toUpperCase() + key.slice(1),
                          value
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {Object.entries(SOCIAL_MEDIA_DATA.platforms).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SOCIAL_COLORS[index % SOCIAL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follower Growth</CardTitle>
                <CardDescription>Monthly followers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={SOCIAL_MEDIA_DATA.history}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={(value) => formatNumber(Number(value))} />
                      <Legend />
                      <Area type="monotone" dataKey="instagram" stackId="1" stroke={COLORS.instagram} fill={COLORS.instagram} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="twitter" stackId="1" stroke={COLORS.twitter} fill={COLORS.twitter} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="facebook" stackId="1" stroke={COLORS.facebook} fill={COLORS.facebook} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="youtube" stackId="1" stroke={COLORS.youtube} fill={COLORS.youtube} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="tiktok" stackId="1" stroke={COLORS.tiktok} fill={COLORS.tiktok} fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Rates</CardTitle>
              <CardDescription>Monthly engagement rates by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={SOCIAL_MEDIA_DATA.engagement}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="instagram" stroke={COLORS.instagram} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="twitter" stroke={COLORS.twitter} />
                    <Line type="monotone" dataKey="facebook" stroke={COLORS.facebook} />
                    <Line type="monotone" dataKey="youtube" stroke={COLORS.youtube} />
                    <Line type="monotone" dataKey="tiktok" stroke={COLORS.tiktok} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
              <CardDescription>Most engaging content in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SOCIAL_MEDIA_DATA.topPosts.map((post, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {post.platform === 'Instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                      {post.platform === 'Twitter' && <Twitter className="w-5 h-5 text-blue-400" />}
                      {post.platform === 'Facebook' && <Facebook className="w-5 h-5 text-blue-600" />}
                      {post.platform === 'YouTube' && <Youtube className="w-5 h-5 text-red-600" />}
                      {post.platform === 'TikTok' && <TikTok className="w-5 h-5" />}
                      <span className="font-medium">{post.platform}</span>
                      <span className="text-xs text-gray-500">{post.date}</span>
                    </div>
                    <p className="text-sm mb-3">{post.content}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{formatNumber(post.likes)} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{formatNumber(post.comments)} comments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        <span>{formatNumber(post.shares)} shares</span>
                      </div>
                      {post.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(post.views)} views</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>Audience Demographics</CardTitle>
              <CardDescription>Breakdown of your social media audience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Age Distribution</h4>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={SOCIAL_MEDIA_DATA.demographics.age}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `${value}%`} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Gender Distribution</h4>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={SOCIAL_MEDIA_DATA.demographics.gender}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {SOCIAL_MEDIA_DATA.demographics.gender.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Top Countries</h4>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={SOCIAL_MEDIA_DATA.demographics.countries}
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="value" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real YouTube Data Section */}
      {hasRealData && youtubeVideoData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              Your YouTube Videos
            </CardTitle>
            <CardDescription>Top performing videos from your channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {youtubeVideoData.map((video, index) => (
                <div key={video.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <Youtube className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-2">{video.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Published {new Date(video.published_at).toLocaleDateString()}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(video.views)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{formatNumber(video.likes)} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{formatNumber(video.comments)} comments</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Additional components for the dashboard
const Users = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
};

const ListMusic = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15V6" />
      <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M12 12H3" />
      <path d="M16 6H3" />
      <path d="M12 18H3" />
    </svg>
  );
};

const Heart = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
};

const Image = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
};

const MessageCircle = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
};

const Facebook = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
};

const TikTok = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
      <path d="M15 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M15 8v8a4 4 0 0 1-4 4" />
      <path d="M15 8h-4" />
    </svg>
  );
};

const Eye = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
};