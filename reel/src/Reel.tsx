import React from "react";
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
  continueRender, delayRender,
} from "remotion";

// Fuentes locales (el render no tiene acceso a Google Fonts)
const baloo = "Baloo";
const nunito = "Nunito";
const fontHandle = delayRender("fonts");
Promise.all([
  new FontFace(baloo, `url(${staticFile("baloo.woff2")})`, { weight: "800" }),
  new FontFace(nunito, `url(${staticFile("nunito-800.woff2")})`, { weight: "800" }),
  new FontFace(nunito, `url(${staticFile("nunito-900.woff2")})`, { weight: "900" }),
].map((f) => f.load().then((ff) => document.fonts.add(ff)))).then(() => continueRender(fontHandle));

const BLUE_DEEP = "#0a3849";
const YELLOW = "#ffc531";
const WA = "#25d366";
const FADE = 12;

const s = (sec: number) => Math.round(sec * 30);

// Foto horizontal en formato vertical: ocupa todo el alto y se desplaza (Ken Burns)
const PanPhoto: React.FC<{ src: string; dir?: 1 | -1; dur: number }> = ({ src, dir = 1, dur }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const scale = interpolate(t, [0, 1], [1.08, 1.18]);
  const x = interpolate(t, [0, 1], dir === 1 ? [-18, 18] : [18, -18]); // % del ancho sobrante
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: BLUE_DEEP }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute", height: "100%", left: "50%", top: 0,
          transform: `translateX(calc(-50% + ${x}%)) scale(${scale})`,
        }}
      />
      {/* degradado para que el texto se lea */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,56,73,.55) 0%, rgba(10,56,73,0) 30%, rgba(10,56,73,0) 55%, rgba(10,56,73,.85) 100%)" }} />
    </AbsoluteFill>
  );
};

// Entrada con resorte desde abajo
const Pop: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <div style={{ opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + p * 0.1})`, ...style }}>
      {children}
    </div>
  );
};

const Title: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 120, color = "#fff" }) => (
  <div style={{ fontFamily: baloo, fontWeight: 800, fontSize: size, lineHeight: 1.02, color, textAlign: "center", textShadow: "0 6px 24px rgba(0,0,0,.35)" }}>
    {children}
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string }> = ({ children, bg = "#fff", color = BLUE_DEEP }) => (
  <div style={{ fontFamily: nunito, fontWeight: 800, fontSize: 54, background: bg, color, padding: "18px 40px", borderRadius: 999, boxShadow: "0 12px 30px rgba(0,0,0,.25)", textAlign: "center" }}>
    {children}
  </div>
);

const WaIcon: React.FC<{ size?: number; color?: string }> = ({ size = 60, color = "#fff" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.513 5.26l-.999 3.648 3.736-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const WaNumbers: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
    {["53603933", "52689067"].map((n, i) => (
      <Pop key={n} delay={delay + i * 6}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, background: WA, color: "#fff", padding: "18px 44px", borderRadius: 999, fontFamily: nunito, fontWeight: 900, fontSize: 64, boxShadow: "0 12px 30px rgba(0,0,0,.25)" }}>
          <WaIcon size={62} /> {n}
        </div>
      </Pop>
    ))}
  </div>
);

// Cada escena entra con fundido
const Scene: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Bottom: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 70px 260px", gap: 28 }}>{children}</AbsoluteFill>
);

// Tiempos alineados con las pausas de la locución (segundos)
const T = [0, 3.9, 7.1, 10.25, 14.7, 19.2, 23.6, 30];

export const Reel: React.FC = () => {
  const seq = (i: number) => ({ from: s(T[i]), durationInFrames: s(T[i + 1] - T[i]) + FADE });
  return (
    <AbsoluteFill style={{ backgroundColor: BLUE_DEEP }}>
      <Sequence {...seq(0)}>
        <Scene>
          <PanPhoto src="photo_2026-06-12_17-25-15.jpg" dur={seq(0).durationInFrames} />
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
            <Pop><Img src={staticFile("logo.webp")} style={{ width: 300, borderRadius: "50%", boxShadow: "0 12px 40px rgba(0,0,0,.35)" }} /></Pop>
          </AbsoluteFill>
          <Bottom>
            <Pop delay={4}><Title size={130}>¿Tienes calor?</Title></Pop>
            <Pop delay={40}><Chip bg={YELLOW}>Piscina La Elisa · Boyeros</Chip></Pop>
          </Bottom>
        </Scene>
      </Sequence>

      <Sequence {...seq(1)}>
        <Scene>
          <PanPhoto src="photo_2026-06-12_17-26-05.jpg" dir={-1} dur={seq(1).durationInFrames} />
          <Bottom>
            <Pop><Title>Agua fresquita</Title></Pop>
            <Pop delay={10}><Chip>Sol · Música · Dominó</Chip></Pop>
          </Bottom>
        </Scene>
      </Sequence>

      <Sequence {...seq(2)}>
        <Scene>
          <PanPhoto src="photo_2026-06-12_17-26-08.jpg" dur={seq(2).durationInFrames} />
          <Bottom>
            <Pop><Title size={110}>Un día completo con la familia y los amigos</Title></Pop>
          </Bottom>
        </Scene>
      </Sequence>

      <Sequence {...seq(3)}>
        <Scene>
          <PanPhoto src="photo_2026-06-12_17-26-11.jpg" dir={-1} dur={seq(3).durationInFrames} />
          <Bottom>
            <Pop><Title>Hasta 15 personas</Title></Pop>
            <Pop delay={30}><Chip bg={YELLOW}>10:00 AM – 6:00 PM</Chip></Pop>
          </Bottom>
        </Scene>
      </Sequence>

      <Sequence {...seq(4)}>
        <Scene>
          <PanPhoto src="photo_2026-06-12_17-26-18.jpg" dur={seq(4).durationInFrames} />
          <Bottom>
            <Pop><Title size={100}>¿Quieres más?</Title></Pop>
            <Pop delay={30}><Chip>Horno con carbón</Chip></Pop>
            <Pop delay={55}><Chip>Nevera con hielo</Chip></Pop>
            <Pop delay={80}><Chip>Wifi</Chip></Pop>
          </Bottom>
        </Scene>
      </Sequence>

      <Sequence {...seq(5)}>
        <Scene>
          <PanPhoto src="photo_2026-06-12_17-26-25.jpg" dir={-1} dur={seq(5).durationInFrames} />
          <Bottom>
            <Pop><Title size={120}>¡Reserva ya por WhatsApp!</Title></Pop>
            <WaNumbers delay={14} />
          </Bottom>
        </Scene>
      </Sequence>

      <Sequence {...seq(6)}>
        <Scene>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, #1aa9d6 0%, #0b6f93 55%, #0a3849 100%)", alignItems: "center", justifyContent: "center", gap: 44, padding: 70 }}>
            <Pop><Img src={staticFile("logo.webp")} style={{ width: 380, borderRadius: "50%", boxShadow: "0 16px 50px rgba(0,0,0,.35)" }} /></Pop>
            <Pop delay={6}><Title size={110}>Tu día de sol te está esperando</Title></Pop>
            <Pop delay={14}><Chip bg={YELLOW}>Boyeros · La Habana</Chip></Pop>
            <WaNumbers delay={22} />
          </AbsoluteFill>
        </Scene>
      </Sequence>

      <Audio src={staticFile("voz.mp3")} />
    </AbsoluteFill>
  );
};
