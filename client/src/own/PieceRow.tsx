import { ActionIcon, Menu, Text, ThemeIcon } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import classes from './PieceRow.module.css';

export interface RowAction {
  label: string;
  icon: ReactNode;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
}

/**
 * One piece in a list (path songs, own pieces, the collection, the library):
 * a single card. Tapping it opens the piece; on the right only «Anhören» and
 * one more button – the other things (notes, print, rename …) are in its menu.
 */
export function PieceRow({
  to,
  icon,
  color,
  title,
  meta,
  badge,
  listen,
  actions = [],
  trailing,
  locked = false,
  testId,
}: {
  /** where tapping the row goes */
  to?: string;
  /** a song that comes later: greyed out */
  locked?: boolean;
  /** the round sign at the start (left out where room is short, e.g. in a dialog) */
  icon?: ReactNode;
  color?: string;
  title: string;
  /** one line under the title: composer, length, hands … */
  meta?: ReactNode;
  badge?: ReactNode;
  /** the «Hörprobe» button */
  listen?: ReactNode;
  /** one action is a button of its own, more go into a menu */
  actions?: RowAction[];
  /** a button of its own at the end (the library's «Hinzufügen») */
  trailing?: ReactNode;
  testId?: string;
}) {
  const { t } = useTranslation();
  const body = (
    <>
      {icon && (
        <ThemeIcon size={44} radius="xl" color={color} aria-hidden className={classes.icon}>
          {icon}
        </ThemeIcon>
      )}
      <div className={classes.text}>
        <Text fw={800} lh={1.25} className={classes.title}>
          {title}
        </Text>
        {meta && (
          <Text size="sm" c="dimmed" lh={1.35}>
            {meta}
          </Text>
        )}
        {badge}
      </div>
    </>
  );
  const single = actions.length === 1 ? actions[0]! : null;
  return (
    <div
      className={classes.row}
      data-locked={locked || undefined}
      data-link={to ? true : undefined}
    >
      {to ? (
        <Link to={to} className={classes.main} data-testid={testId}>
          {body}
        </Link>
      ) : (
        <div className={classes.main} data-testid={testId}>
          {body}
        </div>
      )}
      {(listen || actions.length > 0 || trailing) && (
        <div className={classes.actions}>
          {listen}
          {single &&
            (single.to ? (
              <ActionIcon
                component={Link}
                to={single.to}
                variant="subtle"
                radius="xl"
                size={48}
                aria-label={single.label}
              >
                {single.icon}
              </ActionIcon>
            ) : (
              <ActionIcon
                variant="subtle"
                radius="xl"
                size={48}
                aria-label={single.label}
                onClick={single.onClick}
              >
                {single.icon}
              </ActionIcon>
            ))}
          {actions.length > 1 && (
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  radius="xl"
                  size={48}
                  aria-label={t('own.more', { title })}
                >
                  <IconDots size={24} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {actions.map((a) =>
                  a.to ? (
                    <Menu.Item key={a.label} component={Link} to={a.to} leftSection={a.icon}>
                      {a.label}
                    </Menu.Item>
                  ) : (
                    <Menu.Item
                      key={a.label}
                      leftSection={a.icon}
                      onClick={a.onClick}
                      color={a.danger ? 'red' : undefined}
                    >
                      {a.label}
                    </Menu.Item>
                  ),
                )}
              </Menu.Dropdown>
            </Menu>
          )}
          {trailing}
        </div>
      )}
    </div>
  );
}
