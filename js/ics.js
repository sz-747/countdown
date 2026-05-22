// Calendar (.ics) export.

function pad2(n) { return String(n).padStart(2, '0'); }
function icsDate(d) { return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`; }
function icsDateTime(d) { return `${icsDate(d)}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`; }
function icsStampUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`;
}
function icsEscape(s) { return String(s).replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n'); }

export function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'event'; }

export function assessToEvent(a) {
  return { uid: a.id, title: a.name, date: a.date, allDay: !!a.noTime };
}

export function buildICS(events) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Year 12 Countdown//EN', 'CALSCALE:GREGORIAN'];
  const stamp = icsStampUTC();
  events.forEach(ev => {
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + slugify(String(ev.uid)) + '-' + icsDate(ev.date) + '@year12-countdown');
    lines.push('DTSTAMP:' + stamp);
    if (ev.allDay) {
      const end = new Date(ev.date); end.setDate(end.getDate() + 1);
      lines.push('DTSTART;VALUE=DATE:' + icsDate(ev.date));
      lines.push('DTEND;VALUE=DATE:' + icsDate(end));
    } else {
      const end = new Date(ev.date.getTime() + 3600000);
      lines.push('DTSTART:' + icsDateTime(ev.date));
      lines.push('DTEND:' + icsDateTime(end));
    }
    lines.push('SUMMARY:' + icsEscape(ev.title));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
