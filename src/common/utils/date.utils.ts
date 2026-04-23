function getTodayUTC() {
    const nowUTCWithTime = new Date();
    const nowUTCWithoutTime = new Date(Date.UTC(nowUTCWithTime.getUTCFullYear(), nowUTCWithTime.getUTCMonth(), nowUTCWithTime.getUTCDate()));
    return { nowUTCWithTime, nowUTCWithoutTime };
}

function isSameDay(date1: Date, date2: Date) {
    const date1UTC = new Date(Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate()));
    const date2UTC = new Date(Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate()));
    return date1UTC.toISOString() === date2UTC.toISOString();
}

export { getTodayUTC, isSameDay };
