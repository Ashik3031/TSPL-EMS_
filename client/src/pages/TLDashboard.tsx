import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, UserPlus, Trash2, Edit, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  photoUrl: string;
  teamId: string;
  activationTarget: number;
  activations: number;
  submissions: number;
  points: number;
}

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  photoUrl: z.string().url('Please enter a valid photo URL'),
  activationTarget: z.number().min(1, 'Target must be at least 1')
});

type CreateAgentData = z.infer<typeof createAgentSchema>;

export default function TLDashboard() {
  const { user } = useAuthStore();
  const { sendWithAuth } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const form = useForm<CreateAgentData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: '',
      photoUrl: '',
      activationTarget: 50
    }
  });

  const { data: agents = [], isLoading, error } = useQuery<Agent[]>({
    queryKey: ['/api/tl/agents'],
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ agentId, delta }: { agentId: string; delta: any }) => {
      const response = await apiRequest('PATCH', `/api/tl/agents/${agentId}/increment`, delta);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/leaderboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: async (agentData: CreateAgentData) => {
      const response = await apiRequest('POST', '/api/tl/agents', agentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/leaderboard'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Agent Created',
        description: 'New agent has been successfully added to your team',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await apiRequest('DELETE', `/api/tl/agents/${agentId}`, null);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/leaderboard'] });
      toast({
        title: 'Agent Deleted',
        description: 'Agent has been successfully removed from your team',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deletion Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleIncrement = (agentId: string, field: 'submissions' | 'activations' | 'points', delta: number) => {
    // Send via WebSocket for real-time updates
    sendWithAuth({
      type: 'tl:updateCounters',
      data: {
        agentId,
        delta: { [field]: delta }
      }
    });

    // Also update via REST API as backup
    updateMutation.mutate({
      agentId,
      delta: { [field]: delta }
    });
  };

  const calculateActivationPercent = (agent: Agent) => {
    return agent.activationTarget > 0 
      ? Math.round((agent.activations / agent.activationTarget) * 100)
      : 0;
  };

  const onCreateAgent = (data: CreateAgentData) => {
    createAgentMutation.mutate(data);
  };

  const onDeleteAgent = (agentId: string, agentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${agentName}? This action cannot be undone.`)) {
      deleteAgentMutation.mutate(agentId);
    }
  };

  const getTeamStats = () => {
    const totalActivations = agents.reduce((sum, agent) => sum + agent.activations, 0);
    const totalSubmissions = agents.reduce((sum, agent) => sum + agent.submissions, 0);
    const avgRate = agents.length > 0 
      ? Math.round(agents.reduce((sum, agent) => sum + calculateActivationPercent(agent), 0) / agents.length)
      : 0;

    return { totalActivations, totalSubmissions, avgRate };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access the TL Dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Dashboard</h1>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const teamStats = getTeamStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Team Leader Dashboard</h2>
          <p className="text-muted-foreground mt-2">Manage your team's performance metrics</p>
        </div>

        {/* Team Info Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'}
              alt="Team leader photo"
              className="w-16 h-16 rounded-full object-cover"
              data-testid="tl-photo"
            />
            <div>
              <h3 className="text-xl font-bold text-foreground" data-testid="tl-name">
                {user.name}
              </h3>
              <p className="text-muted-foreground">Team Leader</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-green-600 font-semibold" data-testid="team-total-activations">
                  {teamStats.totalActivations} Total Activations
                </span>
                <span className="text-blue-600 font-semibold" data-testid="team-total-submissions">
                  {teamStats.totalSubmissions} Total Submissions
                </span>
                <span className="text-purple-600 font-semibold" data-testid="team-avg-rate">
                  {teamStats.avgRate}% Avg Rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Agent Management
                </CardTitle>
                <CardDescription>
                  Create and manage agents on your team
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" data-testid="button-create-agent">
                    <UserPlus className="w-4 h-4" />
                    Add New Agent
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Agent</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onCreateAgent)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter agent name" data-testid="input-agent-name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="photoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Photo URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/photo.jpg" data-testid="input-agent-photo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="activationTarget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activation Target</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="50" 
                                data-testid="input-agent-target"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                          data-testid="button-cancel-agent"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createAgentMutation.isPending}
                          data-testid="button-save-agent"
                        >
                          {createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading agents...</p>
              </div>
            ) : agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={agent.photoUrl}
                        alt={`${agent.name} photo`}
                        className="w-12 h-12 rounded-full object-cover"
                        data-testid={`agent-photo-${agent.id}`}
                      />
                      <div>
                        <h4 className="font-semibold text-foreground" data-testid={`agent-name-${agent.id}`}>
                          {agent.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Target: <span data-testid={`agent-target-${agent.id}`}>{agent.activationTarget}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600" data-testid={`agent-submissions-${agent.id}`}>
                          {agent.submissions}
                        </div>
                        <div className="text-muted-foreground">Submissions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600" data-testid={`agent-activations-${agent.id}`}>
                          {agent.activations}
                        </div>
                        <div className="text-muted-foreground">Activations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600" data-testid={`agent-activation-percent-${agent.id}`}>
                          {calculateActivationPercent(agent)}%
                        </div>
                        <div className="text-muted-foreground">Rate</div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteAgent(agent.id, agent.name)}
                        disabled={deleteAgentMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-agent-${agent.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Agents Found</h3>
                <p className="text-muted-foreground mb-4">Start by creating your first agent to track their performance</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-agent">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Your First Agent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agents Performance Management Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Agent Performance Management</h3>
            <p className="text-sm text-muted-foreground">Update agent metrics with +/- buttons</p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading agents...</p>
            </div>
          ) : agents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Activations
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={agent.photoUrl}
                            alt={`${agent.name} photo`}
                            className="w-12 h-12 rounded-full object-cover mr-4"
                            data-testid={`agent-photo-${agent.id}`}
                          />
                          <div>
                            <div className="text-sm font-medium text-foreground" data-testid={`agent-name-${agent.id}`}>
                              {agent.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Target: <span data-testid={`agent-target-${agent.id}`}>{agent.activationTarget}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'submissions', -1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            data-testid={`decrement-submissions-${agent.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-lg font-semibold text-foreground min-w-[3rem]" data-testid={`agent-submissions-${agent.id}`}>
                            {agent.submissions}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'submissions', 1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            data-testid={`increment-submissions-${agent.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'activations', -1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            data-testid={`decrement-activations-${agent.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-lg font-semibold text-foreground min-w-[3rem]" data-testid={`agent-activations-${agent.id}`}>
                            {agent.activations}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'activations', 1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            data-testid={`increment-activations-${agent.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'points', -1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            data-testid={`decrement-points-${agent.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-lg font-semibold text-foreground min-w-[3rem]" data-testid={`agent-points-${agent.id}`}>
                            {agent.points.toLocaleString()}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'points', 1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            data-testid={`increment-points-${agent.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-lg font-bold text-green-600" data-testid={`agent-activation-percent-${agent.id}`}>
                            {calculateActivationPercent(agent)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">No Agents Found</h3>
              <p className="text-muted-foreground">Contact your administrator to add agents to your team</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
