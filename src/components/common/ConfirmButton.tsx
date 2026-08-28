import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { ButtonProps } from '@mui/material';

/**
 * Replaces antd's inline <Popconfirm> — a click opens a confirmation dialog
 * instead of mutating immediately. Used for delete/deactivate/cancel/etc.
 */
export function ConfirmButton({
  onConfirm,
  title = 'Are you sure?',
  loading,
  children,
  color = 'primary',
  variant = 'outlined',
  size = 'small',
  startIcon,
}: {
  onConfirm: () => void;
  title?: string;
  loading?: boolean;
  children: ReactNode;
  color?: ButtonProps['color'];
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  startIcon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        color={color}
        variant={variant}
        size={size}
        startIcon={startIcon}
        loading={loading}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} onClick={(e) => e.stopPropagation()}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            color={color === 'error' ? 'error' : 'primary'}
            variant="contained"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function ConfirmDeleteButton({
  onConfirm,
  title = 'Are you sure you want to delete this?',
  loading,
  children,
}: {
  onConfirm: () => void;
  title?: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <ConfirmButton onConfirm={onConfirm} title={title} loading={loading} color="error" variant="outlined">
      {children ?? 'Delete'}
    </ConfirmButton>
  );
}
