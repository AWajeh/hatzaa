import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

function loadFont() {
  return fs.readFileSync(path.join(process.cwd(), "assets", "fonts", "NotoSansHebrew-Bold-Static.ttf"));
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4c7cf0",
          borderRadius: 7,
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "Noto",
        }}
      >
        ה
      </div>
    ),
    { ...size, fonts: [{ name: "Noto", data: loadFont(), style: "normal" }] }
  );
}
