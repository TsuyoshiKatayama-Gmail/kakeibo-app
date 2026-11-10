// 画像ファイルを base64 文字列に変換するユーティリティ

// アップロード前に画像を縮小する最大の長辺（px）。
// レシートの文字が読める十分な解像度を保ちつつ、入力トークンと通信量を減らして
// 解析を速くする。スマホ写真はそのままだと 3000px 超で無駄に重い。
const MAX_EDGE = 1280;
// 縮小後に書き出す JPEG 品質（0〜1）。文字が読めれば十分なので圧縮する。
const JPEG_QUALITY = 0.85;

// File オブジェクトを { base64, mediaType } に変換する。
// 大きい画像は MAX_EDGE に収まるよう縮小し、JPEG に再エンコードして軽量化する。
// base64 は data URI のプレフィックス（data:image/jpeg;base64,）を除いた純粋なデータ。
export async function fileToBase64(file) {
  try {
    const { base64, mediaType } = await downscaleToBase64(file);
    return { base64, mediaType };
  } catch {
    // 縮小に失敗した場合（未対応形式など）は元画像をそのまま送るフォールバック
    return readAsBase64(file);
  }
}

// 画像を縮小して JPEG の base64 にする（Canvas を利用）
function downscaleToBase64(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas を利用できません"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}

// 縮小せずそのまま base64 化する（フォールバック用）
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result; // "data:image/png;base64,XXXX"
      const base64 = String(result).split(",")[1];
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
