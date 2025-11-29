import { useState } from "react";
import { Box, Button, Paper, Typography, CircularProgress } from "@mui/material";
import aiClient from "@shared/services/ai/client";
import { useAuth } from "@shared/context/AuthContext";

type Tip = {
	field: string;
	issue?: string;
	tip: string;
	example?: string;
};

type Props = {
	// Profile object from parent (partial shape allowed)
	profile?: Record<string, any>;
};

export default function GenerateProfileTips({ profile }: Props) {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [tips, setTips] = useState<Tip[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleGenerate() {
		setError(null);
		setLoading(true);
		setTips(null);
		try {
			// Only send headline and bio per request
			const payload = {
				headline: (profile as any)?.headline ?? null,
				bio: (profile as any)?.bio ?? null,
			};

			const data = await aiClient.postJson<{ tips?: Tip[] }>(
				"/api/generate/profile-tips",
				payload,
				user?.id
			);

			setTips(Array.isArray(data?.tips) ? data.tips : null);
		} catch (e: any) {
			setError(e?.message ?? "Generation failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: "100%" }}>
			<Button
				variant="contained"
				color="primary"
				onClick={handleGenerate}
				disabled={loading}
				size="medium"
				sx={{ minWidth: 180 }}
			>
				{loading ? (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<CircularProgress size={18} color="inherit" />
						<span>Generating…</span>
					</Box>
				) : (
					"Generate profile tips"
				)}
			</Button>

			{error && (
				<Typography role="alert" color="error" sx={{ mt: 1, mr: 1 }}>
					{error}
				</Typography>
			)}

			{tips && tips.length > 0 && (
				<Paper elevation={1} sx={{ mt: 2, width: "100%", p: 2 }}>
					<Typography variant="h6" sx={{ mb: 1 }}>
						Profile tips
					</Typography>
					<Box component="ul" sx={{ pl: 2, m: 0 }}>
						{tips.map((t, i) => (
							<Box component="li" key={i} sx={{ mb: 1 }}>
								<Typography variant="subtitle2">
									{t.field}
									{t.issue ? ` — ${t.issue}` : ""}
								</Typography>
								<Typography variant="body2">{t.tip}</Typography>
								{t.example && (
									<Typography variant="caption" sx={{ color: "text.secondary" }}>
										{t.example}
									</Typography>
								)}
							</Box>
						))}
					</Box>
				</Paper>
			)}
		</Box>
	);
}
