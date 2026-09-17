document.addEventListener(
    "DOMContentLoaded",
    initializeFMACalendar
);


const FMA_TIMEZONE = "America/Denver";

let calendarEvents = [];

let displayedMonth = new Date();
displayedMonth.setDate(1);



async function initializeFMACalendar() {

    const calendarGrid =
        document.getElementById("calendar-grid");

    if (!calendarGrid) {
        return;
    }


    setupCalendarControls();


    try {

        const response = await fetch(
            `data/upcoming-events.json?v=${Date.now()}`,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {

            throw new Error(
                `Unable to load calendar: ${response.status}`
            );

        }


        const data = await response.json();

        calendarEvents =
            Array.isArray(data)
                ? data
                : [];


        calendarEvents.sort(
            (a, b) =>
                new Date(a.start) -
                new Date(b.start)
        );


        renderCalendar();
        renderUpcomingAgenda();

    }

    catch (error) {

        console.error(
            "Unable to load FMA calendar:",
            error
        );


        calendarGrid.innerHTML = `

            <div class="calendar-error">

                Calendar currently unavailable.

            </div>

        `;


        const agenda =
            document.getElementById(
                "events-agenda-list"
            );


        if (agenda) {

            agenda.innerHTML = `

                <p class="calendar-empty">
                    Upcoming events are currently unavailable.
                </p>

            `;

        }

    }

}



function setupCalendarControls() {

    const previous =
        document.getElementById("calendar-prev");

    const next =
        document.getElementById("calendar-next");

    const today =
        document.getElementById("calendar-today");


    previous?.addEventListener(
        "click",
        () => {

            displayedMonth.setMonth(
                displayedMonth.getMonth() - 1
            );

            renderCalendar();

        }
    );


    next?.addEventListener(
        "click",
        () => {

            displayedMonth.setMonth(
                displayedMonth.getMonth() + 1
            );

            renderCalendar();

        }
    );


    today?.addEventListener(
        "click",
        () => {

            displayedMonth = new Date();

            displayedMonth.setDate(1);

            renderCalendar();

        }
    );

}



function renderCalendar() {

    const calendarGrid =
        document.getElementById("calendar-grid");

    const title =
        document.getElementById(
            "calendar-month-title"
        );


    if (!calendarGrid || !title) {
        return;
    }


    const year =
        displayedMonth.getFullYear();

    const month =
        displayedMonth.getMonth();


    title.textContent =
        displayedMonth.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);

    const daysInMonth =
        lastDay.getDate();

    const startingWeekday =
        firstDay.getDay();


    const previousMonthLastDay =
        new Date(
            year,
            month,
            0
        ).getDate();


    const cells = [];


    // =================================================
    // PREVIOUS MONTH CELLS
    // =================================================

    for (
        let i = startingWeekday - 1;
        i >= 0;
        i--
    ) {

        cells.push({
            day:
                previousMonthLastDay - i,
            currentMonth: false,
            offset: -1
        });

    }


    // =================================================
    // CURRENT MONTH CELLS
    // =================================================

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        cells.push({
            day,
            currentMonth: true,
            offset: 0
        });

    }


    // =================================================
    // NEXT MONTH CELLS
    // =================================================

    let nextMonthDay = 1;

    while (
        cells.length % 7 !== 0 ||
        cells.length < 42
    ) {

        cells.push({
            day: nextMonthDay,
            currentMonth: false,
            offset: 1
        });

        nextMonthDay++;

    }


    calendarGrid.innerHTML =
        cells
            .map(
                cell =>
                    createCalendarCell(
                        cell,
                        year,
                        month
                    )
            )
            .join("");

}



function createCalendarCell(
    cell,
    year,
    month
) {

    const date =
        new Date(
            year,
            month + cell.offset,
            cell.day
        );


    const key =
        localDateKey(date);


    const eventsForDay =
        calendarEvents.filter(
            event =>
                eventDateKey(event.start) === key
        );


    const today =
        localDateKey(new Date());


    const isToday =
        key === today;


    const visibleEvents =
        eventsForDay.slice(0, 2);


    const remaining =
        eventsForDay.length -
        visibleEvents.length;


    return `

        <div
            class="
                calendar-day
                ${cell.currentMonth
                    ? ""
                    : "calendar-day-muted"}
                ${isToday
                    ? "calendar-day-today"
                    : ""}
                ${eventsForDay.length
                    ? "calendar-day-has-event"
                    : ""}
            "
        >

            <div class="calendar-day-number">

                ${cell.day}

            </div>


            <div class="calendar-day-events">

                ${visibleEvents
                    .map(
                        event => `

                            <div
                                class="calendar-event-chip"
                                title="${escapeHTML(
                                    event.title
                                )}"
                            >

                                <span></span>

                                ${escapeHTML(
                                    event.title
                                )}

                            </div>

                        `
                    )
                    .join("")}


                ${
                    remaining > 0
                        ? `

                            <div class="calendar-more-events">

                                +${remaining} more

                            </div>

                        `
                        : ""
                }

            </div>

        </div>

    `;

}



function renderUpcomingAgenda() {

    const container =
        document.getElementById(
            "events-agenda-list"
        );


    if (!container) {
        return;
    }


    const now =
        new Date();


    const upcoming =
        calendarEvents
            .filter(
                event =>
                    new Date(event.end) >= now
            )
            .slice(0, 5);


    if (!upcoming.length) {

        container.innerHTML = `

            <p class="calendar-empty">
                No upcoming events currently scheduled.
            </p>

        `;

        return;

    }


    container.innerHTML =
        upcoming
            .map(
                event =>
                    createAgendaItem(event)
            )
            .join("");

}



function createAgendaItem(event) {

    const start =
        new Date(event.start);

    const end =
        new Date(event.end);


    const month =
        start
            .toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    timeZone:
                        FMA_TIMEZONE
                }
            )
            .toUpperCase();


    const day =
        start.toLocaleDateString(
            "en-US",
            {
                day: "2-digit",
                timeZone:
                    FMA_TIMEZONE
            }
        );


    let timeText =
        "All Day";


    if (!event.allDay) {

        const startTime =
            formatEventTime(start);

        const endTime =
            formatEventTime(end);


        timeText =
            startTime === endTime
                ? startTime
                : `${startTime} – ${endTime}`;

    }


    const location =
        event.location
            ? escapeHTML(
                event.location
            )
            : "Location TBD";


    return `

        <article class="agenda-event">

            <div class="agenda-event-date">

                <span>
                    ${month}
                </span>

                <strong>
                    ${day}
                </strong>

            </div>


            <div class="agenda-event-info">

                <h4>
                    ${escapeHTML(
                        event.title
                    )}
                </h4>

                <p>
                    ${timeText}
                </p>

                <p>
                    ${location}
                </p>

            </div>

        </article>

    `;

}



function formatEventTime(date) {

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit",
            timeZone:
                FMA_TIMEZONE
        }
    );

}



function eventDateKey(value) {

    return zonedDateKey(
        new Date(value)
    );

}



function localDateKey(date) {

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");

}



function zonedDateKey(date) {

    const formatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                timeZone:
                    FMA_TIMEZONE
            }
        );


    const parts =
        formatter.formatToParts(date);


    const values = {};


    parts.forEach(
        part => {

            values[
                part.type
            ] = part.value;

        }
    );


    return `${values.year}-${values.month}-${values.day}`;

}



function escapeHTML(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}