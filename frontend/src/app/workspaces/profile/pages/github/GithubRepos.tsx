import { useState, useEffect } from 'react';
import { supabase } from '@shared/services/supabaseClient';
import { useAuth } from '@shared/context/AuthContext';
import { useConfirmDialog } from '@shared/hooks/useConfirmDialog';

// MUI Imports
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControlLabel,
  Checkbox,
  Link,
  Stack,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';

// Icons
import StarIcon from '@mui/icons-material/Star';
import GitHubIcon from '@mui/icons-material/GitHub';
import SyncIcon from '@mui/icons-material/Sync';
import CodeIcon from '@mui/icons-material/Code';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HistoryIcon from '@mui/icons-material/History'; // Added for "Last Push"

// Minimal local repo type
type Repo = {
  id: number;
  created_at: string;
  user_id: string | null;
  name: string | null;
  full_name: string | null;
  description: string | null;
  html_url: string | null;
  language: string | null;
  stargazers_count: number | null;
  forks_count: number | null;
  pushed_at: string | null; // GitHub's last push time
  is_featured: boolean | null;
  updated_at: string | null; // DB's last sync time
};

export default function GithubRepos() {
  const { session } = useAuth();
  
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { confirm } = useConfirmDialog();

  // 1. Fetch Repos from DB
  const fetchRepos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('stargazers_count', { ascending: false }); // Sort by popularity

      if (error) throw error;
      if (data) setRepos(data);
    } catch (err) {
      console.error('Error loading repos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  // 2. Sync Logic
  const triggerSync = async (token: string) => {
    if (syncing) return;
    setSyncing(true);
    console.log("Starting GitHub Sync...");

    // Best-effort: increment GitHub API usage counter so quotas reflect the upcoming sync.
    try {
      const { data: existing, error: selErr } = await supabase
        .from('api_quotas')
        .select('current_usage')
        .eq('service_name', 'github')
        .single();

      if (selErr && selErr.code !== 'PGRST116') {
        console.warn('Failed reading github quota:', selErr.message || selErr);
      } else {
        const current = (existing && (existing as any).current_usage) ?? 0;
        const newUsage = current + 1;
        const { error: updErr } = await supabase
          .from('api_quotas')
          .update({ current_usage: newUsage, last_reset_at: new Date().toISOString() })
          .eq('service_name', 'github');

        if (updErr) {
          const { error: insErr } = await supabase.from('api_quotas').upsert({
            service_name: 'github',
            display_name: 'GitHub',
            monthly_limit: null,
            current_usage: newUsage,
            reset_period: 'never',
            last_reset_at: new Date().toISOString(),
          });
          if (insErr) console.warn('Failed inserting github quota row:', insErr.message || insErr);
        }
      }
    } catch (e) {
      console.warn('Error incrementing github quota:', e);
    }

    try {
      const { error } = await supabase.functions.invoke('sync-repos', {
        body: { provider_token: token }
      });

      if (error) throw error;

      console.log("Sync successful!");
      await fetchRepos();
      await confirm({
        title: 'Sync Complete',
        message: 'Repositories synced successfully!',
        confirmText: 'OK',
        confirmColor: 'primary',
      });
    } catch (error) {
      console.error('Sync Error:', error);
      await confirm({
        title: 'Sync Failed',
        message: 'Repositories failed to sync. Check console for details.',
        confirmText: 'OK',
        confirmColor: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  // 3. Auto-Sync
  useEffect(() => {
    if (session?.provider_token) {
      if (repos.length === 0 && !loading) {
         triggerSync(session.provider_token);
      }
    }
  }, [session, loading, repos.length]); 

  const handleSyncClick = async () => {
    const providerToken = session?.provider_token;
    if (providerToken) {
      await triggerSync(providerToken);
    } else {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { scopes: 'read:user public_repo', redirectTo: window.location.href }
      });
    }
  };

  // 4. Toggle Featured
  const toggleFeatured = async (id: number, currentStatus: boolean | null) => {
    // Optimistic UI Update
    setRepos(prev => prev.map(r => r.id === id ? { ...r, is_featured: !currentStatus } : r));

    const { error } = await supabase
      .from('repositories')
      .update({ is_featured: !currentStatus })
      .eq('id', id);

    if (error) {
        console.error('Update failed:', error);
        fetchRepos(); // Revert
    }
  };

  // Helper to format dates cleanly
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 5. Computed Lists
  const featuredRepos = repos.filter(r => r.is_featured);
  const otherRepos = repos.filter(r => !r.is_featured);

  // --- Sub-Component for Rendering a Card ---
  const RepoCard = ({ repo, isHighlight = false }: { repo: Repo, isHighlight?: boolean }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.2s',
        borderColor: isHighlight ? 'primary.main' : 'divider',
        borderWidth: isHighlight ? 2 : 1,
        bgcolor: isHighlight ? '#f0f7ff' : 'background.paper',
        '&:hover': { 
          boxShadow: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Link 
            href={repo.html_url || '#'} 
            target="_blank" 
            rel="noopener" 
            underline="hover" 
            color="text.primary"
            sx={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {isHighlight ? <AutoAwesomeIcon fontSize="small" color="primary" /> : <GitHubIcon fontSize="small" />}
            {repo.name}
          </Link>
          <Chip 
            icon={<StarIcon sx={{ fontSize: '16px !important' }} />} 
            label={repo.stargazers_count} 
            size="small" 
            color={isHighlight ? "primary" : "default"}
            variant={isHighlight ? "filled" : "outlined"} 
          />
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
          {repo.description || "No description available."}
        </Typography>

        {/* Timestamps Section */}
        <Box sx={{ bgcolor: isHighlight ? 'rgba(255,255,255,0.6)' : 'action.hover', p: 1, borderRadius: 1, mb: 2 }}>
            <Stack spacing={0.5}>
                {/* Last Push Date (Important) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                    <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Last Push: {formatDate(repo.pushed_at)}
                    </Typography>
                </Box>
                
                {/* Last Sync Date (Meta-data) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.disabled' }}>
                    <SyncIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                        Synced: {formatDate(repo.updated_at)}
                    </Typography>
                </Box>
            </Stack>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Footer */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {repo.language && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                <CodeIcon fontSize="inherit" />
                {repo.language}
              </Box>
            )}
          </Box>

          <FormControlLabel
            control={
              <Checkbox 
                checked={!!repo.is_featured}
                onChange={() => toggleFeatured(repo.id, repo.is_featured)}
                size="small"
                color="primary"
              />
            }
            label={<Typography variant="caption">Feature</Typography>}
          />
        </Stack>
      </CardContent>
    </Card>
  );

  // --- Main Render ---
  if (loading && repos.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h2" fontWeight="bold">
          My Repositories
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="medium"
          startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          onClick={handleSyncClick}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync GitHub'}
        </Button>
      </Box>

      {/* SECTION 1: Featured Repositories */}
      {featuredRepos.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Featured Projects
            </Typography>
          </Stack>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3 
          }}>
            {featuredRepos.map(repo => (
              <RepoCard key={repo.id} repo={repo} isHighlight={true} />
            ))}
          </Box>
        </Box>
      )}

      {/* SECTION 2: Other Repositories */}
      <Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          {featuredRepos.length > 0 ? "Other Repositories" : "All Repositories"}
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, 
          gap: 3 
        }}>
          {otherRepos.map(repo => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </Box>

        {repos.length === 0 && !loading && (
          <Paper variant="outlined" sx={{ textAlign: 'center', py: 6, color: 'text.secondary', borderStyle: 'dashed' }}>
            <GitHubIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
            <Typography>No repositories found. Click "Sync GitHub" to import your projects.</Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}