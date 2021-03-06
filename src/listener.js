import bsod from "./lib/bsod";
import Stomp from "@stomp/stompjs";

const SOCK = "wss://events.nix.gsc.io:15671/ws";
const AUTH = "logstream";

/**
 * Listener interface; subscribes to the queue and uses the given callback.
 */
class Listener {
	constructor({key, logger, fn}) {
		this.subscription = null;
		this.key = key;
		this.fn = fn;
		this.logger = logger;
		this.logger("Socket created...", "ofborg");
		this.client = Stomp.client(SOCK);
		this.client.debug = (str) => this.debug_callback(str);
		this.connect();
	}

	/**
	 * Catches stomp.js debug log.
	 * window.DEBUG can be set (using param debug=true) to help debug issues.
	 */
	debug_callback(str) {
		if (window.DEBUG) {
			/* eslint-disable no-control-regex */
			const cleaned = str.replace(/[\x00\s]+$/g, "").trim();
			/* eslint-enable */
			this.logger(cleaned, "stomp");
		}
	}

	connect() {
		this.client.connect(
			AUTH, AUTH,
			() => this.connected(),
			() => bsod("Couldn't connect to websocket.\n\nMake sure content blockers (noscript, µblock) are not blocking websockets.")
		);
	}

	disconnect() {
		this.logger("Disconnecting...", "ofborg");
		this.client.disconnect(
			() => this.logger("Disconnected.", "ofborg")
		);
	}

	connected() {
		this.logger("Connected...", "ofborg");
		this.logger(`Subscribing to "${this.key}"...`, "ofborg");
		this.subscription = this.client.subscribe(
			`/exchange/logs/${encodeURIComponent(this.key)}`,
			(m) => this.on_message(JSON.parse(m.body), m)
		);
	}

	/**
	 * Handler for messages.
	 */
	on_message(msg, raw) {
		// Get the routing key, which will be used to fetch the backlogs.
		const destination = raw.headers["destination"].split("/");
		const routing = decodeURIComponent(destination[destination.length - 1]);
		this.receive(msg, routing);
	}

	/**
	 * Conditionally calls the callback registered.
	 */
	receive(...args) {
		if (this.fn) {
			return this.fn(...args);
		}
	}
}

export default Listener;
