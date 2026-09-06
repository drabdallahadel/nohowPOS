export const formatCurrency = (amount: number): string => {
  return (amount || 0).toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ج.م';
};

export const formatDate = (timestamp: number, includeTime: boolean = true): string => {
  if (!timestamp) return '—';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };
  return new Date(timestamp).toLocaleString('ar-EG', options);
};

export const formatDateISO = (timestamp: number): string => {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateRangeTimestamps = (
  preset: string,
  customStart?: string,
  customEnd?: string
): { start: number; end: number; label: string } => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  switch (preset) {
    case 'TODAY':
      return { start: todayStart, end: todayEnd, label: 'اليوم' };

    case 'YESTERDAY': {
      const yesterdayStart = todayStart - ONE_DAY;
      const yesterdayEnd = todayStart - 1;
      return { start: yesterdayStart, end: yesterdayEnd, label: 'أمس' };
    }

    case 'LAST_7_DAYS': {
      const start = todayStart - 6 * ONE_DAY;
      return { start, end: todayEnd, label: 'آخر 7 أيام' };
    }

    case 'THIS_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      return { start, end: todayEnd, label: 'هذا الشهر' };
    }

    case 'LAST_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
      return { start, end, label: 'الشهر الماضي' };
    }

    case 'THIS_YEAR': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
      return { start, end: todayEnd, label: 'هذا العام' };
    }

    case 'CUSTOM': {
      const start = customStart ? new Date(customStart + 'T00:00:00').getTime() : 0;
      const end = customEnd ? new Date(customEnd + 'T23:59:59').getTime() : Date.now();
      return { start, end, label: `من ${customStart || 'البداية'} إلى ${customEnd || 'الآن'}` };
    }

    case 'ALL':
    default:
      return { start: 0, end: Date.now() + 86400000, label: 'كافة الفترات' };
  }
};

/**
 * Exports data to CSV with UTF-8 BOM so Excel opens Arabic text cleanly
 */
export const exportToCSV = (
  fileName: string,
  headers: string[],
  rows: (string | number)[][]
): void => {
  const escapeCell = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCell).join(','));

  rows.forEach((row) => {
    csvRows.push(row.map(escapeCell).join(','));
  });

  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
