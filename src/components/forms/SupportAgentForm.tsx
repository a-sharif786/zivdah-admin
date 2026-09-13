import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import type { CreateSupportAgentRequest } from '@/types/conversation';

/**
 * "Add Agent" is CRUD over the support_agents roster (see the plan's architecture
 * decisions — agents are ADMIN users flagged in this roster, not a new role), so this
 * picks an existing ADMIN user rather than registering a new account.
 */
export function SupportAgentForm({
  onSubmit,
  submitting,
  existingUserIds,
}: {
  onSubmit: (payload: CreateSupportAgentRequest) => void;
  submitting?: boolean;
  existingUserIds: number[];
}) {
  const [userId, setUserId] = useState<number | ''>('');
  const [displayName, setDisplayName] = useState('');
  const [maxConcurrentChats, setMaxConcurrentChats] = useState(5);
  const [touched, setTouched] = useState(false);

  const { data: users } = useQuery({ queryKey: ['all-users'], queryFn: authApi.getAllUsers });

  const candidates = (users ?? []).filter(
    (u) => u.role === 'ADMIN' && u.active && !existingUserIds.includes(u.userId)
  );

  useEffect(() => {
    const selected = candidates.find((u) => u.userId === userId);
    if (selected && !displayName) setDisplayName(selected.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const missingUser = !userId;
  const missingName = !displayName.trim();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (missingUser || missingName || !userId) return;
    onSubmit({ userId, displayName: displayName.trim(), maxConcurrentChats });
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2.25} sx={{ pt: 1 }}>
      <TextField
        select
        label="User (ADMIN account)"
        value={userId}
        onChange={(e) => setUserId(Number(e.target.value))}
        fullWidth
      >
        {candidates.map((u) => (
          <MenuItem key={u.userId} value={u.userId}>
            {u.name} ({u.email})
          </MenuItem>
        ))}
      </TextField>
      {touched && missingUser && (
        <Typography variant="caption" color="error">
          Choose a user to make an agent
        </Typography>
      )}

      <TextField
        label="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        fullWidth
      />
      {touched && missingName && (
        <Typography variant="caption" color="error">
          Display name is required
        </Typography>
      )}

      <TextField
        label="Max concurrent chats"
        type="number"
        value={maxConcurrentChats}
        onChange={(e) => setMaxConcurrentChats(Math.max(1, Number(e.target.value) || 1))}
        fullWidth
      />

      <Button type="submit" variant="contained" size="large" loading={submitting}>
        Add Agent
      </Button>
    </Stack>
  );
}
