import { useEffect, useRef, useState } from 'react';
import { Box, Loader } from '@mantine/core';
import { loadVexFlow, midiToVexKey } from './vexflow';

export interface StaffNote {
  midi: number;
  /** VexFlow duration: 'w' whole, 'h' half, 'q' quarter, '8' eighth (+ 'd' dotted). */
  duration?: string;
  /** Highlight: current note, already played, or wrong. */
  state?: 'current' | 'done' | 'wrong';
}

interface Props {
  clef: 'treble' | 'bass';
  notes: StaffNote[];
  /** Time signature, e.g. "4/4"; omitted for single notes. */
  time?: string;
  height?: number;
  /** Text alternative for screen readers. */
  label: string;
}

const COLORS = {
  current: '#d9480f', // orange-9
  done: '#087f5b', // teal-9
  wrong: '#c92a2a', // red-9
};

/** One line of music, drawn with VexFlow as SVG and scaled to the container width. */
export function Staff({ clef, notes, time, height = 160, label }: Props) {
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

  const key = JSON.stringify({ clef, notes, time, height, width });
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
      // VexFlow draws at 1:1; enlarge for readability on tablets
      const scale = Math.min(1.6, Math.max(1, height / 110));
      ctx.scale(scale, scale);
      const full = width / scale - 20;
      // a single note on a short, centred staff instead of far left on a long one
      const staveWidth = notes.length <= 1 ? Math.min(full, 170) : full;
      const x = (width / scale - staveWidth) / 2;
      const stave = new VF.Stave(x, (height / scale - 90) / 2, staveWidth);
      stave.addClef(clef);
      if (time) stave.addTimeSignature(time);
      stave.setContext(ctx).draw();

      const staveNotes = notes.map((n) => {
        const vexKey = midiToVexKey(n.midi);
        const note = new VF.StaveNote({ keys: [vexKey], duration: n.duration ?? 'w', clef });
        if (vexKey.includes('#')) note.addModifier(new VF.Accidental('#'), 0);
        if (n.duration?.includes('d')) VF.Dot.buildAndAttach([note], { all: true });
        if (n.state) note.setStyle({ fillStyle: COLORS[n.state], strokeStyle: COLORS[n.state] });
        return note;
      });
      if (staveNotes.length) {
        VF.Formatter.FormatAndDraw(ctx, stave, staveNotes, { autoBeam: true });
      }
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
