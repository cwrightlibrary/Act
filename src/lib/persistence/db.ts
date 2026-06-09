import Dexie, { type EntityTable } from 'dexie';
import type { Story, Screenplay } from '$lib/domain/story';

const db = new Dexie('StoryBuilder') as Dexie & {
	stories: EntityTable<Story, 'id'>;
	screenplays: EntityTable<Screenplay, 'id'>;
};

db.version(1).stores({
	stories: 'id, title, updatedAt, createdAt',
});

db.version(2).stores({
	stories: 'id, title, updatedAt, createdAt',
	screenplays: 'id, storyId, title, updatedAt, createdAt',
});

// ── Stories ──

export function getAllStories(): Promise<Story[]> {
	return db.stories.orderBy('updatedAt').reverse().toArray();
}

export function getStory(id: string): Promise<Story | undefined> {
	return db.stories.get(id);
}

export function saveStory(story: Story): Promise<string> {
	// Deep-clone to strip Svelte 5 $state proxy wrappers
	// that IndexedDB's structured clone can't serialize
	const plain = JSON.parse(JSON.stringify({ ...story, updatedAt: Date.now() }));
	return db.stories.put(plain);
}

export function deleteStory(id: string): Promise<void> {
	return db.stories.delete(id);
}

// ── Screenplays ──

export function getScreenplayByStory(storyId: string): Promise<Screenplay | undefined> {
	return db.screenplays.where('storyId').equals(storyId).first();
}

export function getAllScreenplays(): Promise<Screenplay[]> {
	return db.screenplays.toArray();
}

export function saveScreenplay(sp: Screenplay): Promise<string> {
	const plain = JSON.parse(JSON.stringify({ ...sp, updatedAt: Date.now() }));
	return db.screenplays.put(plain);
}

export function deleteScreenplay(id: string): Promise<void> {
	return db.screenplays.delete(id);
}

export default db;
