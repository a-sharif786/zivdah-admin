import { enqueueSnackbar } from 'notistack';

/**
 * Thin wrapper over notistack's standalone enqueueSnackbar (works from
 * anywhere once <SnackbarProvider> is mounted in ThemeRoot — no hook needed)
 * so call sites read the same as the old antd `message.success(...)`.
 */
export const notify = {
  success: (msg: string) => enqueueSnackbar(msg, { variant: 'success' }),
  error: (msg: string) => enqueueSnackbar(msg, { variant: 'error' }),
  info: (msg: string) => enqueueSnackbar(msg, { variant: 'info' }),
};
