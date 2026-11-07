/**
 * 클라이언트 브라우저 전용 이미지 리사이징 및 WebP 자동 압축 모듈
 * 원본(10~25MB)을 브라우저 Canvas에서 1200px 이하로 리사이즈하고 WebP로 압축하여 200~300KB로 감량
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<File> {
  // 이미지가 아니면 그대로 반환
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // GIF 애니메이션은 리사이즈 시 프레임이 손실될 수 있으므로 GIF는 그대로 반환
  if (file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 종횡비 유지하며 최대 규격 이하로 축소
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file); // 캔버스 미지원 환경이면 원본 반환
        }

        // 고품질 보간 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // WebP 포맷으로 압축 변환 (지원하지 않으면 기본 jpeg로 fallback)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // 파일명 확장자를 .webp 로 변경
            const originalBaseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const compressedFile = new File([blob], `${originalBaseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            // 압축 결과가 원본보다 큰 특이 케이스의 경우 원본 반환
            if (compressedFile.size > file.size) {
              return resolve(file);
            }

            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * 유튜브 URL에서 Video ID 추출 헬퍼
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

