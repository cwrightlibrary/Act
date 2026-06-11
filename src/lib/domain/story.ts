/** Slug for a scene location slug (INT., EXT., etc.) */
export type SceneLocation = 'INT.' | 'EXT.' | 'INT./EXT.' | string;

/** A single scene within an act */
export interface Scene {
	id: string;
	title: string;
	summary: string;
	location?: SceneLocation;
	setting?: string;
	/** Raw content — stored as Markdown, rendered as Fountain */
	content: string;
	/** Ordinal within the act */
	order: number;
	/** Character IDs present in the scene */
	characters: string[];
	createdAt: number;
	updatedAt: number;
}

/** A story act (user can add/rename/reorder) */
export interface Act {
	id: string;
	title: string;
	order: number;
	scenes: Scene[];
}

/** A character in the story */
export interface Character {
	id: string;
	name: string;
	/** Protagonist, antagonist, supporting, etc. */
	role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | string;
	description: string;
	arc?: string;
}

/** The full story model */
export interface Story {
	id: string;
	title: string;
	author: string;
	logline: string;
	notes: string;
	acts: Act[];
	characters: Character[];
	/** Optional color tag for dashboard organization */
	color?: string;
	createdAt: number;
	updatedAt: number;
}

/** Creates a new blank story with default three-act structure */
export function createStory(title = 'Untitled Story'): Story {
	const now = Date.now();
	return {
		id: crypto.randomUUID(),
		title,
		author: '',
		logline: '',
		notes: '',
		acts: [
			{ id: crypto.randomUUID(), title: 'Act I — Setup', order: 0, scenes: [] },
			{ id: crypto.randomUUID(), title: 'Act II — Confrontation', order: 1, scenes: [] },
			{ id: crypto.randomUUID(), title: 'Act III — Resolution', order: 2, scenes: [] }
		],
		characters: [],
		createdAt: now,
		updatedAt: now
	};
}

/** Creates a new act */
export function createAct(order: number, title?: string): Act {
	return {
		id: crypto.randomUUID(),
		title: title ?? `Act ${romanNumeral(order + 1)}`,
		order,
		scenes: []
	};
}

function romanNumeral(n: number): string {
	const map: [number, string][] = [
		[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
	];
	let result = '';
	for (const [val, str] of map) {
		while (n >= val) { result += str; n -= val; }
	}
	return result;
}

/** Creates a new scene for a given act */
export function createScene(actOrder: number, order: number, title = 'New Scene', summary = ''): Scene {
	return {
		id: crypto.randomUUID(),
		title,
		summary,
		content: '',
		order,
		characters: [],
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
}

// ── Screenplay (Fountain) ──

export interface Screenplay {
	id: string;
	storyId: string;
	title: string;
	content: string;
	createdAt: number;
	updatedAt: number;
}

export function createScreenplay(storyId: string, title = 'Screenplay'): Screenplay {
	const now = Date.now();
	return {
		id: crypto.randomUUID(),
		storyId,
		title,
		content: '',
		createdAt: now,
		updatedAt: now,
	};
}
