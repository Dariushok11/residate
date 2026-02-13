// Simplified iCal parser to extract VEVENT objects
export function parseICal(icalData: string) {
    const events: any[] = [];
    const lines = icalData.split(/\r\n|\n|\r/);
    let event: any = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle line unfolding (lines starting with space are continuations)
        while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
            line = line + lines[i + 1].substring(1);
            i++;
        }

        if (line.startsWith('BEGIN:VEVENT')) {
            event = {};
        } else if (line.startsWith('END:VEVENT')) {
            if (event) events.push(event);
            event = null;
        } else if (event) {
            const [key, ...valueParts] = line.split(':');
            let value = valueParts.join(':');

            // Extract core properties we need
            if (key.startsWith('DTSTART')) {
                // Remove TZID params if present for simplicity in this demo, or handle better
                event.start = parseICalDate(value);
            } else if (key.startsWith('DTEND')) {
                event.end = parseICalDate(value);
            } else if (key.startsWith('SUMMARY')) {
                event.summary = value;
            } else if (key.startsWith('DESCRIPTION')) {
                event.description = value;
            }
        }
    }
    return events;
}

function parseICalDate(dateStr: string): Date {
    // Basic support for "YYYYMMDDTHHMMSSZ"
    // Remove "Z" just to treat as local for this simple implementation or handle timezone
    const cleanStr = dateStr.replace('Z', '');
    const year = parseInt(cleanStr.substring(0, 4));
    const month = parseInt(cleanStr.substring(4, 6)) - 1;
    const day = parseInt(cleanStr.substring(6, 8));
    const hour = parseInt(cleanStr.substring(9, 11));
    const minute = parseInt(cleanStr.substring(11, 13));

    // Very naive timezone handling (assuming generic UTC/local match for demo purposes)
    return new Date(year, month, day, hour, minute);
}
