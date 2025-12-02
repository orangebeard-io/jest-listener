import {ZonedDateTime} from "@js-joda/core";

export function getTime() {
    return ZonedDateTime.now().withFixedOffsetZone().toString();
}

export function getZonedDateTime() {
    return ZonedDateTime.now().withFixedOffsetZone();
}

export function removeAnsi(ansiString: string): string {
    const parts = ansiString.split(/(\u001b\[[0-9;]*[mG])/);
    let result = "";
    for (const part of parts) {
        if (!part.startsWith("\u001b[")) {
            result += part;
        }
    }
    return result;
}
