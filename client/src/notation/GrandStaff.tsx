import { useEffect, useRef, useState } from 'react';
import { Box, Loader, useComputedColorScheme } from '@mantine/core';
import { loadVexFlow, midiToVexKey } from './vexflow';
import type { StaffNote } from './Staff';

interface Props {
  /** bars of both hands; a hand without notes in a bar stays empty */
  bars: { rh: StaffNote[]; lh: StaffNote[] }[];
  /** time signature on the first bar (omitted for single notes) */
  time?: string;
  height?: number;
  /** text alternative for screen readers */
  label: string;
  /** on paper (print): always black ink */
  paper?: boolean;
}

const COLORS = {
  current: '#d9480f', // orange-9
  done: '#087f5b', // teal-9
  wrong: '#c92a2a', // red-9
};

/** Logical height of the drawing (two staves with room for ledger lines and names). */
const LOGICAL_HEIGHT = 250;

/**
 * The grand staff: treble (right hand) and bass (left hand) joined by a brace,
 * drawn with VexFlow and scaled to the container. Notes of both hands that
 * start together are aligned.
 */
export function GrandStaff({ bars, time, height = 240, label, paper = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry!.contentRect.width)));
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const computed = useComputedColorScheme('light');
  const scheme = paper ? 'light' : computed;
  const key = JSON.stringify({ bars, time, height, width, scheme });
  useEffect(() => {
    const el = host.current;
    if (!el || width < 50) return;
    let cancelled = false;
    void loadVexFlow().then((VF) => {
      if (cancelled) return;
      el.innerHTML = '';
      const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
      renderer.resize(width, height);
      const ctx = renderer.getContext();
      const ink = scheme === 'dark' ? '#e9ecef' : '#000000';
      ctx.setFillStyle(ink);
      ctx.setStrokeStyle(ink);
      const scale = Math.max(0.7, Math.min(1.5, height / LOGICAL_HEIGHT));
      ctx.scale(scale, scale);

      const full = width / scale - 20;
      const single = bars.length === 1 && bars[0]!.rh.length + bars[0]!.lh.length <= 2 && !time;
      const total = single ? Math.min(full, 220) : full;
      const left = (width / scale - total) / 2;
      const top = (height / scale - 200) / 2;
      const [num = 4, den = 4] = (time ?? '4/4').split('/').map(Number);
      const extra = time ? 80 : 55;
      const barWidth = (total - extra) / bars.length;

      const makeNotes = (notes: StaffNote[], clef: 'treble' | 'bass') =>
        notes.map((n) => {
          const duration = n.duration ?? 'w';
          const rest = duration.endsWith('r');
          const vexKey = rest ? (clef === 'bass' ? 'd/3' : 'b/4') : midiToVexKey(n.midi);
          const note = new VF.StaveNote({ keys: [vexKey], duration, clef });
          if (!rest && vexKey.includes('#')) note.addModifier(new VF.Accidental('#'), 0);
          if (/^\w+d$/.test(duration) && !rest) VF.Dot.buildAndAttach([note], { all: true });
          if (n.label) {
            note.addModifier(
              new VF.Annotation(n.label)
                .setFont('Nunito Variable', 13, 'bold')
                .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
              0,
            );
          }
          if (n.state) note.setStyle({ fillStyle: COLORS[n.state], strokeStyle: COLORS[n.state] });
          return note;
        });

      let x = left;
      bars.forEach((bar, i) => {
        const w = barWidth + (i === 0 ? extra : 0);
        const treble = new VF.Stave(x, top, w);
        const bass = new VF.Stave(x, top + 100, w);
        if (i === 0) {
          treble.addClef('treble');
          bass.addClef('bass');
          if (time) {
            treble.addTimeSignature(time);
            bass.addTimeSignature(time);
          }
        }
        treble.setContext(ctx).draw();
        bass.setContext(ctx).draw();
        if (i === 0) {
          new VF.StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
          new VF.StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();
        }
        new VF.StaveConnector(treble, bass).setType('singleRight').setContext(ctx).draw();
        x += w;

        const voices: {
          voice: InstanceType<typeof VF.Voice>;
          stave: InstanceType<typeof VF.Stave>;
        }[] = [];
        for (const [notes, clef, stave] of [
          [bar.rh, 'treble', treble],
          [bar.lh, 'bass', bass],
        ] as const) {
          if (!notes.length) continue;
          const staveNotes = makeNotes(notes, clef);
          const voice = new VF.Voice({ numBeats: num, beatValue: den })
            .setMode(VF.Voice.Mode.SOFT)
            .addTickables(staveNotes);
          voices.push({ voice, stave });
        }
        if (!voices.length) return;
        // align both hands: format the voices together on the same width
        const formatter = new VF.Formatter();
        voices.forEach(({ voice }) => formatter.joinVoices([voice]));
        formatter.formatToStave(
          voices.map((v) => v.voice),
          treble,
        );
        for (const { voice, stave } of voices) {
          const beams = VF.Beam.generateBeams(
            voice.getTickables() as InstanceType<typeof VF.StaveNote>[],
          );
          voice.draw(ctx, stave);
          beams.forEach((b) => b.setContext(ctx).draw());
        }
      });
      el.querySelector('svg')?.setAttribute('aria-hidden', 'true');
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <Box pos="relative" w="100%" h={height} role="img" aria-label={label}>
      <div ref={host} style={{ width: '100%', height }} />
      {!ready && (
        <Loader
          pos="absolute"
          top="50%"
          left="50%"
          style={{ transform: 'translate(-50%, -50%)' }}
          aria-hidden
        />
      )}
    </Box>
  );
}
