import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';

interface Routine {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  day_of_week: number;
}

const SmartRoutine: React.FC = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    start_time: '',
    end_time: '',
    description: '',
    day_of_week: 0
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (user) {
      fetchRoutines();
    }
  }, [user]);

  useEffect(() => {
    gsap.fromTo('.routine-card',
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
    );
  }, [routines]);

  const fetchRoutines = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch routines',
        variant: 'destructive'
      });
    } else {
      setRoutines(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const routineData = {
      ...formData,
      user_id: user.id
    };

    let error;
    if (editingRoutine) {
      const { error: updateError } = await supabase
        .from('routines')
        .update(routineData)
        .eq('id', editingRoutine.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('routines')
        .insert(routineData);
      error = insertError;
    }

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingRoutine ? 'update' : 'create'} routine`,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `Routine ${editingRoutine ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      resetForm();
      fetchRoutines();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete routine',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Routine deleted successfully'
      });
      fetchRoutines();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      start_time: '',
      end_time: '',
      description: '',
      day_of_week: 0
    });
    setEditingRoutine(null);
  };

  const openEditDialog = (routine: Routine) => {
    setEditingRoutine(routine);
    setFormData({
      title: routine.title,
      start_time: routine.start_time,
      end_time: routine.end_time,
      description: routine.description,
      day_of_week: routine.day_of_week
    });
    setIsDialogOpen(true);
  };

  const groupedRoutines = routines.reduce((acc, routine) => {
    const day = routine.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(routine);
    return acc;
  }, {} as Record<number, Routine[]>);

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
          <h1 className="text-3xl font-bold">Smart Routine</h1>
          <p className="text-muted-foreground">Organize your daily schedule</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Routine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRoutine ? 'Edit Routine' : 'Add New Routine'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="day_of_week">Day of Week</Label>
                <Select value={formData.day_of_week.toString()} onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRoutine ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dayNames.map((dayName, dayIndex) => (
          <Card key={dayIndex} className="routine-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {dayName}
                <Badge variant="secondary" className="ml-auto">
                  {groupedRoutines[dayIndex]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupedRoutines[dayIndex]?.map((routine) => (
                  <div
                    key={routine.id}
                    className="p-3 bg-muted rounded-lg border group hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{routine.title}</h4>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(routine)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(routine.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {routine.start_time} - {routine.end_time}
                    </p>
                    {routine.description && (
                      <p className="text-xs text-muted-foreground">
                        {routine.description}
                      </p>
                    )}
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No routines scheduled
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SmartRoutine;