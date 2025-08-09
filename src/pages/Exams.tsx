import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { Plus, Edit, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';

interface Exam {
  id: string;
  subject: string;
  date: string;
  time?: string | null;
  location?: string | null;
  reminders: any;
  created_at: string;
  updated_at: string;
}

const Exams: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    subject: '',
    date: '',
    time: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      fetchExams();
    }
  }, [user]);

  const fetchExams = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id)
      .order('date');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch exams',
        variant: 'destructive'
      });
    } else {
      setExams(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const examData = {
      ...formData,
      user_id: user.id,
      reminders: []
    };

    let error;
    if (editingExam) {
      const { error: updateError } = await supabase
        .from('exams')
        .update(examData)
        .eq('id', editingExam.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('exams')
        .insert(examData);
      error = insertError;
    }

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingExam ? 'update' : 'create'} exam`,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `Exam ${editingExam ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      resetForm();
      fetchExams();
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      date: '',
      time: '',
      location: ''
    });
    setEditingExam(null);
  };

  const getExamPriority = (examDate: string) => {
    const date = new Date(examDate);
    if (isToday(date)) return { label: 'Today', variant: 'destructive' as const };
    if (isTomorrow(date)) return { label: 'Tomorrow', variant: 'default' as const };
    if (isThisWeek(date)) return { label: 'This Week', variant: 'secondary' as const };
    return { label: 'Upcoming', variant: 'outline' as const };
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exam Scheduler</h1>
          <p className="text-muted-foreground">Track your upcoming exams</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExam ? 'Edit Exam' : 'Add New Exam'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Room number, building, etc."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingExam ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => {
          const priority = getExamPriority(exam.date);
          return (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{exam.subject}</CardTitle>
                  <Badge variant={priority.variant}>{priority.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(exam.date), 'PPP')}
                </div>
                {exam.time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {exam.time}
                  </div>
                )}
                {exam.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {exam.location}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {exams.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-2">No exams scheduled</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Exam
          </Button>
        </div>
      )}
    </div>
  );
};

export default Exams;