import bsod from "../lib/bsod";
import html from "../lib/html";
import Log from "./log";

/**
 * Name of the "internal" log, both for system messages
 * and as a fallback logging mechanism.
 */
const INTERNAL_LOG = "-ofborg-";

/**
 * The "Gui" for the app.
 *
 * This handles the tab-like controls to switch the shown log.
 * This handles keeping track of whether it should follow scroll or not.
 *
 * The whole body is scrolled, always.
 */
class Gui {
	constructor() {
		console.log("Creating log interface...."); // eslint-disable-line
		this.setFollowing(true);

		// Registry of Log instances.
		// ({`attempt_id`: instance})
		this.logs = {};

		this.$app = window.document.querySelectorAll("#ofborg-logviewer .app")[0];
		if (!this.$app) {
			return bsod("Couldn't hook app.");
		}

		// Empties app...
		this.$app.innerHTML = "";

		// Logs DOM instance holder.
		this.$logs = html(`<div class="logs"></div>`)[0];
		this.$app.appendChild(this.$logs);

		this.addLog(INTERNAL_LOG);

		// Hooks on scroll
		window.addEventListener("scroll", () => this.watchScroll());
		console.log("... log interface created."); // eslint-disable-line
	}

	addLog(name) {
		const log = new Log(name);
		this.logs[name] = log;
		this.$logs.appendChild(log.$node);
	}

	setFollowing(following) {
		if (following !== this.following) {
			this.following = following;

			const body = window.document.body;
			if (following) {
				body.classList.add("following");
				body.classList.remove("not-following");
			}
			else {
				body.classList.add("not-following");
				body.classList.remove("following");
			}
		}
	}

	/**
	 * Marks the window as auto-scrollable or not when scrolling.
	 */
	watchScroll() {
		const body = window.document.body;
		const scroll_bottom = Math.round(body.scrollTop) + Math.round(window.innerHeight);
		const total_height = body.scrollHeight;

		// Some fudging around because of higher and fractional DPI issues.
		// On 1.5 DPI chrome, it is possible to get the scroll to bottom
		// not matching with the total height *some* times.
		this.setFollowing(Math.abs(total_height - scroll_bottom) < 5);
	}

	/**
	 * Logs the message `msg`, tagged with tag `tag` in log instance `log`.
	 */
	log({msg, tag, log = INTERNAL_LOG}) {
		// Can't find a log?
		if (!this.logs[log]) {
			// Warn in the console
			console.warn(`Couldn't find log "${log}"...`); // eslint-disable-line

			// Makes sure we aren't missing the system log...
			if (log === INTERNAL_LOG) {
				bsod(`Log "${INTERNAL_LOG}" log. This shouldn't have happened.`);
			}

			// Log instead to the internal log.
			this.log({
				msg,
				tag,
				log: INTERNAL_LOG
			});

			return;
		}
		this.logs[log].log(msg, tag);

		// Scroll as needed.
		const body = window.document.body;
		if (this.following) {
			body.scrollTop = body.scrollHeight;
		}
	}
}

export default Gui;