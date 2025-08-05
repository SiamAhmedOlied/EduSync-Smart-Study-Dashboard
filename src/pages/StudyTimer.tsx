import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { Play, Pause, Square, RotateCcw, Timer as TimerIcon } from 'lucide-react';

interface TimerSettings {
  studyDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface SessionData {
  duration: number;
  type: string;
  subject?: string;
}

const StudyTimer: React.FC = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [currentSession, setCurrentSession] = useState<'study' | 'break' | 'longBreak'>('study');
  const [sessionCount, setSessionCount] = useState(0);
  const [subject, setSubject] = useState('');
  
  const [settings, setSettings] = useState<TimerSettings>({
    studyDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  });

  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    // Update circle animation
    if (circleRef.current) {
      const totalTime = getCurrentSessionDuration() * 60;
      const progress = (totalTime - timeLeft) / totalTime;
      const circumference = 2 * Math.PI * 90; // radius = 90
      const strokeDashoffset = circumference - (progress * circumference);
      
      gsap.to(circleRef.current, {
        strokeDashoffset,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }, [timeLeft, currentSession]);

  const fetchRecentSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setRecentSessions(data || []);
    }
  };

  const getCurrentSessionDuration = () => {
    switch (currentSession) {
      case 'study':
        return settings.studyDuration;
      case 'break':
        return settings.breakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
      default:
        return settings.studyDuration;
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    
    // Animate timer start
    gsap.fromTo('.timer-circle',
      { scale: 1 },
      { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 }
    );
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(getCurrentSessionDuration() * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(getCurrentSessionDuration() * 60);
    setCurrentSession('study');
    setSessionCount(0);
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    setIsPaused(false);

    // Save session to database
    if (currentSession === 'study' && user) {
      const sessionData: SessionData = {
        duration: settings.studyDuration,
        type: 'study',
        subject: subject || undefined
      };

      const { error } = await supabase
        .from('study_sessions')
        .insert({
          ...sessionData,
          user_id: user.id
        });

      if (error) {
        console.error('Error saving session:', error);
      } else {
        fetchRecentSessions();
      }
    }

    // Determine next session type
    if (currentSession === 'study') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
        setCurrentSession('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setCurrentSession('break');
        setTimeLeft(settings.breakDuration * 60);
      }
    } else {
      setCurrentSession('study');
      setTimeLeft(settings.studyDuration * 60);
    }

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: `${currentSession === 'study' ? 'Study' : 'Break'} session finished.`,
        icon: '/favicon.ico'
      });
    }

    toast({
      title: 'Session Complete!',
      description: `${currentSession === 'study' ? 'Study' : 'Break'} session finished.`
    });

    // Animate completion
    gsap.fromTo('.timer-circle',
      { scale: 1 },
      { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 }
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const circumference = 2 * Math.PI * 90;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Smart Study Timer</h1>
          <p className="text-muted-foreground">Pomodoro technique for focused studying</p>
        </div>
        <Badge variant={currentSession === 'study' ? 'default' : 'secondary'} className="text-sm">
          {currentSession === 'study' ? 'Study Time' : currentSession === 'break' ? 'Short Break' : 'Long Break'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Circular Timer */}
              <div className="relative">
                <svg className="timer-circle w-64 h-64 transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted-foreground/20"
                  />
                  <circle
                    ref={circleRef}
                    cx="100"
                    cy="100"
                    r="90"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    className="text-primary transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Session {sessionCount + 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Input */}
              {currentSession === 'study' && (
                <div className="w-full max-w-xs">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What are you studying?"
                    disabled={isRunning}
                  />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4">
                {!isRunning ? (
                  <Button size="lg" onClick={handleStart} className="px-8">
                    <Play className="mr-2 h-5 w-5" />
                    Start
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" onClick={handlePause} className="px-8">
                    <Pause className="mr-2 h-5 w-5" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
                
                <Button size="lg" variant="outline" onClick={handleStop}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
                
                <Button size="lg" variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings & Stats */}
        <div className="space-y-6">
          {/* Timer Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TimerIcon className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="study">Study Duration (min)</Label>
                <Select
                  value={settings.studyDuration.toString()}
                  onValueChange={(value) => setSettings({ ...settings, studyDuration: parseInt(value) })}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="25">25 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="break">Break Duration (min)</Label>
                <Select
                  value={settings.breakDuration.toString()}
                  onValueChange={(value) => setSettings({ ...settings, breakDuration: parseInt(value) })}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="longBreak">Long Break (min)</Label>
                <Select
                  value={settings.longBreakDuration.toString()}
                  onValueChange={(value) => setSettings({ ...settings, longBreakDuration: parseInt(value) })}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentSessions.length > 0 ? (
                  recentSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">
                          {session.subject || 'Study Session'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatDuration(session.duration)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sessions yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;