import { useState, useEffect } from "react";
import { Box, TextField, Button, Stack, Checkbox, FormControlLabel } from "@mui/material";

type Props = {
    initialData?: Record<string, any> | null;
    onSave?: (payload: Record<string, unknown>) => Promise<void> | void;
};

export default function ContactEditTab({ initialData, onSave }: Props) {
    const [form, setForm] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm({
            first_name: initialData?.first_name ?? "",
            last_name: initialData?.last_name ?? "",
            email: initialData?.email ?? "",
            phone: initialData?.phone ?? "",
            company: initialData?.company ?? "",
            role: initialData?.role ?? "",
            industry: initialData?.industry ?? "",
            relationship_strength: initialData?.relationship_strength ?? undefined,
            is_professional_reference: initialData?.is_professional_reference ?? false,
            professional_notes: initialData?.professional_notes ?? "",
            personal_notes: initialData?.personal_notes ?? "",
        });
    }, [initialData]);

    const updateField = (k: string, v: any) => setForm((s) => ({ ...s, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.resolve(onSave?.(form) ?? Promise.resolve());
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField label="First name" value={form.first_name || ''} fullWidth onChange={(e) => updateField('first_name', e.target.value)} />
                    <TextField label="Last name" value={form.last_name || ''} fullWidth onChange={(e) => updateField('last_name', e.target.value)} />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField label="Email" value={form.email || ''} fullWidth onChange={(e) => updateField('email', e.target.value)} />
                    <TextField label="Phone" value={form.phone || ''} fullWidth onChange={(e) => updateField('phone', e.target.value)} />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField label="Company" value={form.company || ''} fullWidth onChange={(e) => updateField('company', e.target.value)} />
                    <TextField label="Role" value={form.role || ''} fullWidth onChange={(e) => updateField('role', e.target.value)} />
                </Stack>

                <Box>
                    <FormControlLabel
                        control={<Checkbox checked={Boolean(form.is_professional_reference)} onChange={(e) => updateField('is_professional_reference', e.target.checked)} />}
                        label="Professional Reference"
                    />
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField label="Industry" value={form.industry || ''} fullWidth onChange={(e) => updateField('industry', e.target.value)} />
                    <TextField label="Relationship strength" type="number" value={form.relationship_strength ?? ''} fullWidth onChange={(e) => updateField('relationship_strength', e.target.value ? Number(e.target.value) : undefined)} />
                </Stack>

                <Stack spacing={2}>
                    <TextField label="Professional notes" value={form.professional_notes || ''} fullWidth multiline minRows={3} onChange={(e) => updateField('professional_notes', e.target.value)} />
                    <TextField label="Personal notes" value={form.personal_notes || ''} fullWidth multiline minRows={3} onChange={(e) => updateField('personal_notes', e.target.value)} />
                </Stack>
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </Stack>
        </Box>
    );
}
