import React, { useState, useEffect } from 'react';
import { supabase } from '@shared/services/supabaseClient';

// MUI Imports
import {
  Box,
  Typography,
  Stack,
  LinearProgress,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

// Type Definition
interface ApiQuota {
  service_name: string;
  display_name: string;
  monthly_limit: number | null;
  current_usage: number;
  reset_period: 'daily_utc' | 'hourly' | 'never';
  last_reset_at: string | null;
  status_text: string | null;
}

export default function DevApiStatus() {
  const [quotas, setQuotas] = useState<ApiQuota[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. SAFETY CHECK: Only run in Development
  const isDev = import.meta.env.DEV || import.meta.env.APP_ENV === 'development';

  if (!isDev) return null;

  // 2. Fetch Data
  const fetchUsage = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_quotas')
        .select('*')
        .order('service_name');

      if (error) throw error;
      if (data) setQuotas(data as ApiQuota[]);
    } catch (err) {
      console.error('Error fetching API quotas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // 3. Logic for "Stale" Data
  const getRealUsage = (service: ApiQuota): number => {
    if (!service.last_reset_at) return service.current_usage;
    const lastReset = new Date(service.last_reset_at);
    const now = new Date();
    
    if (service.reset_period === 'hourly') {
      const isSameHour = lastReset.getUTCHours() === now.getUTCHours() &&
                         lastReset.getUTCDate() === now.getUTCDate();
      if (!isSameHour) return 0;
    }
    
    if (service.reset_period === 'daily_utc') {
      const isSameDay = lastReset.getUTCDate() === now.getUTCDate() &&
                        lastReset.getUTCMonth() === now.getUTCMonth();
      if (!isSameDay) return 0;
    }
    return service.current_usage;
  };

  const getStatusColor = (percentage: number): "primary" | "warning" | "error" | "success" => {
    if (percentage >= 90) return "error";
    if (percentage >= 75) return "warning";
    return "primary";
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      
      {/* Internal Toolbar (Refresh Button) */}
      <Stack direction="row" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh Quotas">
          <IconButton onClick={fetchUsage} size="small" disabled={loading}>
            <RefreshIcon fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Main Content List */}
      <Stack spacing={3}>
        {quotas.length === 0 && !loading && (
          <Alert severity="warning">
            No quotas found. Check your 'api_quotas' table.
          </Alert>
        )}

        {loading && quotas.length === 0 && (
           <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
           </Box>
        )}

        {quotas.map((service) => {
          const usage = getRealUsage(service);
          const limit = service.monthly_limit || 0;
          const percentage = limit > 0 ? Math.min((usage / limit) * 100, 100) : 0;
          const isTextOnly = !!service.status_text;

          return (
            <Box key={service.service_name}>
              {/* Service Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" fontWeight={600}>
                  {service.display_name}
                </Typography>
                {!isTextOnly && (
                  <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                    {usage.toLocaleString()} / {limit.toLocaleString()}
                  </Typography>
                )}
              </Stack>

              {/* Status Display */}
              {isTextOnly ? (
                // Text Mode (OpenAI)
                <Chip 
                  icon={service.service_name === 'openai' ? <CheckCircleIcon /> : <BoltIcon />}
                  label={service.status_text}
                  size="small"
                  color={service.service_name === 'openai' ? "success" : "default"}
                  variant="outlined"
                  sx={{ width: '100%', justifyContent: 'flex-start', px: 1 }}
                />
              ) : (
                // Bar Mode (Github/LinkedIn)
                <Box>
                  <Tooltip 
                    title={`Resets: ${service.reset_period === 'hourly' ? 'Hourly' : 'Daily (UTC)'}`} 
                    placement="top"
                    arrow
                  >
                    <LinearProgress 
                      variant="determinate" 
                      value={percentage} 
                      color={getStatusColor(percentage)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Tooltip>
                  
                  {/* Warning Label */}
                  {percentage > 90 && (
                    <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                      <ReportProblemIcon color="error" sx={{ fontSize: 12 }} />
                      <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
                        Limit Reached
                      </Typography>
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>

      {/* Animation Style */}
      <style>
        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
      </style>
    </Box>
  );
}