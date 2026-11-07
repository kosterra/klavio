import type { Avatar } from '@klavio/shared';

const COLORS: Record<Avatar, { face: string; ear: string }> = {
  fox: { face: '#f08c00', ear: '#d9480f' },
  owl: { face: '#a47148', ear: '#7f5539' },
  cat: { face: '#868e96', ear: '#495057' },
  bear: { face: '#9c6644', ear: '#7f4f24' },
  frog: { face: '#40c057', ear: '#2f9e44' },
  whale: { face: '#339af0', ear: '#1971c2' },
};

/** Simple geometric animal faces (own artwork). */
export function ProfileAvatar({
  avatar,
  size = 64,
  label,
}: {
  avatar: Avatar;
  size?: number;
  label?: string;
}) {
  const c = COLORS[avatar];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} {...a11y}>
      <circle cx="50" cy="50" r="50" fill="#fff4e6" />
      {avatar === 'fox' || avatar === 'cat' ? (
        <>
          <path d="M18 40 L26 10 L44 30z" fill={c.ear} />
          <path d="M82 40 L74 10 L56 30z" fill={c.ear} />
        </>
      ) : avatar === 'bear' ? (
        <>
          <circle cx="24" cy="26" r="12" fill={c.ear} />
          <circle cx="76" cy="26" r="12" fill={c.ear} />
        </>
      ) : avatar === 'owl' ? (
        <>
          <path d="M20 30 L30 14 L40 30z" fill={c.ear} />
          <path d="M80 30 L70 14 L60 30z" fill={c.ear} />
        </>
      ) : avatar === 'frog' ? (
        <>
          <circle cx="32" cy="30" r="13" fill={c.face} />
          <circle cx="68" cy="30" r="13" fill={c.face} />
        </>
      ) : (
        <path
          d="M44 16 q6-10 12 0"
          stroke={c.ear}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      <circle cx="50" cy="56" r="32" fill={c.face} />
      {avatar === 'fox' && <path d="M24 60 q26 30 52 0 q-26 10-52 0z" fill="#fff" />}
      {avatar === 'owl' && (
        <>
          <circle cx="38" cy="52" r="11" fill="#fff" />
          <circle cx="62" cy="52" r="11" fill="#fff" />
        </>
      )}
      <circle
        cx={avatar === 'frog' ? 32 : 38}
        cy={avatar === 'frog' ? 30 : 52}
        r="5"
        fill="#1c2559"
      />
      <circle
        cx={avatar === 'frog' ? 68 : 62}
        cy={avatar === 'frog' ? 30 : 52}
        r="5"
        fill="#1c2559"
      />
      {avatar === 'owl' ? (
        <path d="M46 62 L54 62 L50 70z" fill="#f59f00" />
      ) : (
        <path
          d="M42 68 q8 8 16 0"
          stroke="#1c2559"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
