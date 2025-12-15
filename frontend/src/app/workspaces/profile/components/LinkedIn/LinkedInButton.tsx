import React, { useState } from 'react';
import { Button } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
// using supabase client directly for OAuth start
import { supabase } from '@shared/services/supabaseClient';

type Props = {
	fullWidth?: boolean;
	sx?: any;
};

const LinkedInButton: React.FC<Props> = ({ fullWidth = true, sx }) => {
	// intentionally using supabase.auth.signInWithOAuth directly below
	const [loading, setLoading] = useState(false);

	const handleClick = async () => {
		setLoading(true);
		try {
			// Increment our internal API quota counter for LinkedIn usage.
			// Do this before redirecting so we account for the attempted call.
			try {
				const { data: existing, error: selErr } = await supabase
					.from('api_quotas')
					.select('current_usage')
					.eq('service_name', 'linkedin')
					.single();

				if (selErr && selErr.code !== 'PGRST116') {
					// Unexpected error reading quota — log and continue
					console.warn('Failed reading linkedin quota:', selErr.message || selErr);
				} else {
					const current = (existing && (existing as any).current_usage) ?? 0;
					const newUsage = current + 1;
					// Try update first
					const { error: updErr } = await supabase
						.from('api_quotas')
						.update({ current_usage: newUsage, last_reset_at: new Date().toISOString() })
						.eq('service_name', 'linkedin');
					if (updErr) {
						// If update failed (row may not exist), try insert/upsert
						const { error: insErr } = await supabase.from('api_quotas').upsert({
							service_name: 'linkedin',
							display_name: 'LinkedIn',
							monthly_limit: null,
							current_usage: newUsage,
							reset_period: 'never',
							last_reset_at: new Date().toISOString(),
						});
						if (insErr) console.warn('Failed inserting linkedin quota row:', insErr.message || insErr);
					}
				}
			} catch (quotaErr) {
				console.warn('Error incrementing linkedin quota:', quotaErr);
			}
			// Minimal sign-in call per Supabase docs — keep simple for testing
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'linkedin_oidc',
				options: { redirectTo: `${window.location.origin}/auth/callback` },
			});

			if (error) {
				console.error('Supabase OAuth start error:', error);
				return;
			}

			if (data?.url) {
				window.location.assign(data.url);
				return;
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			onClick={handleClick}
			variant="outlined"
			color="secondary"
			fullWidth={fullWidth}
			disabled={loading}
			sx={sx}
		>
			<LinkedInIcon sx={{ mr: 1 }} />
			{loading ? 'Redirecting...' : 'Sign in with LinkedIn'}
		</Button>
	);
};

export default LinkedInButton;