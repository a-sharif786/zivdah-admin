import { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Typography, alpha } from '@mui/material';
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
        sx={(t) => ({
          position: 'relative',
          width: 128,
          height: 128,
          borderRadius: '16px',
          border: '2px dashed',
          borderColor: alpha(t.palette.primary.main, 0.35),
          backgroundColor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.08 : 0.04),
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0.75,
          transition: 'border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease',
          '&:hover': {
            borderColor: t.palette.primary.main,
            backgroundColor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.14 : 0.08),
            '& .upload-overlay': { opacity: 1 },
          },
          '&.Mui-focusVisible': { boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.25)}` },
        })}
      >
        {preview ? (
          <>
            <Box component="img" src={preview} alt="preview" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Hover hint that clicking replaces the image. */}
            <Box
              className="upload-overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                background: 'linear-gradient(180deg, rgba(15,23,42,0.25), rgba(15,23,42,0.65))',
                opacity: 0,
                transition: 'opacity 0.18s ease',
              }}
            >
              <AddPhotoAlternateOutlinedIcon fontSize="small" />
              Change
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={(t) => ({
                width: 42,
                height: 42,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                background: `linear-gradient(135deg, ${t.palette.primary.dark}, ${t.palette.primary.light})`,
                boxShadow: `0 6px 14px ${alpha(t.palette.primary.main, 0.35)}`,
              })}
            >
              <AddPhotoAlternateOutlinedIcon fontSize="small" />
            </Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              Upload image
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1 }}>Click to browse</Typography>
          </>
        )}
      </ButtonBase>
    </Box>
  );
}
