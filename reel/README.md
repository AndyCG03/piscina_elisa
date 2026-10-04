# Reel promocional (Remotion)

Vídeo vertical 1080x1920, 30 s, con fotos de la galería y locución con voz cubana (ElevenLabs, voz "Claudia") en `public/voz.mp3`.

```bash
cd reel
npm install
npm run render   # genera out/reel-la-elisa.mp4
npx remotion studio src/index.ts   # editor visual
```

Los tiempos de cada escena (array `T` en `src/Reel.tsx`) están alineados con las pausas de la locución.
