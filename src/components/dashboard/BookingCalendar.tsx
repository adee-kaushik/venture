'use client';
import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

export interface CalendarBooking {
  id: string;
  requestedTime: string;
  status: string;
  details?: Record<string, string>;
}

function istDay(value: string): string | null {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms + 330 * 60_000).toISOString().slice(0, 10) : null;
}
function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-IN', {
    month:'long', year:'numeric', timeZone:'UTC'
  });
}
function changeMonth(year: number, month: number, by: number): {year:number; month:number} {
  const next = new Date(Date.UTC(year, month + by, 1));
  return { year:next.getUTCFullYear(), month:next.getUTCMonth() };
}
function appointmentTime(value: string) {
  const ms = Date.parse(value);
  return Number.isFinite(ms)
    ? new Date(ms).toLocaleTimeString('en-IN', {timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})
    : 'Time needs review';
}

export function BookingCalendar({bookings}: {bookings:CalendarBooking[]}) {
  const today = istDay(new Date().toISOString())!;
  const [view, setView] = useState(() => {
    const [year, month] = today.split('-').map(Number);
    return {year, month:month - 1};
  });
  const [selected, setSelected] = useState(today);
  const grouped = useMemo(() => {
    const result = new Map<string, CalendarBooking[]>();
    for (const booking of bookings) {
      if (booking.status === 'declined') continue;
      const key = istDay(booking.requestedTime);
      if (!key) continue;
      result.set(key, [...(result.get(key) || []), booking]);
    }
    return result;
  }, [bookings]);
  const first = new Date(Date.UTC(view.year, view.month, 1));
  const blanks = first.getUTCDay();
  const days = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells = Math.ceil((blanks + days) / 7) * 7;
  const chosen = grouped.get(selected) || [];
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const pending = bookings.filter(b => b.status === 'pending').length;

  return <section className="rounded-2xl border border-[#DEE7E4] bg-white p-4 sm:p-5 shadow-sm mb-5" aria-label="Booking calendar">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2"><CalendarDays size={17} className="text-teal-700"/>Appointment calendar</h3>
        <p className="text-xs text-stone-500 mt-1">{confirmed} confirmed · {pending} pending · Times in IST</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setView(v => changeMonth(v.year,v.month,-1))} aria-label="Previous month" className="rounded-lg border border-stone-200 p-2 hover:bg-stone-50"><ChevronLeft size={16}/></button>
        <span className="text-sm font-medium min-w-28 text-center">{monthLabel(view.year,view.month)}</span>
        <button type="button" onClick={() => setView(v => changeMonth(v.year,v.month,1))} aria-label="Next month" className="rounded-lg border border-stone-200 p-2 hover:bg-stone-50"><ChevronRight size={16}/></button>
      </div>
    </div>
    <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-stone-500 mb-2">
      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span key={day}>{day}</span>)}
    </div>
    <div className="grid grid-cols-7 gap-1.5">
      {Array.from({length:cells},(_,i)=>{
        const number = i - blanks + 1;
        if (number < 1 || number > days) return <div key={'blank'+i} className="h-11"/>;
        const key = String(view.year)+'-'+String(view.month+1).padStart(2,'0')+'-'+String(number).padStart(2,'0');
        const list = grouped.get(key) || [];
        return <button type="button" key={key} onClick={() => setSelected(key)} aria-label={key+' · '+list.length+' booking requests'} aria-pressed={selected===key}
          className={'h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 border text-xs transition-colors ' +
            (selected===key ? 'bg-teal-700 text-white border-teal-700' : key===today ? 'border-teal-400 text-teal-900 bg-teal-50' : 'border-stone-100 hover:bg-stone-50 text-stone-700')}>
          <span>{number}</span>
          <span className="flex gap-0.5" aria-hidden="true">
            {list.slice(0,3).map(b=><span key={b.id} className={'h-1.5 w-1.5 rounded-full '+
              (b.status==='confirmed' ? (selected===key?'bg-white':'bg-teal-600') : (selected===key?'bg-amber-200':'bg-amber-500'))}/>)}
          </span>
        </button>;
      })}
    </div>
    <div className="border-t border-stone-100 mt-4 pt-4">
      <p className="text-xs font-semibold text-stone-800">{new Date(selected+'T00:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</p>
      {chosen.length ? <div className="grid sm:grid-cols-2 gap-2 mt-2">
        {chosen.map(b=><div key={b.id} className="flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-stone-50 p-3">
          <span className="flex items-center gap-1.5 text-xs text-stone-700"><Clock3 size={13}/>{appointmentTime(b.requestedTime)} · {b.details?.resource || 'Resource unassigned'}</span>
          <span className={'text-[10px] font-medium rounded-full px-2 py-0.5 '+(b.status==='confirmed'?'bg-teal-100 text-teal-800':'bg-amber-100 text-amber-800')}>{b.status}</span>
        </div>)}
      </div> : <p className="text-xs text-stone-500 mt-2">No appointment requests on this date.</p>}
    </div>
  </section>;
}
