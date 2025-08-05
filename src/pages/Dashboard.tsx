import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { gsap } from 'gsap';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Target, 
  TrendingUp,
  Plus
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalStudyTime: number;
  completedGoals: number;
  totalGoals: number;
  upcomingExams: number;
  syllabusProgress: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudyTime: 0,
    completedGoals: 0,
    totalGoals: 0,
    upcomingExams: 0,
    syllabusProgress: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [todayRoutines, setTodayRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    // Animate dashboard cards
    gsap.fromTo('.dashboard-card',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
  }, [loading]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch study sessions for total time
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('user_id', user.id);

      const totalStudyTime = sessions?.reduce((acc, session) => acc + session.duration, 0) || 0;

      // Fetch goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      const completedGoals = goals?.filter(goal => goal.progress >= goal.target).length || 0;

      // Fetch upcoming exams
      const today = new Date().toISOString().split('T')[0];
      const { data: exams } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today)
        .limit(5);

      // Fetch syllabus progress
      const { data: syllabus } = await supabase
        .from('syllabus')
        .select('progress')
        .eq('user_id', user.id);

      const avgProgress = syllabus?.length > 0 
        ? syllabus.reduce((acc, s) => acc + s.progress, 0) / syllabus.length 
        : 0;

      // Fetch today's routines
      const dayOfWeek = new Date().getDay();
      const { data: routines } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_of_week', dayOfWeek)
        .order('start_time');

      setStats({
        totalStudyTime: Math.round(totalStudyTime / 60), // Convert to hours
        completedGoals,
        totalGoals: goals?.length || 0,
        upcomingExams: exams?.length || 0,
        syllabusProgress: Math.round(avgProgress)
      });

      setTodayRoutines(routines || []);

      // Fetch recent activity (recent study sessions, notes, etc.)
      const { data: recentSessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      setRecentActivity(recentSessions || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your study overview.</p>
        </div>
        <Button onClick={() => navigate('/routine')}>
          <Plus className="mr-2 h-4 w-4" />
          Quick Add
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudyTime}h</div>
            <p className="text-xs text-muted-foreground">
              Total study time
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedGoals}/{stats.totalGoals}
            </div>
            <p className="text-xs text-muted-foreground">
              Goals completed
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingExams}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syllabus Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.syllabusProgress}%</div>
            <Progress value={stats.syllabusProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Routine */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayRoutines.length > 0 ? (
                todayRoutines.map((routine) => (
                  <div key={routine.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{routine.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {routine.start_time} - {routine.end_time}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {routine.start_time}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No routines scheduled for today</p>
                  <Button variant="outline" className="mt-2" onClick={() => navigate('/routine')}>
                    Add Routine
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">
                        {activity.type === 'study' ? 'Study Session' : activity.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.subject && `${activity.subject} • `}
                        {formatTime(activity.duration)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {format(new Date(activity.timestamp), 'MMM dd')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No recent activity</p>
                  <Button variant="outline" className="mt-2" onClick={() => navigate('/timer')}>
                    Start Studying
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;