export async function exportCanvasAsPng(
  svgElement: SVGSVGElement,
  fileName: string = 'system-design-architecture.png',
  isDark: boolean = false
): Promise<void> {
  try {
    const bbox = svgElement.getBBox();
    const padding = 50;
    const width = Math.max(1280, bbox.width + padding * 2);
    const height = Math.max(800, bbox.height + padding * 2);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // 2x for Retina sharpness
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(2, 2);

      // Clean background matching theme
      ctx.fillStyle = isDark ? '#0f0f11' : '#fbfbfa';
      ctx.fillRect(0, 0, width, height);

      // Draw faint grid dots
      ctx.fillStyle = isDark ? '#27272a' : '#e5e7eb';
      for (let x = 0; x < width; x += 24) {
        for (let y = 0; y < height; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.drawImage(image, 0, 0, width, height);

      // Watermark / footer
      ctx.font = '500 12px "Inter", sans-serif';
      ctx.fillStyle = isDark ? '#71717a' : '#9ca3af';
      ctx.fillText('Generated with SysDesign Simulator', 24, height - 20);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobURL);
    };

    image.src = blobURL;
  } catch (err) {
    console.error('Export PNG failed:', err);
  }
}

export function exportCanvasAsSvg(
  svgElement: SVGSVGElement,
  fileName: string = 'system-design-architecture.svg'
): void {
  try {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export SVG failed:', err);
  }
}
