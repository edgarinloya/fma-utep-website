import os
import json
import urllib.request
from datetime import datetime, timedelta, date
from pathlib import Path
from zoneinfo import ZoneInfo

from icalendar import Calendar
import recurring_ical_events


# =====================================================
# SETTINGS
# =====================================================

ICS_URL = os.environ.get("FMA_OUTLOOK_ICS_URL")

TIMEZONE = ZoneInfo("America/Denver")

OUTPUT_FILE = Path("data/upcoming-events.json")


if not ICS_URL:
    raise RuntimeError(
        "FMA_OUTLOOK_ICS_URL environment variable is missing."
    )


# =====================================================
# DOWNLOAD OUTLOOK CALENDAR
# =====================================================

request = urllib.request.Request(
    ICS_URL,
    headers={
        "User-Agent": "FMA-UTEP-Website"
    }
)

with urllib.request.urlopen(request) as response:
    calendar_data = response.read()


calendar = Calendar.from_ical(calendar_data)


# =====================================================
# DATE RANGE
# =====================================================

now = datetime.now(TIMEZONE)

# Look ahead one year so recurring events are included
end_range = now + timedelta(days=365)


# =====================================================
# EXPAND RECURRING EVENTS
# =====================================================

calendar_events = recurring_ical_events.of(calendar).between(
    now,
    end_range
)


events = []


# =====================================================
# PROCESS EVENTS
# =====================================================

for component in calendar_events:

    start_property = component.get("dtstart")

    if not start_property:
        continue

    start_value = start_property.dt


    # -----------------------------
    # ALL-DAY EVENT
    # -----------------------------

    if isinstance(start_value, date) and not isinstance(
        start_value,
        datetime
    ):

        start = datetime(
            start_value.year,
            start_value.month,
            start_value.day,
            tzinfo=TIMEZONE
        )

        all_day = True


    # -----------------------------
    # TIMED EVENT
    # -----------------------------

    else:

        start = start_value

        if start.tzinfo is None:
            start = start.replace(tzinfo=TIMEZONE)
        else:
            start = start.astimezone(TIMEZONE)

        all_day = False


    # =================================================
    # END TIME
    # =================================================

    end_property = component.get("dtend")

    if end_property:

        end_value = end_property.dt

        if isinstance(end_value, date) and not isinstance(
            end_value,
            datetime
        ):

            end = datetime(
                end_value.year,
                end_value.month,
                end_value.day,
                tzinfo=TIMEZONE
            )

        else:

            end = end_value

            if end.tzinfo is None:
                end = end.replace(tzinfo=TIMEZONE)
            else:
                end = end.astimezone(TIMEZONE)

    else:

        end = start


    # =================================================
    # IGNORE EVENTS THAT ALREADY ENDED
    # =================================================

    if end < now:
        continue


    # =================================================
    # EVENT INFORMATION
    # =================================================

    title = str(
        component.get(
            "summary",
            "FMA Event"
        )
    ).strip()


    location = str(
        component.get(
            "location",
            ""
        )
    ).strip()


    uid = str(
        component.get(
            "uid",
            ""
        )
    ).strip()


    events.append(
        {
            "title": title,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "location": location,
            "allDay": all_day,
            "uid": uid
        }
    )


# =====================================================
# SORT EVENTS
# =====================================================

events.sort(
    key=lambda event: event["start"]
)





# =====================================================
# SAVE JSON
# =====================================================

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)


with OUTPUT_FILE.open(
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        events,
        file,
        indent=2,
        ensure_ascii=False
    )


print(
    f"Successfully saved {len(events)} upcoming FMA events."
)

for event in events:

    print(
        f"- {event['title']} | "
        f"{event['start']} | "
        f"{event['location']}"
    )