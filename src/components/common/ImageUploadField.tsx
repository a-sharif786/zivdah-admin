import { Upload, Image } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { UploadFile, UploadProps } from 'antd';

export function ImageUploadField({
  existingImageUrl,
  onFileSelected,
}: {
  existingImageUrl?: string | null;
  onFileSelected: (file: File | null) => void;
}) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [preview, setPreview] = useState<string | undefined>(existingImageUrl ?? undefined);

  useEffect(() => {
    setPreview(existingImageUrl ?? undefined);
  }, [existingImageUrl]);

  const handleChange: UploadProps['onChange'] = ({ fileList: newList }) => {
    setFileList(newList.slice(-1));
    const file = newList[newList.length - 1]?.originFileObj as File | undefined;
    if (file) {
      onFileSelected(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      <Upload
        listType="picture-card"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleChange}
        maxCount={1}
        showUploadList={false}
      >
        {preview ? (
          <Image src={preview} alt="preview" width={90} height={90} style={{ objectFit: 'cover' }} preview={false} />
        ) : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </div>
        )}
      </Upload>
    </div>
  );
}
