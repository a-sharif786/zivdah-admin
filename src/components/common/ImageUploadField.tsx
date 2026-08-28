import { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';

export function ImageUploadField({
  existingImageUrl,
  onFileSelected,
}: {
  existingImageUrl?: string | null;
  onFileSelected: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | undefined>(existingImageUrl ?? undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(existingImageUrl ?? undefined);
  }, [existingImageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Box>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleChange} />
      <ButtonBase
        onClick={() => inputRef.current?.click()}
        sx={{
          width: 96,
          height: 96,
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {preview ? (
          <Box component="img" src={preview} alt="preview" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <AddPhotoAlternateOutlinedIcon color="action" />
            <Typography variant="caption" color="text.secondary">
              Upload
            </Typography>
          </>
        )}
      </ButtonBase>
    </Box>
  );
}
