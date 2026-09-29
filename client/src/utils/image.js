// 画像ファイルを base64 文字列に変換するユーティリティ

// File オブジェクトを { base64, mediaType } に変換する
// base64 は data URI のプレフィックス（data:image/png;base64,）を除いた純粋なデータ
export function fileToBase64(file) {
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
