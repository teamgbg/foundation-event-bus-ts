/**
 * @system event-bus
 * @status handwritten
 */

import type { EventBusEvent, EventBusHandler, EventBusPayload } from "./types.ts";

export interface EventBus<T extends EventBusEvent = EventBusPayload> {
	readonly name: string;
	on<U extends T>(type: string, handler: EventBusHandler<U>): () => void;
	emit(event: T): void;
	off(type: string, handler: EventBusHandler): void;
	listenerCount(type?: string): number;
	types(): string[];
	clear(): void;
}

export function createEventBus<T extends EventBusEvent = EventBusPayload>(
	name: string,
): EventBus<T> {
	const listeners = new Map<string, Set<EventBusHandler>>();

	function ensureSet(type: string): Set<EventBusHandler> {
		let set = listeners.get(type);
		if (!set) {
			set = new Set();
			listeners.set(type, set);
		}
		return set;
	}

	return {
		name,

		on<U extends T>(type: string, handler: EventBusHandler<U>): () => void {
			const set = ensureSet(type);
			set.add(handler as EventBusHandler);
			return () => {
				set.delete(handler as EventBusHandler);
				if (set.size === 0) listeners.delete(type);
			};
		},

		emit(event: T): void {
			const exact = listeners.get(event.type);
			const wildcard = listeners.get("*");
			for (const handler of [...(exact ?? []), ...(wildcard ?? [])]) {
				void handler(event);
			}
		},

		off(type: string, handler: EventBusHandler): void {
			listeners.get(type)?.delete(handler);
		},

		listenerCount(type?: string): number {
			if (type) return listeners.get(type)?.size ?? 0;
			let total = 0;
			for (const set of listeners.values()) total += set.size;
			return total;
		},

		types(): string[] {
			return [...listeners.keys()];
		},

		clear(): void {
			listeners.clear();
		},
	};
}
