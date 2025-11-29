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