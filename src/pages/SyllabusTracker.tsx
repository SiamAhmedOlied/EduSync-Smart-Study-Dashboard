import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { Plus, Edit, Trash2, BookOpen, CheckCircle, Circle } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  completed: boolean;
}

interface Syllabus {
  id: string;
  course_name: string;
  topics: Topic[];
  progress: number;
  created_at: string;
  updated_at: string;
}

const SyllabusTracker: React.FC = () => {
  const { user } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    course_name: '',
    topics: [] as Topic[]
  });

  const [newTopicName, setNewTopicName] = useState('');

  useEffect(() => {
    if (user) {
      fetchSyllabi();
    }
  }, [user]);

  useEffect(() => {
    gsap.fromTo('.syllabus-card',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
    );
  }, [syllabi]);

  const fetchSyllabi = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('syllabus')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch syllabi',
        variant: 'destructive'
      });
    } else {
      const formattedData = data?.map(item => ({
        ...item,
        topics: (item.topics as any) || []
      })) || [];
      setSyllabi(formattedData);
    }
    setLoading(false);
  };

  const calculateProgress = (topics: Topic[]) => {
    if (topics.length === 0) return 0;
    const completedCount = topics.filter(topic => topic.completed).length;
    return Math.round((completedCount / topics.length) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const progress = calculateProgress(formData.topics);
    const syllabusData = {
      ...formData,
      topics: formData.topics as any,
      progress,
      user_id: user.id
    };

    let error;
    if (editingSyllabus) {
      const { error: updateError } = await supabase
        .from('syllabus')
        .update(syllabusData)
        .eq('id', editingSyllabus.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('syllabus')
        .insert(syllabusData);
      error = insertError;
    }

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingSyllabus ? 'update' : 'create'} syllabus`,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `Syllabus ${editingSyllabus ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      resetForm();
      fetchSyllabi();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('syllabus')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete syllabus',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Syllabus deleted successfully'
      });
      fetchSyllabi();
    }
  };

  const handleTopicToggle = async (syllabusId: string, topicId: string) => {
    const syllabus = syllabi.find(s => s.id === syllabusId);
    if (!syllabus) return;

    const updatedTopics = syllabus.topics.map(topic =>
      topic.id === topicId ? { ...topic, completed: !topic.completed } : topic
    );

    const progress = calculateProgress(updatedTopics);

    const { error } = await supabase
      .from('syllabus')
      .update({ 
        topics: updatedTopics as any, 
        progress 
      })
      .eq('id', syllabusId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update topic',
        variant: 'destructive'
      });
    } else {
      // Update local state
      setSyllabi(prev => prev.map(s => 
        s.id === syllabusId 
          ? { ...s, topics: updatedTopics, progress }
          : s
      ));

      // Animate the progress change
      gsap.fromTo(`[data-syllabus-id="${syllabusId}"] .progress-bar`,
        { scaleX: syllabus.progress / 100 },
        { scaleX: progress / 100, duration: 0.5, ease: 'power2.out' }
      );
    }
  };

  const resetForm = () => {
    setFormData({
      course_name: '',
      topics: []
    });
    setEditingSyllabus(null);
    setNewTopicName('');
  };

  const openEditDialog = (syllabus: Syllabus) => {
    setEditingSyllabus(syllabus);
    setFormData({
      course_name: syllabus.course_name,
      topics: syllabus.topics || []
    });
    setIsDialogOpen(true);
  };

  const addTopic = () => {
    if (newTopicName.trim()) {
      const newTopic: Topic = {
        id: crypto.randomUUID(),
        name: newTopicName.trim(),
        completed: false
      };
      setFormData({
        ...formData,
        topics: [...formData.topics, newTopic]
      });
      setNewTopicName('');
    }
  };

  const removeTopic = (topicId: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(topic => topic.id !== topicId)
    });
  };

  const toggleTopicInForm = (topicId: string) => {
    setFormData({
      ...formData,
      topics: formData.topics.map(topic =>
        topic.id === topicId ? { ...topic, completed: !topic.completed } : topic
      )
    });
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
          <h1 className="text-3xl font-bold">Syllabus Tracker</h1>
          <p className="text-muted-foreground">Track your course progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Syllabus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSyllabus ? 'Edit Syllabus' : 'Add New Syllabus'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="course_name">Course Name</Label>
                <Input
                  id="course_name"
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Topics</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Add a topic..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  />
                  <Button type="button" onClick={addTopic}>
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.topics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={topic.completed}
                          onCheckedChange={() => toggleTopicInForm(topic.id)}
                        />
                        <span className={topic.completed ? 'line-through text-muted-foreground' : ''}>
                          {topic.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTopic(topic.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {formData.topics.length > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">
                      Progress: {calculateProgress(formData.topics)}% 
                      ({formData.topics.filter(t => t.completed).length}/{formData.topics.length} completed)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSyllabus ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {syllabi.map((syllabus) => (
          <Card key={syllabus.id} className="syllabus-card" data-syllabus-id={syllabus.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {syllabus.course_name}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(syllabus)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(syllabus.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{syllabus.progress}%</span>
                </div>
                <Progress value={syllabus.progress} className="progress-bar" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {syllabus.topics && syllabus.topics.length > 0 ? (
                  syllabus.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => handleTopicToggle(syllabus.id, topic.id)}
                    >
                      {topic.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={topic.completed ? 'line-through text-muted-foreground' : ''}>
                        {topic.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No topics added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {syllabi.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-2">No syllabi yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first syllabus to start tracking your course progress
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Syllabus
          </Button>
        </div>
      )}
    </div>
  );
};

export default SyllabusTracker;