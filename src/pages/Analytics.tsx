import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, Users, Eye, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, subDays, isAfter } from 'date-fns';

interface PageView {
  id: string;
  page_path: string;
  country: string | null;
  city: string | null;
  region: string | null;
  created_at: string;
}

interface Stats {
  totalViews: number;
  uniqueSessions: number;
  topPages: { page: string; views: number }[];
  topCountries: { country: string; views: number }[];
  topStates: { state: string; views: number }[];
  viewsToday: number;
  viewsLastWeek: number;
  viewsLastMonth: number;
  viewsAllTime: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const Analytics = () => {
  const [stats, setStats] = useState<Stats>({
    totalViews: 0,
    uniqueSessions: 0,
    topPages: [],
    topCountries: [],
    topStates: [],
    viewsToday: 0,
    viewsLastWeek: 0,
    viewsLastMonth: 0,
    viewsAllTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: pageViews, error } = await supabase
          .from('page_views')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (pageViews) {
          // Calculate stats
          const totalViews = pageViews.length;
          const uniqueSessions = new Set(pageViews.map((pv: PageView) => pv.id)).size;

          // Calculate time-based views
          const now = new Date();
          const todayStart = startOfDay(now);
          const weekStart = startOfWeek(subDays(now, 7));
          const monthStart = startOfMonth(subDays(now, 30));

          const viewsToday = pageViews.filter((pv: PageView) => 
            isAfter(new Date(pv.created_at), todayStart)
          ).length;

          const viewsLastWeek = pageViews.filter((pv: PageView) => 
            isAfter(new Date(pv.created_at), weekStart)
          ).length;

          const viewsLastMonth = pageViews.filter((pv: PageView) => 
            isAfter(new Date(pv.created_at), monthStart)
          ).length;

          const viewsAllTime = pageViews.length;

          // Top pages
          const pageCount: Record<string, number> = {};
          pageViews.forEach((pv: PageView) => {
            pageCount[pv.page_path] = (pageCount[pv.page_path] || 0) + 1;
          });
          const topPages = Object.entries(pageCount)
            .map(([page, views]) => ({ page, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

          // Top countries
          const countryCount: Record<string, number> = {};
          pageViews.forEach((pv: PageView) => {
            if (pv.country) {
              countryCount[pv.country] = (countryCount[pv.country] || 0) + 1;
            }
          });
          const topCountries = Object.entries(countryCount)
            .map(([country, views]) => ({ country, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

          // Top US states
          const stateCount: Record<string, number> = {};
          pageViews.forEach((pv: PageView) => {
            if (pv.region && pv.country === 'United States') {
              stateCount[pv.region] = (stateCount[pv.region] || 0) + 1;
            }
          });
          const topStates = Object.entries(stateCount)
            .map(([state, views]) => ({ state, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

          setStats({
            totalViews,
            uniqueSessions,
            topPages,
            topCountries,
            topStates,
            viewsToday,
            viewsLastWeek,
            viewsLastMonth,
            viewsAllTime,
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Analytics Dashboard</h1>

        {/* Time-based Views */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.viewsToday}</div>
              <p className="text-xs text-muted-foreground">views today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.viewsLastWeek}</div>
              <p className="text-xs text-muted-foreground">views last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.viewsLastMonth}</div>
              <p className="text-xs text-muted-foreground">views last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">All Time</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.viewsAllTime}</div>
              <p className="text-xs text-muted-foreground">total views</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topCountries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pages Tracked</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topPages.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Pages Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topPages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="page" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Countries Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Visitors by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.topCountries}
                    dataKey="views"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.topCountries.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* US States Chart */}
        {stats.topStates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Visitors by US State</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.topStates} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--foreground))" />
                  <YAxis dataKey="state" type="category" stroke="hsl(var(--foreground))" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;
