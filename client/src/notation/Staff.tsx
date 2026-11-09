import { useEffect, useRef, useState } from 'react';
import { Box, Loader, useComputedColorScheme } from '@mantine/core';
import { spellingOf, type KeySignature, type Spelling } from '@klavio/shared';
import { accidentalFor, loadVexFlow, midiToVexKey } from './vexflow';

export interface StaffNote {
  midi: number;
  /** VexFlow duration: 'w' whole, 'h' half, 'q' quarter, '8' eighth (+ 'd' dotted, 'r' rest). */
  duration?: string;
  /** Highlight: current note, already played, or wrong. */
  state?: 'current' | 'done' | 'wrong';
  /** Small text below the note (e.g. its name). */
  label?: string;
  /** Finger number above the note (1 = thumb … 5 = little finger). */
  finger?: number;
  /** Tied to the next note: drawn with a tie arc. */
  tie?: boolean;
}

interface Props {
  clef: 'treble' | 'bass';
  /** A single bar of notes … */
  notes?: StaffNote[];
  /** … or several bars, drawn side by side with bar lines. */
  bars?: StaffNote[][];
  /** Time signature, e.g. "4/4"; omitted for single notes. */
  time?: string;
  height?: number;
  /** Text alternative for screen readers. */
  label: string;
  /** Key signature after the clef (G major: F♯, F major: B♭). */
  keySignature?: KeySignature;
  /** Black keys with ♭ or ♯ (default: as the key signature says, else ♯). */
  spelling?: Spelling;
}

const COLORS = {
  current: '#d9480f', // orange-9
  done: '#087f5b', // teal-9
  wrong: '#c92a2a', // red-9
};

/** One line of music, drawn with VexFlow as SVG and scaled to the container width. */
export function Staff({
  clef,
  notes,
  bars: barsProp,
  time,
  height = 160,
  label,
  keySignature = 'C',
  spelling: spellingProp,
}: Props) {
  const spelling = spellingProp ?? spellingOf(keySignature);
  const bars = barsProp ?? [notes ?? []];
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

  const scheme = useComputedColorScheme('light');
  const key = JSON.stringify({ clef, bars, time, height, width, scheme, keySignature, spelling });
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
      // VexFlow draws black by default – invisible on a dark background
      const ink = scheme === 'dark' ? '#e9ecef' : '#000000';
      ctx.setFillStyle(ink);
      ctx.setStrokeStyle(ink);
      // VexFlow draws at 1:1; enlarge for readability on tablets
      const scale = Math.min(1.6, Math.max(1, height / 110));
      ctx.scale(scale, scale);
      const full = width / scale - 20;
      const single = bars.length === 1 && bars[0]!.length <= 1;
      // a single note on a short, centred staff instead of far left on a long one
      const total = single ? Math.min(full, 170) : full;
      const left = (width / scale - total) / 2;
      const top = (height / scale - 90) / 2 - (bars.some((b) => b.some((n) => n.label)) ? 10 : 0);
      const [num = 4, den = 4] = (time ?? '4/4').split('/').map(Number);
      // the first bar also carries clef and time signature
      const extra = (time ? 70 : 45) + (keySignature !== 'C' ? 18 : 0);
      const barWidth = (total - extra) / bars.length;

      let x = left;
      // every drawn note with its tie flag, to draw the tie arcs at the end
      const drawn: { note: InstanceType<typeof VF.StaveNote>; tie?: boolean }[] = [];
      bars.forEach((bar, i) => {
        const w = barWidth + (i === 0 ? extra : 0);
        const stave = new VF.Stave(x, top, w);
        if (i === 0) {
          stave.addClef(clef);
          if (keySignature !== 'C') stave.addKeySignature(keySignature);
          if (time) stave.addTimeSignature(time);
        }
        if (i === bars.length - 1 && bars.length > 1) stave.setEndBarType(VF.Barline.type.SINGLE);
        stave.setContext(ctx).draw();
        x += w;

        const staveNotes = bar.map((n) => {
          const duration = n.duration ?? 'w';
          const rest = duration.endsWith('r');
          // rests sit in the middle of the staff, whatever the pitch
          const vexKey = rest ? (clef === 'bass' ? 'd/3' : 'b/4') : midiToVexKey(n.midi, spelling);
          const note = new VF.StaveNote({ keys: [vexKey], duration, clef });
          const sign = rest ? null : accidentalFor(n.midi, spelling, keySignature);
          if (sign) note.addModifier(new VF.Accidental(sign), 0);
          if (/^\w+d$/.test(duration) && !rest) VF.Dot.buildAndAttach([note], { all: true });
          if (n.label) {
            note.addModifier(
              new VF.Annotation(n.label)
                .setFont('Nunito Variable', 13, 'bold')
                .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM),
              0,
            );
          }
          if (n.finger && !rest) {
            note.addModifier(
              new VF.Annotation(String(n.finger))
                .setFont('Nunito Variable', 12, 'bold')
                .setVerticalJustification(VF.Annotation.VerticalJustify.TOP),
              0,
            );
          }
          if (n.state) note.setStyle({ fillStyle: COLORS[n.state], strokeStyle: COLORS[n.state] });
          drawn.push({ note, tie: n.tie });
          return note;
        });
        if (!staveNotes.length) return;
        const voice = new VF.Voice({ numBeats: num, beatValue: den })
          .setMode(VF.Voice.Mode.SOFT)
          .addTickables(staveNotes);
        const beams = VF.Beam.generateBeams(staveNotes);
        new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);
        voice.draw(ctx, stave);
        beams.forEach((b) => b.setContext(ctx).draw());
      });
      drawn.forEach(({ note, tie }, i) => {
        const next = drawn[i + 1];
        if (!tie || !next) return;
        new VF.StaveTie({
          firstNote: note,
          lastNote: next.note,
          firstIndexes: [0],
          lastIndexes: [0],
        })
          .setContext(ctx)
          .draw();
      });
      const svg = el.querySelector('svg');
      svg?.setAttribute('aria-hidden', 'true');
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
