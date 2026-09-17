document.addEventListener("DOMContentLoaded", loadUpcomingEvents);


async function loadUpcomingEvents() {

    const container =
        document.getElementById("upcoming-events");


    if (!container) {
        return;
    }


    try {

        // Date.now() prevents the browser from showing
        // an older cached version of the event data.
        const response = await fetch(
            `data/upcoming-events.json?v=${Date.now()}`,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {
            throw new Error(
                `Unable to load events: ${response.status}`
            );
        }


        const events = await response.json();


        // =================================================
        // NO UPCOMING EVENTS
        // =================================================

        if (!Array.isArray(events) || events.length === 0) {

            container.innerHTML = `
                <p class="events-empty">
                    No upcoming events currently scheduled.
                </p>
            `;

            return;
        }


        // =================================================
        // BUILD EVENT CARDS
        // =================================================

        container.innerHTML = events
            .slice(0, 3)
            .map(createEventCard)
            .join("");


    }

    catch (error) {

        console.error(
            "FMA calendar could not be loaded:",
            error
        );


        container.innerHTML = `
            <p class="events-empty">
                Upcoming events are currently unavailable.
            </p>
        `;

    }

}



function createEventCard(event) {

    const start = new Date(event.start);
    const end = new Date(event.end);


    // =================================================
    // DATE
    // =================================================

    const month = start
        .toLocaleDateString(
            "en-US",
            {
                month: "short",
                timeZone: "America/Denver"
            }
        )
        .toUpperCase();


    const day = start
        .toLocaleDateString(
            "en-US",
            {
                day: "2-digit",
                timeZone: "America/Denver"
            }
        );


    // =================================================
    // EVENT DETAILS
    // =================================================

    let eventDetails = "";


    if (event.allDay) {

        eventDetails = "All Day";

    }

    else {

        const startTime = start.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "America/Denver"
            }
        );


        const endTime = end.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "America/Denver"
            }
        );


        eventDetails =
            `${startTime} – ${endTime}`;

    }


    if (event.location) {

        eventDetails +=
            ` · ${escapeHTML(event.location)}`;

    }


    // =================================================
    // CARD
    // =================================================

    return `

        <article class="event-card">


            <div class="event-date">

                <span class="event-month">
                    ${month}
                </span>

                <span class="event-day">
                    ${day}
                </span>

            </div>



            <div class="event-info">

                <p class="event-type">
                    FMA EVENT
                </p>


                <h3>
                    ${escapeHTML(event.title)}
                </h3>


                <p class="event-details">
                    ${eventDetails}
                </p>

            </div>



            <a
                href="events.html"
                class="event-arrow"
                aria-label="View all FMA events"
            >
                →
            </a>


        </article>

    `;

}



function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}