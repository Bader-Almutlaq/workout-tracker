import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { database, useDatabaseQuery } from '../../data/database';
import { monthLabel } from '../../format/dateText';
import { calendarGrid } from './calendarGrid';
import styles from './HistoryCalendar.module.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SWIPE_DISTANCE = 50;

/** Month navigation and finished-workout days above the history list. */
export function HistoryCalendar() {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });
  const touchStart = useRef<number | null>(null);
  const navigate = useNavigate();
  const days = useDatabaseQuery(`calendar-${month.year}-${month.month}`, () =>
    database.workoutDaysInMonth(month.year, month.month),
  );
  const today = new Date();
  const changeMonth = (offset: number) => {
    setMonth((current) => {
      const next = new Date(current.year, current.month - 1 + offset, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });
  };
  const selectDay = (ids: readonly number[]) => {
    const first = ids[0];
    if (first === undefined) return;
    if (ids.length === 1) void navigate(`/history/${first}`);
    else document.getElementById(`history-workout-${first}`)?.scrollIntoView({ block: 'start' });
  };

  return (
    <section
      className={styles.calendar}
      aria-label="Workout calendar"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientX;
        if (touchStart.current !== null && end !== undefined) {
          const distance = end - touchStart.current;
          if (Math.abs(distance) >= SWIPE_DISTANCE) changeMonth(distance < 0 ? 1 : -1);
        }
        touchStart.current = null;
      }}
    >
      <div className={styles.header}>
        <button type="button" className={styles.arrow} aria-label="Previous month" onClick={() => changeMonth(-1)}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <h2 className={styles.title}>{monthLabel(month.year, month.month)}</h2>
        <button type="button" className={styles.arrow} aria-label="Next month" onClick={() => changeMonth(1)}>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div className={styles.grid}>
        {WEEKDAYS.map((day) => (
          <span className={styles.weekday} key={day}>
            {day}
          </span>
        ))}
        {calendarGrid(month.year, month.month)
          .flat()
          .map((day, index) => {
            if (day === null) return <span key={`blank-${index}`} />;
            const date = `${month.year.toString().padStart(4, '0')}-${month.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const ids =
              days.status === 'ready' ? (days.value.find((entry) => entry.date === date)?.workoutIds ?? []) : [];
            const isToday =
              today.getFullYear() === month.year && today.getMonth() + 1 === month.month && today.getDate() === day;
            return (
              <button
                key={date}
                type="button"
                className={`${styles.day} ${isToday ? styles.today : ''}`}
                disabled={ids.length === 0}
                aria-label={`${monthLabel(month.year, month.month)} ${day}, ${ids.length} workouts`}
                onClick={() => selectDay(ids)}
              >
                <span>{day}</span>
                {ids.length > 0 && <span className={styles.dot} />}
              </button>
            );
          })}
      </div>
      {days.status === 'failed' && <p className={styles.error}>{days.message}</p>}
    </section>
  );
}
