import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import ContactDetailsDialog from "../ContactDetails/ContactDetailsDialog";
import * as db from "@shared/services/dbMappers";
import type { Result } from "@shared/services/types";
import { useAuth } from "@shared/context/AuthContext";

type Node = {
    id: string;
    name: string;
    depth: number;
};

type Link = {
    source: string;
    target: string;
};

export default function MutualsGraph({ contactId }: { contactId?: string | null }) {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<any | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (!user) {
                    setContacts([]);
                    setLoading(false);
                    return;
                }

                const res: Result<unknown[]> = await db.listContacts(user.id, { order: { column: 'first_name', ascending: true } });
                const rows = !res.error && res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                const list = rows as any[];

                // If the selected contact isn't in the user's contact list (e.g. viewing non-saved contact), fetch it directly
                if (contactId && !list.find((c) => String(c.id) === String(contactId))) {
                    const cres = await db.getContact(user.id, String(contactId));
                    if (!cres.error && cres.data) {
                        list.push(cres.data as any);
                    }
                }

                setContacts(list);
            } catch (err) {
                console.error('Failed to load contacts for graph', err);
                setContacts([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [contactId, user]);

    const { nodes, links } = useMemo(() => {
        if (!contactId || contacts.length === 0) return { nodes: [] as Node[], links: [] as Link[] };

        const byId = new Map<string, any>(contacts.map((c) => [String(c.id), c]));

        const seen = new Set<string>();
        const nodesOut: Node[] = [];
        const linksOut: Link[] = [];

        const startId = String(contactId);
        const start = byId.get(startId);
        if (!start) return { nodes: [], links: [] };

        const nodeFor = (id: string, depth: number) => {
            if (!seen.has(id)) {
                seen.add(id);
                const c = byId.get(id) || { id, first_name: 'Unknown', last_name: '' };
                const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || 'Unnamed';
                nodesOut.push({ id, name, depth });
            }
        };

        nodeFor(startId, 0);

        const existing = start.mutual_contacts ?? start.mutual_contact_ids ?? [];
        const mutualIds = Array.isArray(existing) ? existing.map(String) : [];

        // depth 1
        mutualIds.forEach((mid) => {
            nodeFor(mid, 1);
            linksOut.push({ source: startId, target: mid });
        });

        // depth 2: mutuals of mutuals
        mutualIds.forEach((mid) => {
            const m = byId.get(mid);
            if (!m) return;
            const mExisting = m.mutual_contacts ?? m.mutual_contact_ids ?? [];
            const mIds = Array.isArray(mExisting) ? mExisting.map(String) : [];
            mIds.forEach((mm) => {
                if (mm === startId) return; // skip back to start
                nodeFor(mm, 2);
                linksOut.push({ source: mid, target: mm });
            });
        });

        // also add links between depth1 mutuals if they list each other
        const depth1 = nodesOut.filter((n) => n.depth === 1).map((n) => n.id);
        depth1.forEach((a) => {
            const ca = byId.get(a);
            if (!ca) return;
            const aExisting = ca.mutual_contacts ?? ca.mutual_contact_ids ?? [];
            const aIds = Array.isArray(aExisting) ? aExisting.map(String) : [];
            aIds.forEach((b) => {
                if (depth1.includes(b)) {
                    // avoid duplicate
                    const exists = linksOut.some((l) => (l.source === a && l.target === b) || (l.source === b && l.target === a));
                    if (!exists) linksOut.push({ source: a, target: b });
                }
            });
        });

        return { nodes: nodesOut, links: linksOut };
    }, [contactId, contacts]);

    const width = 520;
    const height = 320;

    // simple radial layout based on depth
    // simple top-down tree layout based on depth
    const positions = useMemo(() => {
        const pos = new Map<string, { x: number; y: number }>();
        if (nodes.length === 0) return pos;

        const levelSpacing = 120; // vertical space between depths
        const nodeSpacing = 100;  // horizontal spacing between siblings

        const groups = new Map<number, Node[]>();
        nodes.forEach(n => {
            const arr = groups.get(n.depth) ?? [];
            arr.push(n);
            groups.set(n.depth, arr);
        });

        groups.forEach((group, depth) => {
            const y = 40 + depth * levelSpacing;
            const totalWidth = (group.length - 1) * nodeSpacing;

            group.forEach((node, i) => {
                const x = width / 2 - totalWidth / 2 + i * nodeSpacing;
                pos.set(node.id, { x, y });
            });
        });

        return pos;
    }, [nodes]);


    if (!contactId) {
        return <Typography color="textSecondary">Select a contact to see mutuals graph.</Typography>;
    }

    if (loading) return <Typography>Loading graph…</Typography>;

    if (nodes.length === 0) return <Typography color="textSecondary">No mutuals to display.</Typography>;

    const handleNodeClick = async (id: string) => {
        // find contact in loaded list; if missing, try fetching
        let c = contacts.find((x) => String(x.id) === String(id));
        if (!c && user) {
            try {
                const cres = await db.getContact(user.id, String(id));
                if (!cres.error && cres.data) c = cres.data as any;
            } catch (err) {
                console.error('Failed to fetch contact', err);
            }
        }
        if (c) {
            setSelectedContact(c);
            setDialogOpen(true);
        }
    };

    return (
        <Box sx={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 1, p: 1, mt: 2 }}>
            <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
                {/* links */}
                {links.map((l, idx) => {
                    const a = positions.get(l.source);
                    const b = positions.get(l.target);
                    if (!a || !b) return null;
                    return (
                        <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9e9e9e" strokeWidth={1} opacity={0.9} />
                    );
                })}

                {/* nodes */}
                {nodes.map((n) => {
                    const p = positions.get(n.id) || { x: 0, y: 0 };
                    const radius = n.depth === 0 ? 18 : n.depth === 1 ? 12 : 9;
                    const fill = n.depth === 0 ? '#1976d2' : n.depth === 1 ? '#4caf50' : '#ff9800';
                    return (
                        <g key={n.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleNodeClick(n.id)}>
                            <circle r={radius} fill={fill} stroke="#fff" strokeWidth={1.5} />
                            <title>{n.name}</title>
                            <text x={radius + 6} y={4} fontSize={12} fill="#222">{n.name}</text>
                        </g>
                    );
                })}
            </svg>
            <ContactDetailsDialog
                open={dialogOpen}
                contact={selectedContact}
                onClose={() => { setDialogOpen(false); setSelectedContact(null); }}
                onRefresh={async () => {
                    // refresh contacts list when dialog triggers refresh
                    if (user) {
                        const res: Result<unknown[]> = await db.listContacts(user.id, { order: { column: 'first_name', ascending: true } });
                        const rows = !res.error && res.data ? (Array.isArray(res.data) ? res.data : [res.data]) : [];
                        setContacts(rows as any[]);
                    }
                }}
            />
        </Box>
    );
}
